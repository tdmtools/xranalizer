'use client';
import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from './ui/button';
import { tryParseJson } from '@/lib/utils';

export function JsonView({ value }: { value: any }) {
  const [copied, setCopied] = useState(false);

  const text = useMemo(() => {
    if (value == null) return '';
    if (typeof value === 'string') {
      const parsed = tryParseJson(value);
      if (parsed !== null) return JSON.stringify(parsed, null, 2);
      return value;
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }, [value]);

  if (!text) {
    return <div className="text-xs text-muted-foreground italic py-3">empty</div>;
  }

  const onCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="relative group">
      <Button
        variant="ghost"
        size="sm"
        onClick={onCopy}
        className="absolute top-1 right-1 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
      <pre className="rounded-md border bg-muted/30 p-3 overflow-auto text-xs leading-relaxed font-mono max-h-[60vh]">
        {text}
      </pre>
    </div>
  );
}

export function KeyValueTable({
  data,
  emptyLabel = 'empty',
}: {
  data: Record<string, any> | null | undefined;
  emptyLabel?: string;
}) {
  const entries = useMemo(() => {
    if (!data || typeof data !== 'object') return [];
    return Object.entries(data);
  }, [data]);

  if (entries.length === 0) {
    return <div className="text-xs text-muted-foreground italic py-3">{emptyLabel}</div>;
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <table className="w-full text-xs">
        <tbody>
          {entries.map(([k, v]) => (
            <tr key={k} className="border-t first:border-t-0 hover:bg-muted/30">
              <td className="px-3 py-1.5 font-medium font-mono text-muted-foreground align-top w-1/3 break-all">
                {k}
              </td>
              <td className="px-3 py-1.5 font-mono break-all">
                {typeof v === 'string' ? v : JSON.stringify(v)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
