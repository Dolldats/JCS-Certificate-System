export async function POST(request: Request) {
  let rawBaseUrl =
    process.env.NEXT_PUBLIC_JAMAAT_API_URL ||
    process.env.JAMAAT_API_URL ||
    'https://jcs-certificate-system-production.up.railway.app';

  // If the env var is not a valid http(s) URL (e.g. accidentally set to a secret key), fallback to default
  if (!rawBaseUrl.startsWith('http://') && !rawBaseUrl.startsWith('https://')) {
    rawBaseUrl = 'https://jcs-certificate-system-production.up.railway.app';
  }

  // Normalize base URL: strip trailing slashes and any trailing /api
  const baseUrl = rawBaseUrl.trim().replace(/\/+$/, '').replace(/\/api$/i, '');
  const targetUrl = `${baseUrl}/api/auth/login`;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: 'Invalid request body.' }, { status: 400 });
  }

  const record = (body ?? {}) as Record<string, unknown>;
  const username =
    typeof record.username === 'string' ? record.username.trim() : '';
  const password = typeof record.password === 'string' ? record.password : '';
  if (!username || !password) {
    return Response.json(
      { message: 'Member ID and password are required.' },
      { status: 400 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 JamaatCertify/1.0',
      },
      body: JSON.stringify({ username, password }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (err: unknown) {
    const errorObj = err as Error & { cause?: unknown; code?: string };
    const causeMsg = errorObj.cause
      ? typeof errorObj.cause === 'object' && errorObj.cause !== null
        ? JSON.stringify(errorObj.cause)
        : String(errorObj.cause)
      : errorObj.code || 'UNKNOWN';

    console.error('[auth-proxy] upstream fetch failed:', {
      targetUrl,
      name: errorObj.name,
      message: errorObj.message,
      cause: errorObj.cause,
      code: errorObj.code,
    });

    return Response.json(
      {
        message: 'Cannot reach the auth server from the app server.',
        detail: `${errorObj.name}: ${errorObj.message} (cause: ${causeMsg})`,
        targetUrl,
      },
      { status: 502 }
    );
  }

  const text = await upstream.text();
  const contentType = upstream.headers.get('content-type') || 'application/json';

  return new Response(text, {
    status: upstream.status,
    headers: { 'Content-Type': contentType },
  });
}
