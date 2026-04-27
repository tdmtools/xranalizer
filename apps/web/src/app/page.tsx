'use client';
import useSWR from 'swr';
import Link from 'next/link';
import { Activity, Building2, Webhook, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Company, Webhook as WebhookType } from '@/lib/api';

export default function DashboardPage() {
  const { data: companies = [] } = useSWR<Company[]>('/api/companies');
  const { data: webhooks = [] } = useSWR<WebhookType[]>('/api/webhooks');
  const { data: stats } = useSWR<{ total: number; last24h: number }>('/api/requests/stats');

  const totalRequests = stats?.total ?? 0;
  const last24h = stats?.last24h ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Live overview of your webhooks and incoming traffic
          </p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Companies"
          value={companies.length}
          icon={<Building2 className="h-5 w-5 text-muted-foreground" />}
          href="/companies"
        />
        <StatCard
          title="Webhooks"
          value={webhooks.length}
          icon={<Webhook className="h-5 w-5 text-muted-foreground" />}
          href="/webhooks"
        />
        <StatCard
          title="Total requests"
          value={totalRequests}
          icon={<Activity className="h-5 w-5 text-muted-foreground" />}
        />
        <StatCard
          title="Last 24h"
          value={last24h}
          icon={<Activity className="h-5 w-5 text-emerald-500" />}
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Companies</CardTitle>
              <CardDescription>Your configured tenants</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/companies">
                Manage <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {companies.length === 0 ? (
              <EmptyHint label="No companies yet" cta="Create your first" href="/companies" />
            ) : (
              <ul className="divide-y">
                {companies.slice(0, 6).map((c) => (
                  <li key={c._id} className="flex items-center justify-between py-2">
                    <Link
                      href={`/companies/${c._id}`}
                      className="font-medium hover:underline"
                    >
                      {c.name}
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{c.webhookCount ?? 0} hooks</span>
                      <span>{c.requestCount ?? 0} requests</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent webhooks</CardTitle>
              <CardDescription>Newest endpoints</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/webhooks">
                Manage <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {webhooks.length === 0 ? (
              <EmptyHint label="No webhooks yet" cta="Create one" href="/webhooks" />
            ) : (
              <ul className="divide-y">
                {webhooks.slice(0, 6).map((w) => (
                  <li key={w._id} className="flex items-center justify-between py-2 gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/webhooks/${w._id}`}
                        className="font-medium hover:underline truncate block"
                      >
                        {w.name}
                      </Link>
                      <div className="text-xs text-muted-foreground truncate">
                        /{w.company?.slug}/{w.path}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {w.requestCount ?? 0}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  href,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  href?: string;
}) {
  const content = (
    <Card className={href ? 'transition-colors hover:bg-accent/50' : ''}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription>{title}</CardDescription>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function EmptyHint({ label, cta, href }: { label: string; cta: string; href: string }) {
  return (
    <div className="text-sm text-muted-foreground py-4 text-center space-y-2">
      <p>{label}</p>
      <Button asChild size="sm">
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  );
}
