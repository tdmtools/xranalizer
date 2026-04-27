import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 1) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`;
}

export function tryParseJson<T = any>(s: string): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export function methodColor(method: string): string {
  switch (method?.toUpperCase()) {
    case 'GET':
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    case 'POST':
      return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
    case 'PUT':
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    case 'PATCH':
      return 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30';
    case 'DELETE':
      return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
    case 'HEAD':
      return 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30';
    case 'OPTIONS':
      return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

export function statusColor(status: number): string {
  if (status >= 500) return 'bg-rose-500/15 text-rose-600 dark:text-rose-400';
  if (status >= 400) return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
  if (status >= 300) return 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400';
  if (status >= 200) return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
  return 'bg-muted text-muted-foreground';
}
