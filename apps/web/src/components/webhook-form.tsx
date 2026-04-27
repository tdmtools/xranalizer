'use client';
import { useState } from 'react';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { api, getUserFacingError, HTTP_METHODS, type Company, type Webhook } from '@/lib/api';
import { cn, methodColor } from '@/lib/utils';

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function WebhookForm({
  webhook,
  companies,
  defaultCompanyId,
  onSaved,
}: {
  webhook?: Webhook;
  companies: Company[];
  defaultCompanyId?: string;
  onSaved: () => void;
}) {
  const isEdit = !!webhook;
  const [companyId, setCompanyId] = useState(
    webhook?.companyId ?? defaultCompanyId ?? companies[0]?._id ?? '',
  );
  const [name, setName] = useState(webhook?.name ?? '');
  const [path, setPath] = useState(webhook?.path ?? '');
  const [pathTouched, setPathTouched] = useState(isEdit);
  const [description, setDescription] = useState(webhook?.description ?? '');
  const [methods, setMethods] = useState<string[]>(
    webhook?.allowedMethods ?? ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  );
  const [enabled, setEnabled] = useState(webhook?.enabled ?? true);
  const [statusCode, setStatusCode] = useState(webhook?.response?.statusCode ?? 200);
  const [contentType, setContentType] = useState(
    webhook?.response?.contentType ?? 'application/json',
  );
  const [body, setBody] = useState(webhook?.response?.body ?? '{"ok":true}');
  const [headersText, setHeadersText] = useState(
    webhook?.response?.headers
      ? Object.entries(webhook.response.headers).map(([k, v]) => `${k}: ${v}`).join('\n')
      : '',
  );
  const [saving, setSaving] = useState(false);

  const toggleMethod = (m: string) => {
    setMethods((cur) =>
      cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m],
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (methods.length === 0) {
      toast.error('Select at least one HTTP method');
      return;
    }
    setSaving(true);
    try {
      const headers: Record<string, string> = {};
      headersText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .forEach((line) => {
          const idx = line.indexOf(':');
          if (idx > 0) {
            const k = line.slice(0, idx).trim();
            const v = line.slice(idx + 1).trim();
            if (k) headers[k] = v;
          }
        });

      const payload = {
        name,
        path,
        description,
        allowedMethods: methods,
        enabled,
        response: { statusCode, contentType, body, headers },
      };

      if (isEdit) {
        await api.patch(`/api/webhooks/${webhook!._id}`, payload);
        toast.success('Webhook updated');
      } else {
        await api.post('/api/webhooks', { ...payload, companyId });
        toast.success('Webhook created');
      }
      mutate('/api/webhooks');
      mutate((key: any) => typeof key === 'string' && key.startsWith('/api/webhooks'));
      mutate('/api/companies');
      onSaved();
    } catch (e: unknown) {
      toast.error(getUserFacingError(e, 'Failed to save webhook'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="max-w-2xl">
      <form onSubmit={onSubmit} className="space-y-4">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit webhook' : 'New webhook'}</DialogTitle>
          <DialogDescription>
            Configure URL, allowed methods and the response your endpoint returns.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          {!isEdit && (
            <div className="space-y-2 sm:col-span-2">
              <Label>Company</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name} (/{c.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="wname">Name</Label>
            <Input
              id="wname"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!pathTouched) setPath(slugify(e.target.value));
              }}
              placeholder="Inbound payments"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wpath">Path</Label>
            <Input
              id="wpath"
              value={path}
              onChange={(e) => {
                setPath(e.target.value);
                setPathTouched(true);
              }}
              placeholder="webhook1"
              pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description (optional)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="font-sans"
          />
        </div>

        <div className="space-y-2">
          <Label>Allowed methods</Label>
          <div className="flex flex-wrap gap-2">
            {HTTP_METHODS.map((m) => {
              const active = methods.includes(m);
              return (
                <button
                  type="button"
                  key={m}
                  onClick={() => toggleMethod(m)}
                  className={cn(
                    'px-3 py-1 rounded-md border text-xs font-semibold transition-all',
                    active ? methodColor(m) : 'bg-background text-muted-foreground border-border opacity-60 hover:opacity-100',
                  )}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border p-4 space-y-4">
          <div className="text-sm font-medium">Response</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status code</Label>
              <Input
                type="number"
                min={100}
                max={599}
                value={statusCode}
                onChange={(e) => setStatusCode(parseInt(e.target.value, 10) || 200)}
              />
            </div>
            <div className="space-y-2">
              <Label>Content-Type</Label>
              <Input value={contentType} onChange={(e) => setContentType(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Headers (one per line, &quot;Key: Value&quot;)</Label>
            <Textarea
              value={headersText}
              onChange={(e) => setHeadersText(e.target.value)}
              rows={3}
              placeholder="X-My-Header: my-value"
            />
          </div>

          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder='{"ok":true}'
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <div className="text-sm font-medium">Enabled</div>
            <div className="text-xs text-muted-foreground">
              Disabled webhooks return 503 to incoming requests.
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <DialogFooter>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create webhook'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
