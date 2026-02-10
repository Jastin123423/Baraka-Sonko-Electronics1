// functions/api/views.ts
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
    headers: {
      ...cors,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: cors });

const str = (v: any) => String(v ?? '').trim();

// Safer JSON body read
const readJson = async (request: Request) => {
  try {
    const ct = request.headers.get('content-type') || '';
    if (!ct.toLowerCase().includes('application/json')) return {};
    return await request.json().catch(() => ({}));
  } catch {
    return {};
  }
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!env?.DB) return json({ success: false, error: 'DB binding missing (DB)' }, 500);

    const url = new URL(request.url);
    const productId = str(url.searchParams.get('productId'));
    if (!productId) return json({ success: false, error: 'productId required' }, 400);

    const row = await env.DB.prepare(
      `SELECT views FROM product_view_counts WHERE product_id = ?`
    )
      .bind(productId)
      .first();

    return json({
      success: true,
      data: { productId, views: Number((row as any)?.views ?? 0) },
    });
  } catch (e: any) {
    return json(
      { success: false, error: e?.message || 'Server error', stack: String(e?.stack || '') },
      500
    );
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!env?.DB) return json({ success: false, error: 'DB binding missing (DB)' }, 500);

    const body = await readJson(request);
    const productId = str((body as any).productId);
    const viewerKey = str((body as any).viewerKey) || 'guest';

    if (!productId) return json({ success: false, error: 'productId required' }, 400);

    const now = Date.now();

    // 1) Log raw view (NOT unique)
    await env.DB.prepare(
      `INSERT INTO product_views (product_id, viewer_key, created_at)
       VALUES (?, ?, ?)`
    )
      .bind(productId, viewerKey, now)
      .run();

    // 2) ALWAYS increment the counter
    await env.DB.prepare(
      `INSERT INTO product_view_counts (product_id, views, updated_at)
       VALUES (?, 1, ?)
       ON CONFLICT(product_id) DO UPDATE SET
         views = views + 1,
         updated_at = excluded.updated_at`
    )
      .bind(productId, now)
      .run();

    // 3) Read final count
    const row = await env.DB.prepare(
      `SELECT views FROM product_view_counts WHERE product_id = ?`
    )
      .bind(productId)
      .first();

    return json({
      success: true,
      data: { productId, views: Number((row as any)?.views ?? 0) },
    });
  } catch (e: any) {
    return json(
      { success: false, error: e?.message || 'Server error', stack: String(e?.stack || '') },
      500
    );
  }
};
