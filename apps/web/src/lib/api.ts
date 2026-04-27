export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? API_URL;

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(message: string, status: number, body?: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
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
    const msg =
      (body && (body.message || body.error)) ||
      `${res.status} ${res.statusText}`;
    throw new ApiError(
      Array.isArray(msg) ? msg.join(', ') : msg,
      res.status,
      body,
    );
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
