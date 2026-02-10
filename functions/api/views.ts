
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const productId = str(body.productId);
    const viewerKey = str(body.viewerKey) || 'guest';

    if (!productId) return json({ success: false, error: 'productId required' }, 400);

    const now = Date.now();

    // Optional: keep a raw log (NOT unique)
    // If your product_views table has UNIQUE(product_id, viewer_key) you must remove that unique index/constraint.
    await env.DB.prepare(
      `INSERT INTO product_views (product_id, viewer_key, created_at)
       VALUES (?, ?, ?)`
    )
      .bind(productId, viewerKey, now)
      .run();

    // ALWAYS increment counter
    await env.DB.prepare(
      `INSERT INTO product_view_counts (product_id, views, updated_at)
       VALUES (?, 1, ?)
       ON CONFLICT(product_id) DO UPDATE SET
         views = views + 1,
         updated_at = excluded.updated_at`
    )
      .bind(productId, now)
      .run();

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
