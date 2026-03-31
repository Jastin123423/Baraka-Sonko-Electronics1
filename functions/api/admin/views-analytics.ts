import type { PagesFunction } from '@cloudflare/workers-types';

type Env = { DB: D1Database };

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
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

const startOfDayMs = (dateStr: string) => {
  return new Date(`${dateStr}T00:00:00`).getTime();
};

const endOfDayMs = (dateStr: string) => {
  return new Date(`${dateStr}T23:59:59.999`).getTime();
};

const ensureTables = async (env: Env) => {
  await env.DB.prepare(
    `
    CREATE TABLE IF NOT EXISTS product_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      viewer_key TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
    `
  ).run();

  await env.DB.prepare(
    `
    CREATE TABLE IF NOT EXISTS product_view_counts (
      product_id TEXT PRIMARY KEY,
      views INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    )
    `
  ).run();

  await env.DB.prepare(
    `
    CREATE INDEX IF NOT EXISTS idx_product_views_lookup
    ON product_views (product_id, viewer_key, created_at)
    `
  ).run();

  await env.DB.prepare(
    `
    CREATE INDEX IF NOT EXISTS idx_product_views_product_created
    ON product_views (product_id, created_at)
    `
  ).run();

  await env.DB.prepare(
    `
    CREATE INDEX IF NOT EXISTS idx_product_views_created_at
    ON product_views (created_at)
    `
  ).run();
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!env?.DB) {
      return json({ success: false, error: 'DB binding missing (DB)' }, 500);
    }

    await ensureTables(env);

    const url = new URL(request.url);
    const from = str(url.searchParams.get('from'));
    const to = str(url.searchParams.get('to'));

    if (!from || !to) {
      return json({ success: false, error: 'from and to are required' }, 400);
    }

    const fromMs = startOfDayMs(from);
    const toMs = endOfDayMs(to);

    if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) {
      return json({ success: false, error: 'Invalid date range' }, 400);
    }

    if (fromMs > toMs) {
      return json({ success: false, error: 'from date cannot be greater than to date' }, 400);
    }

    // Total views in selected range
    const totalRow = await env.DB.prepare(
      `
      SELECT COUNT(*) as totalViews
      FROM product_views
      WHERE created_at >= ? AND created_at <= ?
      `
    )
      .bind(fromMs, toMs)
      .first<any>();

    // Daily series in selected range
    const seriesRows = await env.DB.prepare(
      `
      SELECT
        date(created_at / 1000, 'unixepoch') as date,
        COUNT(*) as views
      FROM product_views
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY date(created_at / 1000, 'unixepoch')
      ORDER BY date ASC
      `
    )
      .bind(fromMs, toMs)
      .all<any>();

    // Top viewed products in selected range
    // Assumes products table exists with id and title
    let topProducts: any[] = [];
    try {
      const topRows = await env.DB.prepare(
        `
        SELECT
          pv.product_id as productId,
          COALESCE(p.title, pv.product_id) as title,
          COUNT(*) as views
        FROM product_views pv
        LEFT JOIN products p ON CAST(p.id AS TEXT) = pv.product_id
        WHERE pv.created_at >= ? AND pv.created_at <= ?
        GROUP BY pv.product_id, p.title
        ORDER BY views DESC
        LIMIT 10
        `
      )
        .bind(fromMs, toMs)
        .all<any>();

      topProducts = Array.isArray(topRows?.results) ? topRows.results : [];
    } catch {
      // fallback if products table/join shape differs
      const topRowsFallback = await env.DB.prepare(
        `
        SELECT
          product_id as productId,
          product_id as title,
          COUNT(*) as views
        FROM product_views
        WHERE created_at >= ? AND created_at <= ?
        GROUP BY product_id
        ORDER BY views DESC
        LIMIT 10
        `
      )
        .bind(fromMs, toMs)
        .all<any>();

      topProducts = Array.isArray(topRowsFallback?.results) ? topRowsFallback.results : [];
    }

    // Lifetime total from aggregate table
    const lifetimeRow = await env.DB.prepare(
      `
      SELECT COALESCE(SUM(views), 0) as lifetimeViews
      FROM product_view_counts
      `
    ).first<any>();

    return json({
      success: true,
      data: {
        from,
        to,
        totalViews: Number(totalRow?.totalViews ?? 0),
        lifetimeViews: Number(lifetimeRow?.lifetimeViews ?? 0),
        series: Array.isArray(seriesRows?.results)
          ? seriesRows.results.map((row: any) => ({
              date: String(row.date),
              views: Number(row.views || 0),
            }))
          : [],
        topProducts: topProducts.map((row: any) => ({
          productId: String(row.productId ?? ''),
          title: String(row.title ?? row.productId ?? 'Unknown Product'),
          views: Number(row.views || 0),
        })),
      },
    });
  } catch (e: any) {
    console.error('GET /api/admin/views-analytics error', e);
    return json(
      {
        success: false,
        error: e?.message || 'Server error',
      },
      500
    );
  }
};
