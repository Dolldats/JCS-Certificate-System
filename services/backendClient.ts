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
    throw new Error(`Network request failed: ${msg}`);
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

    throw new Error(
      detail ? `Request failed (${res.status}): ${detail}` : `Request failed with status ${res.status}`
    );
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
