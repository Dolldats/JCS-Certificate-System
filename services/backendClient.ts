/**
 * Helper client to call backend endpoints via same-origin Next.js proxy route (/api/backend/...)
 * Automatically attaches session JWT bearer tokens and standardizes error handling.
 */

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem('jcs_access_token');
  } catch {
    return null;
  }
}

/**
 * Turns technical request failures into plain, straight-to-the-point
 * messages for admins. Raw status codes and fetch internals never reach
 * the UI — callers can still find them in the devtools console.
 */
export function friendlyErrorMessage(status: number, detail = '', fallback401?: string): string {
  const clean = detail.trim().replace(/\s+/g, ' ');
  const bareToken = /^(unauthorized|forbidden|not found|bad request|internal server error|bad gateway|service unavailable|gateway timeout)$/i;
  const looksTechnical =
    clean.length === 0 ||
    clean.length > 200 ||
    bareToken.test(clean) ||
    /failed to fetch|networkerror|network request|proxy|server error|status \d|request failed|login failed|doctype|<html|undefined|null$/i.test(clean);
  if (!looksTechnical) return clean;
  if (status === 401) return fallback401 || 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) return 'That record was not found. It may have been deleted.';
  if (status === 408 || status === 504) return 'The server took too long to respond. Please try again.';
  if (status === 409) return 'That already exists, so nothing was changed.';
  if (status === 400 || status === 422) return 'Some details were not accepted. Please check and try again.';
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.';
  if (status >= 500) return 'Something went wrong on our side. Please try again in a bit.';
  return 'Something went wrong. Please try again.';
}

export async function backendFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const cleanPath = endpoint.replace(/^\/+/, '').replace(/^api\//i, '');
  const proxyUrl = `/api/backend/${cleanPath}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(proxyUrl, {
      ...options,
      headers,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`Backend ${endpoint} unreachable:`, msg);
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }

  if (!res.ok) {
    let detail = '';
    try {
      const errBody = (await res.json()) as unknown;
      if (typeof errBody === 'object' && errBody !== null) {
        const record = errBody as Record<string, unknown>;
        if (typeof record.message === 'string' && record.message) {
          detail = record.message;
        } else if (typeof record.title === 'string' && record.title) {
          detail = record.title;
        } else if (record.errors && typeof record.errors === 'object') {
          const first = Object.values(record.errors as Record<string, unknown>).flat()[0];
          if (typeof first === 'string') detail = first;
        }
      } else if (typeof errBody === 'string' && errBody) {
        detail = errBody;
      }
    } catch {
      // Fallback
    }

    console.warn(`Backend ${endpoint} failed:`, res.status, detail || '(no detail)');
    throw new Error(friendlyErrorMessage(res.status, detail));
  }

  // Handle empty 204 or 200 responses
  const text = await res.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export async function backendDownload(endpoint: string): Promise<Blob> {
  const token = getAuthToken();
  const cleanPath = endpoint.replace(/^\/+/, '').replace(/^api\//i, '');
  const headers = new Headers({ Accept: 'application/pdf, application/octet-stream' });
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`/api/backend/${cleanPath}`, { headers });
  if (!response.ok) {
    let detail = '';
    try {
      const body = (await response.json()) as Record<string, unknown>;
      detail = typeof body.message === 'string' ? body.message : '';
    } catch {
      // Keep a concise status-based error when the endpoint returns no JSON body.
    }
    throw new Error(detail || `Download failed (${response.status}).`);
  }

  return response.blob();
}
