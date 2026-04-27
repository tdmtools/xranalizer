export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? API_URL;

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(message: string, status: number, body?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/**
 * Unwraps Nest and common API error JSON into a string (never an object coerced to string).
 */
export function errorMessageFromApiBody(body: unknown): string | null {
  if (body == null) return null;
  if (typeof body === 'string' && body.trim()) return body.trim();
  if (Array.isArray(body)) {
    const parts = body
      .map((x) => errorMessageFromApiBody(x))
      .filter((s): s is string => Boolean(s));
    return parts.length ? parts.join(' ') : null;
  }
  if (typeof body !== 'object') return null;
  const o = body as Record<string, unknown>;

  const asLine = (v: unknown): string | null => {
    if (v == null) return null;
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (Array.isArray(v)) {
      const p = v
        .map((x) => (typeof x === 'string' && x.trim() ? x.trim() : errorMessageFromApiBody(x)))
        .filter((s): s is string => Boolean(s));
      return p.length ? p.join(' ') : null;
    }
    if (typeof v === 'object' && v !== null) return errorMessageFromApiBody(v);
    return null;
  };

  return asLine(o.message) ?? asLine(o.error) ?? asLine((o as any).errors) ?? null;
}

/** For toast / UI when catching fetch or unknown errors. */
export function getUserFacingError(
  e: unknown,
  fallback: string = 'Something went wrong',
): string {
  if (e instanceof ApiError) {
    const m = (e.message && e.message !== '[object Object]') ? e.message : null;
    if (m) return m;
    return errorMessageFromApiBody(e.body) ?? fallback;
  }
  if (e instanceof Error) {
    if (e.message) return e.message;
    return fallback;
  }
  if (typeof e === 'string' && e.trim()) return e.trim();
  return fallback;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });
  const text = await res.text();
  const body = text ? safeJson(text) : null;
  if (!res.ok) {
    const fromJson =
      errorMessageFromApiBody(body) ||
      (typeof body === 'string' && body.trim() ? body.trim() : null);
    const msg = fromJson || `${res.status} ${res.statusText}`.trim();
    throw new ApiError(msg, res.status, body);
  }
  return body as T;
}

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, data: any) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  patch: <T,>(path: string, data: any) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T,>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};

export const fetcher = <T,>(path: string) => api.get<T>(path);

// ==== Types ====
export type Company = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  webhookCount?: number;
  requestCount?: number;
};

export type WebhookResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  contentType: string;
};

export type Webhook = {
  _id: string;
  companyId: string;
  name: string;
  path: string;
  description?: string;
  allowedMethods: string[];
  response: WebhookResponse;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  company?: { _id: string; name: string; slug: string } | null;
  requestCount?: number;
};

export type RequestLog = {
  _id: string;
  webhookId: string;
  companyId: string;
  method: string;
  url: string;
  path: string;
  query: Record<string, any>;
  headers: Record<string, any>;
  body: any;
  rawBody: string;
  contentType: string;
  contentLength: number;
  ip: string;
  ips: string[];
  userAgent: string;
  protocol: string;
  hostname: string;
  responseStatus: number;
  responseTimeMs: number;
  receivedAt: string;
  createdAt: string;
};

export type SearchResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
] as const;
