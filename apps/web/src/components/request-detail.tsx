'use client';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { JsonView, KeyValueTable } from './json-view';
import { cn, formatBytes, methodColor, statusColor } from '@/lib/utils';
import type { RequestLog } from '@/lib/api';

export function RequestDetail({ request }: { request: RequestLog }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={cn(
            'inline-flex px-2 py-1 rounded border text-xs font-bold',
            methodColor(request.method),
          )}
        >
          {request.method}
        </span>
        <span className={cn('inline-flex px-2 py-1 rounded text-xs font-bold', statusColor(request.responseStatus))}>
          {request.responseStatus}
        </span>
        <Badge className="bg-muted text-muted-foreground border-border">
          {request.responseTimeMs}ms
        </Badge>
        <Badge className="bg-muted text-muted-foreground border-border">
          {formatBytes(request.contentLength)}
        </Badge>
        <span className="text-xs text-muted-foreground ml-auto">
          {format(new Date(request.receivedAt), 'PPpp')}
        </span>
      </div>

      <div className="rounded-md border bg-muted/30 p-3 space-y-1 text-xs">
        <div className="flex gap-2">
          <span className="text-muted-foreground shrink-0">URL</span>
          <code className="break-all">{request.url}</code>
        </div>
        <div className="flex gap-2">
          <span className="text-muted-foreground shrink-0">IP</span>
          <code>{request.ip || '—'}</code>
          {request.ips?.length > 1 && (
            <code className="text-muted-foreground">via {request.ips.join(', ')}</code>
          )}
        </div>
        <div className="flex gap-2">
          <span className="text-muted-foreground shrink-0">User-Agent</span>
          <code className="break-all">{request.userAgent || '—'}</code>
        </div>
      </div>

      <Tabs defaultValue="body" className="w-full">
        <TabsList className="flex w-full justify-start overflow-x-auto">
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="query">Query</TabsTrigger>
          <TabsTrigger value="raw">Raw</TabsTrigger>
        </TabsList>

        <TabsContent value="body">
          <JsonView value={request.body ?? request.rawBody} />
        </TabsContent>
        <TabsContent value="headers">
          <KeyValueTable data={request.headers} />
        </TabsContent>
        <TabsContent value="query">
          <KeyValueTable data={request.query} emptyLabel="no query parameters" />
        </TabsContent>
        <TabsContent value="raw">
          {request.rawBody ? (
            <pre className="rounded-md border bg-muted/30 p-3 overflow-auto text-xs leading-relaxed font-mono max-h-[60vh] whitespace-pre-wrap break-all">
              {request.rawBody}
            </pre>
          ) : (
            <div className="text-xs text-muted-foreground italic py-3">no raw body</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
