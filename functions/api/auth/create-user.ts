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
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: cors });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json();

    const id = crypto.randomUUID();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const role = body.role || 'user';

    if (!name || !email || !password) {
      return json({ success: false, error: 'Missing fields' }, 400);
    }

    // ⚠️ TEMP hash (replace later with secure hashing)
    const password_hash = password;

    await env.DB.prepare(
      `INSERT INTO users (id, name, email, role, password_hash)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(id, name, email, role, password_hash).run();

    return json({
      success: true,
      user: { id, name, email, role },
    });
  } catch (e: any) {
    return json({ success: false, error: e.message }, 500);
  }
};
