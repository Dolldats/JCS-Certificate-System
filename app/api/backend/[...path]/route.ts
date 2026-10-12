import { NextRequest } from 'next/server';

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
  headers.set('accept', 'application/json');
  headers.set(
    'user-agent',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 JamaatCertify/1.0'
  );

  let body: BodyInit | undefined = undefined;
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      body = await request.text();
    } catch {
      body = undefined;
    }
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      signal: AbortSignal.timeout(20000),
    });

    const responseText = await upstream.text();
    const upstreamContentType =
      upstream.headers.get('content-type') || 'application/json';

    return new Response(responseText, {
      status: upstream.status,
      headers: {
        'content-type': upstreamContentType,
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
      code: errorObj.code,
    });

    return Response.json(
      {
        message: 'Cannot reach the backend server from the application proxy.',
        detail: `${errorObj.name}: ${errorObj.message} (cause: ${causeMsg})`,
        targetUrl,
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
