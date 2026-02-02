
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

// ⚠️ IMPORTANT: this is a minimal example.
// It compares hashes. You should hash in a secure way when creating users.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!env.DB) return json({ success: false, error: 'DB binding missing' }, 500);

    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) return json({ success: false, error: 'Missing email or password' }, 400);

    const row = await env.DB.prepare(
      `SELECT id, name, email, role, password_hash
       FROM users
       WHERE lower(email)=? LIMIT 1`
    ).bind(email).first<any>();

    if (!row) return json({ success: false, error: 'Invalid credentials' }, 401);

    // Replace this with your real hashing verification.
    // For now we assume password_hash stored as plain hash string and you compare.
    // Ideally: verify with scrypt/argon2/bcrypt.
    const ok = row.password_hash && row.password_hash === password; // ⚠️ TEMP ONLY
    if (!ok) return json({ success: false, error: 'Invalid credentials' }, 401);

    return json({
      success: true,
      user: { id: row.id, name: row.name, email: row.email, role: row.role },
    });
  } catch (e: any) {
    return json({ success: false, error: e?.message || 'Server error' }, 500);
  }
};
