import type { PagesFunction } from '@cloudflare/workers-types';

type Env = { DB: D1Database };

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: cors });

const s = (v: any) => String(v ?? '').trim();

const sha256Hex = async (input: string) => {
  const bytes = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

const looksLikeSha256 = (v: string) => /^[a-f0-9]{64}$/i.test(v);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!env.DB) return json({ success: false, error: 'DB binding missing (DB)' }, 500);

    const body = await request.json().catch(() => ({}));
    const email = s(body.email).toLowerCase();
    const password = s(body.password);

    if (!email || !password) return json({ success: false, error: 'Missing email or password' }, 400);

    const row = await env.DB.prepare(
      `SELECT id, name, email, role, password_hash
       FROM users
       WHERE lower(trim(email))=? LIMIT 1`
    )
      .bind(email)
      .first<any>();

    // keep this generic so attackers can't learn which part failed
    if (!row || !row.password_hash) return json({ success: false, error: 'Invalid credentials' }, 401);

    const stored = String(row.password_hash || '').trim();

    // ✅ Accept either:
    // 1) stored SHA-256 hex (recommended)
    // 2) stored plain password (TEMP compatibility)
    let ok = false;

    if (looksLikeSha256(stored)) {
      const incomingHash = await sha256Hex(password);
      ok = incomingHash.toLowerCase() === stored.toLowerCase();
    } else {
      ok = stored === password;
    }

    if (!ok) return json({ success: false, error: 'Invalid credentials' }, 401);

    return json({
      success: true,
      user: { id: row.id, name: row.name, email: row.email, role: row.role || 'user' },
    });
  } catch (e: any) {
    return json({ success: false, error: e?.message || 'Login failed' }, 500);
  }
};
