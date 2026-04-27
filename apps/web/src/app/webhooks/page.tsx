'use client';
import { useState } from 'react';
import Link from 'next/link';
import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';
import {
  Webhook as WebhookIcon,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Check,
  Activity,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { WebhookForm } from '@/components/webhook-form';
import { api, API_URL, type Company, type Webhook } from '@/lib/api';
import { cn, methodColor } from '@/lib/utils';

export default function WebhooksPage() {
  const { data: companies = [] } = useSWR<Company[]>('/api/companies');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const swrKey =
    companyFilter === 'all'
      ? '/api/webhooks'
      : `/api/webhooks?companyId=${companyFilter}`;
  const { data: webhooks = [], isLoading } = useSWR<Webhook[]>(swrKey);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Webhook | null>(null);

  const close = () => {
    setOpen(false);
    setEditing(null);
    mutate(swrKey);
    mutate('/api/companies');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <WebhookIcon className="h-6 w-6" /> Webhooks
          </h1>
          <p className="text-sm text-muted-foreground">
            Endpoints that capture every incoming request
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-48">
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All companies</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={companies.length === 0}>
                <Plus className="h-4 w-4" /> New webhook
              </Button>
            </DialogTrigger>
            <WebhookForm
              companies={companies}
              defaultCompanyId={companyFilter !== 'all' ? companyFilter : undefined}
              onSaved={close}
            />
          </Dialog>
        </div>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <p className="mb-3">Create a company before adding webhooks.</p>
            <Button asChild>
              <Link href="/companies">Go to companies</Link>
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : webhooks.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <WebhookIcon className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="mb-4">No webhooks for this filter.</p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> New webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {webhooks.map((w) => (
            <WebhookCard key={w._id} webhook={w} onEdit={() => setEditing(w)} />
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && (
          <WebhookForm webhook={editing} companies={companies} onSaved={close} />
        )}
      </Dialog>
    </div>
  );
}

function WebhookCard({ webhook, onEdit }: { webhook: Webhook; onEdit: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullUrl = `${API_URL}/${webhook.company?.slug}/${webhook.path}`;

  const onCopy = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/webhooks/${webhook._id}`);
      toast.success('Webhook deleted');
      mutate((key: any) => typeof key === 'string' && key.startsWith('/api/webhooks'));
      mutate('/api/companies');
      setConfirming(false);
    } catch (e: any) {
      toast.error(e.message ?? 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className={cn('transition-colors hover:border-primary/40', !webhook.enabled && 'opacity-60')}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/webhooks/${webhook._id}`}
              className="font-semibold text-lg hover:underline truncate block"
            >
              {webhook.name}
            </Link>
            <div className="text-xs text-muted-foreground">
              {webhook.company?.name}
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            {!webhook.enabled && (
              <Badge className="bg-muted text-muted-foreground border-border">disabled</Badge>
            )}
            <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setConfirming(true)}
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4 text-rose-500" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-2 py-1.5">
          <code className="flex-1 truncate text-xs">{fullUrl}</code>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCopy}>
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {webhook.allowedMethods.map((m) => (
            <span
              key={m}
              className={cn('inline-flex px-2 py-0.5 rounded border text-[10px] font-bold', methodColor(m))}
            >
              {m}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span className="inline-flex items-center gap-1">
            <Activity className="h-3 w-3" /> {webhook.requestCount ?? 0} captured
          </span>
          <Link
            href={`/webhooks/${webhook._id}`}
            className="font-medium text-primary hover:underline"
          >
            View live →
          </Link>
        </div>
      </CardContent>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &quot;{webhook.name}&quot;?</DialogTitle>
            <DialogDescription>
              This deletes the webhook and all captured requests. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
