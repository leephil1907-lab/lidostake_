const port = Number(Deno.env.get('PORT') ?? 8000);
const distRoot = new URL('./dist/', import.meta.url);

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function contentType(pathname: string): string {
  const extension = pathname.slice(pathname.lastIndexOf('.')).toLowerCase();
  return MIME_TYPES[extension] ?? 'application/octet-stream';
}

function safeAssetPath(pathname: string): URL | null {
  const decoded = decodeURIComponent(pathname);
  if (decoded.includes('..') || decoded.includes('\\')) return null;
  return new URL(`.${decoded === '/' ? '/index.html' : decoded}`, distRoot);
}

async function serve(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Basic readiness endpoint for Deno Deploy health checks.
  if (url.pathname === '/api/health') {
    return Response.json({ ok: true, service: 'lido-stake-interface' });
  }

  let asset = safeAssetPath(url.pathname);
  if (!asset) return new Response('Bad Request', { status: 400 });

  try {
    let file = await Deno.open(asset, { read: true });
    const response = new Response(request.method === 'HEAD' ? null : file.readable, {
      headers: {
        'content-type': contentType(asset.pathname),
        'cache-control': asset.pathname.includes('/assets/')
          ? 'public, max-age=31536000, immutable'
          : 'no-cache',
      },
    });
    file.close();
    return response;
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
    // SPA fallback supports client-side routes.
    asset = new URL('./index.html', distRoot);
    const file = await Deno.open(asset, { read: true });
    return new Response(request.method === 'HEAD' ? null : file.readable, {
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' },
    });
  }
}

console.log(`Lido interface listening on port ${port}`);
Deno.serve({ port }, serve);
