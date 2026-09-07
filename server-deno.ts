const port = Number(Deno.env.get('PORT') ?? 8000);
const distRoot = new URL('./dist/', import.meta.url);

type TicketRow = { id: string; email: string; subject: string; message: string; status: string; createdAt: string };
const kv = await Deno.openKv();
const SESSION_TTL = 8 * 60 * 60 * 1000;
const cookie = (request: Request, name: string) => request.headers.get('cookie')?.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${name}=`))?.split('=')[1];
const adminSession = async (request: Request) => { const token = cookie(request, 'admin_session'); if (!token) return false; const value = await kv.get<{ expiresAt: number }>(['admin_sessions', token]); return Boolean(value.value && value.value.expiresAt > Date.now()); };
const json = (body: unknown, status = 200, headers: HeadersInit = {}) => Response.json(body, { status, headers });


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


  if (url.pathname === '/api/admin/login' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    if (!Deno.env.get('ADMIN_EMAIL') || !Deno.env.get('ADMIN_PASSWORD') || body.email !== Deno.env.get('ADMIN_EMAIL') || body.password !== Deno.env.get('ADMIN_PASSWORD')) return json({ error: 'Unauthorized' }, 401);
    const token = crypto.randomUUID(); await kv.set(['admin_sessions', token], { expiresAt: Date.now() + SESSION_TTL }, { expireIn: SESSION_TTL });
    return json({ ok: true }, 200, { 'set-cookie': `admin_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL / 1000}` });
  }
  if (url.pathname === '/api/admin/logout' && request.method === 'POST') { const token = cookie(request, 'admin_session'); if (token) await kv.delete(['admin_sessions', token]); return json({ ok: true }, 200, { 'set-cookie': 'admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0' }); }
  if (url.pathname === '/api/admin/tickets' && request.method === 'GET') { if (!await adminSession(request)) return json({ error: 'Unauthorized' }, 401); const list = []; for await (const item of kv.list<TicketRow>({ prefix: ['support_tickets'] })) list.push(item.value); list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); return json(list); }
  if (url.pathname === '/api/support/tickets' && request.method === 'POST') { const body = await request.json().catch(() => ({})); if (typeof body.email !== 'string' || typeof body.subject !== 'string' || typeof body.message !== 'string' || body.message.length > 5000) return json({ error: 'Invalid ticket' }, 400); const id = crypto.randomUUID(); const ticket = { id, email: body.email.trim().slice(0, 200), subject: body.subject.trim().slice(0, 200), message: body.message.trim(), status: 'open', createdAt: new Date().toISOString() }; await kv.set(['support_tickets', id], ticket); return json({ ok: true, id }, 201); }
  const ticketMatch = url.pathname.match(/^\/api\/admin\/tickets\/([^/]+)$/);
  if (ticketMatch && request.method === 'PATCH') { if (!await adminSession(request)) return json({ error: 'Unauthorized' }, 401); const body = await request.json().catch(() => ({})); if (!['open', 'in_progress', 'resolved'].includes(body.status)) return json({ error: 'Invalid status' }, 400); const key = ['support_tickets', ticketMatch[1]]; const current = await kv.get<TicketRow>(key); if (!current.value) return json({ error: 'Not found' }, 404); await kv.set(key, { ...current.value, status: body.status }); return json({ ok: true }); }

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
