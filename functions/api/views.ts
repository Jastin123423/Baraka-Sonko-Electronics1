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

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const productId = str(url.searchParams.get('productId'));
    if (!productId) return json({ success: false, error: 'productId required' }, 400);

    const row = await env.DB.prepare(
      `SELECT views FROM product_view_counts WHERE product_id = ?`
    )
      .bind(productId)
      .first();

    return json({ success: true, data: { productId, views: Number(row?.views ?? 0) } });
  } catch (e: any) {
    return json({ success: false, error: e?.message || 'Server error' }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const productId = str(body.productId);
    const viewerKey = str(body.viewerKey) || 'guest';

    if (!productId) return json({ success: false, error: 'productId required' }, 400);

    const now = Date.now();

    // record unique view
    const ins = await env.DB.prepare(
      `INSERT OR IGNORE INTO product_views (product_id, viewer_key, created_at)
       VALUES (?, ?, ?)`
    )
      .bind(productId, viewerKey, now)
      .run();

    // increment counter only on new unique view
    if (Number(ins.meta?.changes ?? 0) > 0) {
      await env.DB.prepare(
        `INSERT INTO product_view_counts (product_id, views, updated_at)
         VALUES (?, 1, ?)
         ON CONFLICT(product_id) DO UPDATE SET
           views = views + 1,
           updated_at = excluded.updated_at`
      )
        .bind(productId, now)
        .run();
    }

    const row = await env.DB.prepare(
      `SELECT views FROM product_view_counts WHERE product_id = ?`
    )
      .bind(productId)
      .first();

    return json({ success: true, data: { productId, views: Number(row?.views ?? 0) } });
  } catch (e: any) {
    return json({ success: false, error: e?.message || 'Server error' }, 500);
  }
};
