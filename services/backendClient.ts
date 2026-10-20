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
 * Trims, collapses whitespace and strips markup out of an upstream error body
 * so the real reason can be shown instead of a generic sentence.
 */
function normalizeDetail(detail: string): string {
  return detail
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);
}

/**
 * True when the text is a raw framework/transport artifact rather than a
 * message written for a human (HTML error pages, stack dumps, empty bodies).
 */
function isTechnicalNoise(clean: string): boolean {
  return (
    clean.length === 0 ||
    /^(unauthorized|forbidden|not found|bad request|internal server error|bad gateway|service unavailable|gateway timeout|error)$/i.test(
      clean
    ) ||
    /failed to fetch|networkerror|network request|\bproxy\b|doctype|<html|^\[object|undefined$|null$/i.test(
      clean
    )
  );
}

/**
 * Turns technical request failures into plain, straight-to-the-point
 * messages for admins. When the backend actually explained what went wrong
 * we show that verbatim instead of hiding it behind a generic message.
 */
export function friendlyErrorMessage(status: number, detail = '', fallback401?: string): string {
  const clean = normalizeDetail(detail);

  if (clean && !isTechnicalNoise(clean)) return clean;

  if (status === 401) return fallback401 || 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) return 'That record was not found. It may have been deleted.';
  if (status === 408 || status === 504) return 'The server took too long to respond. Please try again.';
  if (status === 409) return 'That already exists, so nothing was changed.';
  if (status === 400 || status === 422) return 'Some details were not accepted. Please check and try again.';
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.';
  if (status >= 500) return `The server failed while handling this request (HTTP ${status}). Please try again.`;
  return `The request did not complete (HTTP ${status}).`;
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
    // Read the raw body once so we can mine it for whatever the backend said,
    // whichever shape it used (ProblemDetails, validation bag, plain text).
    let detail = '';
    let rawBody = '';
    try {
      rawBody = await res.text();
    } catch {
      // Nothing readable in the body.
    }

    if (rawBody.trim()) {
      try {
        const errBody = JSON.parse(rawBody) as unknown;
        if (typeof errBody === 'object' && errBody !== null) {
          const record = errBody as Record<string, unknown>;
          const candidates: string[] = [];
          if (typeof record.message === 'string') candidates.push(record.message);
          if (typeof record.detail === 'string') candidates.push(record.detail);
          if (typeof record.title === 'string') candidates.push(record.title);
          if (record.errors && typeof record.errors === 'object') {
            const flat = Object.values(record.errors as Record<string, unknown>).flat();
            for (const entry of flat) if (typeof entry === 'string') candidates.push(entry);
          }
          if (candidates.length === 0) candidates.push(rawBody);
          // Prefer the first field a human would actually understand.
          detail = candidates.find((c) => !isTechnicalNoise(normalizeDetail(c))) ?? candidates[0];
        } else if (typeof errBody === 'string' && errBody) {
          detail = errBody;
        }
      } catch {
        detail = rawBody;
      }
    }

    console.warn(`Backend ${endpoint} failed:`, res.status, detail || '(no detail)');
    // Keep the HTTP status on the error so callers can branch on it
    // (e.g. treat a 404 as "already gone") instead of matching message text.
    const error = new Error(friendlyErrorMessage(res.status, detail)) as Error & {
      status?: number;
    };
    error.status = res.status;
    throw error;
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
