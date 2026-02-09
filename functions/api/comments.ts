import type { PagesFunction } from '@cloudflare/workers-types';

type Env = { DB: D1Database };

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: cors });

const str = (v: any) => String(v ?? '').trim();

const safeText = (v: any, max = 300) => {
  const s = str(v);
  return s.length > max ? s.slice(0, max) : s;
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const productId = str(url.searchParams.get('productId'));
    if (!productId) return json({ success: false, error: 'productId required' }, 400);

    const rows = await env.DB.prepare(
      `SELECT
         id,
         product_id as productId,
         user_id as userId,
         user_name as userName,
         user_initials as userInitials,
         user_color as userColor,
         text_color as textColor,
         content,
         created_at as timestamp,
         likes
       FROM product_comments
       WHERE product_id = ?
       ORDER BY created_at DESC
       LIMIT 200`
    )
      .bind(productId)
      .all();

    return json({ success: true, data: rows.results || [] });
  } catch (e: any) {
    return json({ success: false, error: e?.message || 'Server error' }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json().catch(() => ({}));

    const productId = str(body.productId);
    const content = safeText(body.content, 300);

    if (!productId || !content) {
      return json({ success: false, error: 'productId and content required' }, 400);
    }

    // ✅ Guest defaults
    const userId = str(body.userId) || 'guest';
    const userName = str(body.userName) || 'Mteja';
    const userInitials = str(body.userInitials) || 'MT';
    const userColor = str(body.userColor) || 'bg-blue-100';
    const textColor = str(body.textColor) || 'text-blue-600';

    const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const now = Date.now();

    await env.DB.prepare(
      `INSERT INTO product_comments
       (id, product_id, user_id, user_name, user_initials, user_color, text_color, content, created_at, likes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
    )
      .bind(id, productId, userId, userName, userInitials, userColor, textColor, content, now)
      .run();

    const saved = await env.DB.prepare(
      `SELECT
         id,
         product_id as productId,
         user_id as userId,
         user_name as userName,
         user_initials as userInitials,
         user_color as userColor,
         text_color as textColor,
         content,
         created_at as timestamp,
         likes
       FROM product_comments
       WHERE id = ?`
    )
      .bind(id)
      .first();

    return json({ success: true, data: saved });
  } catch (e: any) {
    return json({ success: false, error: e?.message || 'Server error' }, 500);
  }
};
