// Thin fetch wrapper around the Django backend. Every call needs the
// caller's current Clerk session token attached as a Bearer header -
// PortalDataProvider is the only place that should call this directly.

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Turns the shapes DRF sends back for errors ("msg", ["msg"], {detail: "msg"},
// {field: ["msg"]}) into one readable sentence for an alert.
function readableError(status: number, body: unknown, fallback: string): string {
  if (status === 429) return "You're doing that too quickly. Please wait a little and try again.";
  if (typeof body === 'string') return body;
  if (Array.isArray(body)) return body.map(String).join(' ');
  if (body && typeof body === 'object') {
    const fields = body as Record<string, unknown>;
    if (typeof fields.detail === 'string') return fields.detail;
    const parts = Object.values(fields).flatMap(v => (Array.isArray(v) ? v.map(String) : [String(v)]));
    if (parts.length) return parts.join(' ');
  }
  return fallback;
}

export async function apiRequest<T>(path: string, token: string | null, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // response wasn't JSON, fall back to the status text below
    }
    throw new ApiError(res.status, readableError(res.status, body, res.statusText));
  }

  if (res.status === 204) return undefined as T;

  // DRF's Response(None) renders as a genuinely empty body (not the string
  // "null"), e.g. GET /api/resume/ when there's no resume yet - res.json()
  // throws on that, so check for empty text first.
  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

export async function apiDownload(path: string, token: string | null): Promise<Blob> {
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) throw new ApiError(res.status, res.statusText);
  return res.blob();
}
