'use client';
import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import useSWR, { mutate } from 'swr';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Copy,
  Check,
  Filter,
  Pause,
  Play,
  Trash2,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RequestDetail } from '@/components/request-detail';
import { getSocket } from '@/lib/socket';
import {
  api,
  API_URL,
  getUserFacingError,
  HTTP_METHODS,
  type RequestLog,
  type SearchResult,
  type Webhook,
} from '@/lib/api';
import { cn, methodColor, statusColor } from '@/lib/utils';

export default function WebhookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: webhook } = useSWR<Webhook>(`/api/webhooks/${id}`);

  const [copied, setCopied] = useState(false);
  const [paused, setPaused] = useState(false);
  const [connected, setConnected] = useState(false);

  // Search filters
  const [methods, setMethods] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('');
  const [ip, setIp] = useState('');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const limit = 50;

  const queryString = useMemo(() => {
    const p = new URLSearchParams({ webhookId: id, page: String(page), limit: String(limit) });
    methods.forEach((m) => p.append('methods', m));
    if (status) p.set('status', status);
    if (ip) p.set('ip', ip);
    if (q) p.set('q', q);
    if (from) p.set('from', new Date(from).toISOString());
    if (to) p.set('to', new Date(to).toISOString());
    return p.toString();
  }, [id, methods, status, ip, q, from, to, page]);

  const swrKey = `/api/requests?${queryString}`;
  const { data, isLoading } = useSWR<SearchResult<RequestLog>>(swrKey);

  const [liveItems, setLiveItems] = useState<RequestLog[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const items = useMemo(() => {
    const base = data?.items ?? [];
    if (page !== 1 || methods.length || status || ip || q || from || to) return base;
    const seen = new Set(base.map((x) => x._id));
    const live = liveItems.filter((x) => !seen.has(x._id));
    return [...live, ...base].slice(0, limit);
  }, [data, liveItems, page, methods, status, ip, q, from, to]);

  const selected = useMemo(
    () => items.find((x) => x._id === selectedId) ?? items[0] ?? null,
    [items, selectedId],
  );

  // Socket subscription
  useEffect(() => {
    const socket = getSocket();
    setConnected(socket.connected);
    const onConnect = () => {
      setConnected(true);
      socket.emit('subscribe:webhook', { webhookId: id });
    };
    const onDisconnect = () => setConnected(false);
    const onNew = (payload: { webhookId: string; request: RequestLog }) => {
      if (payload.webhookId !== id) return;
      if (paused) return;
      setLiveItems((cur) => [payload.request, ...cur].slice(0, 200));
    };
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('request:new', onNew);
    if (socket.connected) {
      socket.emit('subscribe:webhook', { webhookId: id });
    }
    return () => {
      socket.emit('unsubscribe:webhook', { webhookId: id });
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('request:new', onNew);
    };
  }, [id, paused]);

  // When server data refreshes, drop live items already in the page-1 result
  useEffect(() => {
    if (page !== 1) return;
    const ids = new Set((data?.items ?? []).map((x) => x._id));
    setLiveItems((cur) => cur.filter((x) => !ids.has(x._id)));
  }, [data, page]);

  const fullUrl = webhook
    ? `${API_URL}/${webhook.company?.slug}/${webhook.path}`
    : '';

  const onCopy = async () => {
    if (!fullUrl) return;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toggleMethod = useCallback((m: string) => {
    setPage(1);
    setMethods((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));
  }, []);

  const clearFilters = () => {
    setMethods([]);
    setStatus('');
    setIp('');
    setQ('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  const hasFilters = methods.length || status || ip || q || from || to;

  const [confirmingClear, setConfirmingClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const onClearAll = async () => {
    setClearing(true);
    try {
      await api.delete(`/api/requests/webhook/${id}`);
      setLiveItems([]);
      setSelectedId(null);
      mutate(swrKey);
      mutate('/api/companies');
      toast.success('All requests cleared');
      setConfirmingClear(false);
    } catch (e: unknown) {
      toast.error(getUserFacingError(e, 'Failed to clear requests'));
    } finally {
      setClearing(false);
    }
  };

  if (!webhook) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button asChild variant="ghost" size="sm">
          <Link href="/webhooks">
            <ArrowLeft className="h-4 w-4" /> All webhooks
          </Link>
        </Button>
      </div>

      <div className="flex items-end justify-between flex-wrap gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">{webhook.name}</h1>
          <Link
            href={`/companies/${webhook.companyId}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            {webhook.company?.name}
          </Link>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            className={cn(
              'gap-1',
              connected
                ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-600 border-rose-500/30',
            )}
          >
            {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {connected ? 'live' : 'offline'}
          </Badge>
          <Button
            variant={paused ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? <><Play className="h-3.5 w-3.5" /> Resume</> : <><Pause className="h-3.5 w-3.5" /> Pause</>}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setConfirmingClear(true)}>
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-3 flex items-center gap-2">
          <code className="flex-1 truncate text-xs">{fullUrl}</code>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCopy}>
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
            {hasFilters ? (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {HTTP_METHODS.map((m) => {
              const active = methods.includes(m);
              return (
                <button
                  type="button"
                  key={m}
                  onClick={() => toggleMethod(m)}
                  className={cn(
                    'px-2.5 py-1 rounded border text-[11px] font-bold transition-all',
                    active
                      ? methodColor(m)
                      : 'bg-background text-muted-foreground border-border opacity-60 hover:opacity-100',
                  )}
                >
                  {m}
                </button>
              );
            })}
          </div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1">
              <Label className="text-xs">Search</Label>
              <Input
                placeholder="URL, body, UA…"
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select
                value={status || 'all'}
                onValueChange={(v) => {
                  setPage(1);
                  setStatus(v === 'all' ? '' : v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="201">201</SelectItem>
                  <SelectItem value="204">204</SelectItem>
                  <SelectItem value="400">400</SelectItem>
                  <SelectItem value="401">401</SelectItem>
                  <SelectItem value="403">403</SelectItem>
                  <SelectItem value="404">404</SelectItem>
                  <SelectItem value="405">405</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">IP</Label>
              <Input
                placeholder="127.0.0.1"
                value={ip}
                onChange={(e) => {
                  setPage(1);
                  setIp(e.target.value);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input
                type="datetime-local"
                value={from}
                onChange={(e) => {
                  setPage(1);
                  setFrom(e.target.value);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input
                type="datetime-local"
                value={to}
                onChange={(e) => {
                  setPage(1);
                  setTo(e.target.value);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
        <Card className="lg:max-h-[calc(100vh-280px)] flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b shrink-0">
            <span className="text-xs text-muted-foreground">
              {total.toLocaleString()} requests
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ←
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">
                {page}/{Math.max(pages, 1)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                →
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {isLoading && items.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">Loading…</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <p>No requests captured yet.</p>
                <p className="mt-2 text-xs">Send a request to your webhook URL.</p>
              </div>
            ) : (
              <ul>
                {items.map((r) => (
                  <RequestRow
                    key={r._id}
                    request={r}
                    selected={selected?._id === r._id}
                    onSelect={() => setSelectedId(r._id)}
                  />
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardContent className="p-5">
            {selected ? (
              <RequestDetail request={selected} />
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Select a request to inspect it
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirmingClear} onOpenChange={setConfirmingClear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear all requests?</DialogTitle>
            <DialogDescription>
              This permanently deletes every captured request for &quot;{webhook.name}&quot;.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmingClear(false)} disabled={clearing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onClearAll} disabled={clearing}>
              {clearing ? 'Clearing…' : 'Clear all'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RequestRow({
  request,
  selected,
  onSelect,
}: {
  request: RequestLog;
  selected: boolean;
  onSelect: () => void;
}) {
  const fresh = useRef(true);
  useEffect(() => {
    fresh.current = false;
  }, []);
  return (
    <li>
      <button
        onClick={onSelect}
        className={cn(
          'w-full text-left px-3 py-2 border-b last:border-b-0 hover:bg-accent/50 transition-colors',
          selected && 'bg-accent',
          fresh.current && 'flash-new',
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <span
            className={cn(
              'inline-flex px-1.5 py-0.5 rounded border text-[10px] font-bold',
              methodColor(request.method),
            )}
          >
            {request.method}
          </span>
          <span
            className={cn(
              'inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold',
              statusColor(request.responseStatus),
            )}
          >
            {request.responseStatus}
          </span>
          <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">
            {format(new Date(request.receivedAt), 'HH:mm:ss')}
          </span>
        </div>
        <div className="text-xs text-muted-foreground truncate">{request.path}</div>
        <div className="text-[10px] text-muted-foreground/70 truncate">
          {request.ip || 'unknown ip'} · {request.responseTimeMs}ms
        </div>
      </button>
    </li>
  );
}
