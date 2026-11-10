// Public greeting endpoint. Service credentials stay inside Supabase.
const origin = Deno.env.get('SITE_ORIGIN') || 'https://tradersamz.lol';
Deno.serve(async (req: Request) => {
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin', 'Cache-Control': 'no-store',
    'Content-Type': 'application/json',
  };
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });
  if (req.headers.get('origin') !== origin) return reply(403, { error: 'Origin rejected' });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!['GET', 'POST'].includes(req.method)) return reply(405, { error: 'Method rejected' });
  if (req.method === 'POST') {
    if (req.headers.get('content-type') !== 'application/json') return reply(400, { error: 'Expected JSON' });
    // Stream with a strict size bound, even if Content-Length is absent.
    const reader = req.body?.getReader();
    let body = new Uint8Array(0);
    if (!reader) return reply(400, { error: 'Expected empty object' });
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (body.length + value.length > 32) { await reader.cancel(); return reply(413, { error: 'Body too large' }); }
      const joined = new Uint8Array(body.length + value.length);
      joined.set(body); joined.set(value, body.length); body = joined;
    }
    try {
      const parsed = JSON.parse(new TextDecoder().decode(body));
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object' || Object.keys(parsed).length) throw Error();
    } catch { return reply(400, { error: 'Only an empty object is accepted' }); }
  }
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) throw Error('Missing server configuration');
    const increment = req.method === 'POST';
    const response = await fetch(`${url}/rest/v1/${increment ? 'rpc/site_say_hi' : 'site_hello?id=eq.1&select=total'}`, {
      method: increment ? 'POST' : 'GET',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      ...(increment ? { body: '{}' } : {}),
    });
    if (!response.ok) throw Error('Database request failed');
    const data = await response.json();
    const total = increment ? data : data[0]?.total;
    if (total === -1) return reply(429, { error: 'Please try again in a minute' });
    if (!Number.isSafeInteger(total) || total < 0) throw Error('Invalid total');
    return reply(200, { total });
  } catch { return reply(503, { error: 'Shared counter unavailable' }); }
});
