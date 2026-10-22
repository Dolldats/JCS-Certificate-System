import { NextRequest } from 'next/server';

// Statuses that must be sent without a body — attaching one throws a
// TypeError in the Response constructor.
const NULL_BODY_STATUSES = new Set([101, 204, 205, 304]);

// Ordinary API calls get a short budget; PDF generation and bulk imports
// need much longer, otherwise the proxy cancels work the backend is still doing.
const DEFAULT_TIMEOUT_MS = 30_000;
const LONG_RUNNING_TIMEOUT_MS = 180_000;

function getBackendBaseUrl(): string {
  let rawBaseUrl =
    process.env.NEXT_PUBLIC_JAMAAT_API_URL ||
    process.env.JAMAAT_API_URL ||
    'https://jcs-certificate-system-production.up.railway.app';

  if (!rawBaseUrl.startsWith('http://') && !rawBaseUrl.startsWith('https://')) {
    rawBaseUrl = 'https://jcs-certificate-system-production.up.railway.app';
  }

  return rawBaseUrl.trim().replace(/\/+$/, '').replace(/\/api$/i, '');
}

async function handleProxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const baseUrl = getBackendBaseUrl();
  const search = request.nextUrl.search || '';
  const targetPath = path.join('/');
  const targetUrl = `${baseUrl}/api/${targetPath}${search}`;

  const headers = new Headers();
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    headers.set('authorization', authHeader);
  }

  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers.set('content-type', contentType);
  } else {
    headers.set('content-type', 'application/json');
  }
  headers.set('accept', request.headers.get('accept') || 'application/json');
  headers.set(
    'user-agent',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 JamaatCertify/1.0'
  );

  const body: BodyInit | undefined = ['POST', 'PUT', 'PATCH'].includes(request.method)
    ? await request.arrayBuffer()
    : undefined;

  // PDF generation and bulk imports are slow server-side, so they get a much
  // longer budget than ordinary reads.
  const isLongRunning =
    /\/generate(-all)?$|\/download-all-pdf$|\/upload-(csv|excel)$|\/preview$/.test(
      targetUrl
    );
  const timeoutMs = isLongRunning ? LONG_RUNNING_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });

    const upstreamContentType =
      upstream.headers.get('content-type') || 'application/json';

    // 101/204/205/304 are null-body statuses: the Response constructor throws
    // "Invalid response status code 204" if a body is attached. The backend
    // answers successful DELETEs with 204, so pass the body as null there.
    const hasNullBodyStatus = NULL_BODY_STATUSES.has(upstream.status);
    const responseBody = hasNullBodyStatus ? null : await upstream.arrayBuffer();

    return new Response(responseBody, {
      status: upstream.status,
      headers: {
        ...(hasNullBodyStatus ? {} : { 'content-type': upstreamContentType }),
        ...(upstream.headers.get('content-disposition')
          ? { 'content-disposition': upstream.headers.get('content-disposition')! }
          : {}),
      },
    });
  } catch (err: unknown) {
    const errorObj = err as Error & { cause?: unknown; code?: string };
    const causeMsg = errorObj.cause
      ? typeof errorObj.cause === 'object' && errorObj.cause !== null
        ? JSON.stringify(errorObj.cause)
        : String(errorObj.cause)
      : errorObj.code || 'UNKNOWN';

    console.error(`[backend-proxy] ${request.method} ${targetUrl} failed:`, {
      name: errorObj.name,
      message: errorObj.message,
      cause: errorObj.cause,
      causeMsg,
      code: errorObj.code,
    });

    return Response.json(
      {
        message: 'Cannot reach the backend server from the application proxy.',
        // The target URL and the raw cause stay in the server log — they are
        // internal details and must not be echoed to the browser.
      },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;
