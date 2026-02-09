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

const str = (v: any) => String(v ?? '').trim();

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  try {
    const id = str((params as any).id);
    const body = await request.json().catch(() => ({}));
    const userId = str(body.userId) || 'guest';

    if (!id) return json({ success: false, error: 'id required' }, 400);

    const now = Date.now();

    // Insert like uniquely
    const ins = await env.DB.prepare(
      `INSERT OR IGNORE INTO product_comment_likes (comment_id, user_id, created_at)
       VALUES (?, ?, ?)`
    )
      .bind(id, userId, now)
      .run();

    // Only increment if it was newly inserted
    if (Number(ins.meta?.changes ?? 0) > 0) {
      await env.DB.prepare(
        `UPDATE product_comments SET likes = likes + 1 WHERE id = ?`
      )
        .bind(id)
        .run();
    }

    return json({ success: true });
  } catch (e: any) {
    return json({ success: false, error: e?.message || 'Server error' }, 500);
  }
};
