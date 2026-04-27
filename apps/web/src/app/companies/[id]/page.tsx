'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import useSWR, { mutate } from 'swr';
import { ArrowLeft, Plus, Webhook as WebhookIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { WebhookForm } from '@/components/webhook-form';
import { API_URL, type Company, type Webhook } from '@/lib/api';
import { cn, methodColor } from '@/lib/utils';

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: company } = useSWR<Company>(`/api/companies/${id}`);
  const swrKey = `/api/webhooks?companyId=${id}`;
  const { data: webhooks = [] } = useSWR<Webhook[]>(swrKey);
  const { data: companies = [] } = useSWR<Company[]>('/api/companies');
  const [open, setOpen] = useState(false);

  const close = () => {
    setOpen(false);
    mutate(swrKey);
    mutate('/api/companies');
  };

  if (!company) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/companies">
          <ArrowLeft className="h-4 w-4" /> All companies
        </Link>
      </Button>

      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
          <code className="text-sm text-muted-foreground">/{company.slug}</code>
          {company.description && (
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{company.description}</p>
          )}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> New webhook
            </Button>
          </DialogTrigger>
          <WebhookForm
            companies={companies}
            defaultCompanyId={id}
            onSaved={close}
          />
        </Dialog>
      </div>

      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <WebhookIcon className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="mb-4">No webhooks for this company yet.</p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> New webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {webhooks.map((w) => (
            <Link key={w._id} href={`/webhooks/${w._id}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{w.name}</div>
                    <code className="text-xs text-muted-foreground">
                      {API_URL}/{company.slug}/{w.path}
                    </code>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {w.allowedMethods.map((m) => (
                      <span
                        key={m}
                        className={cn(
                          'inline-flex px-2 py-0.5 rounded border text-[10px] font-bold',
                          methodColor(m),
                        )}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {w.requestCount ?? 0} requests
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
