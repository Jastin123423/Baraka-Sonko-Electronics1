import type { PagesFunction } from '@cloudflare/workers-types';

type Env = { DB: D1Database };

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE,OPTIONS',
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

export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  try {
    const id = str((params as any).id);
    if (!id) return json({ success: false, error: 'id required' }, 400);

    // delete likes first
    await env.DB.prepare(`DELETE FROM product_comment_likes WHERE comment_id = ?`).bind(id).run();

    const del = await env.DB.prepare(`DELETE FROM product_comments WHERE id = ?`).bind(id).run();
    const changes = Number(del.meta?.changes ?? 0);

    return json({ success: true, deleted: changes > 0 });
  } catch (e: any) {
    return json({ success: false, error: e?.message || 'Server error' }, 500);
  }
};
