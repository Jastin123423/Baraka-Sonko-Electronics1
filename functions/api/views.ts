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

const readJson = async (request: Request) => {
  try {
    const ct = request.headers.get('content-type') || '';
    if (!ct.toLowerCase().includes('application/json')) return {};
    return await request.json().catch(() => ({}));
  } catch {
    return {};
  }
};

const getIp = (request: Request) =>
  str(
    request.headers.get('CF-Connecting-IP') ||
      request.headers.get('x-forwarded-for') ||
      ''
  );

const getUA = (request: Request) =>
  str(request.headers.get('user-agent')).toLowerCase();

const isBotUA = (ua: string) =>
  /bot|crawler|spider|crawl|facebookexternalhit|whatsapp|telegrambot|slurp|bingbot|googlebot|preview|meta-externalagent|python-requests|curl|wget/i.test(
    ua
  );

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
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!env?.DB) {
      return json({ success: false, error: 'DB binding missing (DB)' }, 500);
    }

    await ensureTables(env);

    const url = new URL(request.url);
    const productId = str(url.searchParams.get('productId'));

    if (!productId) {
      return json({ success: false, error: 'productId required' }, 400);
    }

    const row = await env.DB.prepare(
      `SELECT views, updated_at FROM product_view_counts WHERE product_id = ?`
    )
      .bind(productId)
      .first<any>();

    return json({
      success: true,
      data: {
        productId,
        views: Number(row?.views ?? 0),
        updatedAt: Number(row?.updated_at ?? 0),
      },
    });
  } catch (e: any) {
    console.error('GET /api/views error', e);
    return json(
      {
        success: false,
        error: e?.message || 'Server error',
      },
      500
    );
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!env?.DB) {
      return json({ success: false, error: 'DB binding missing (DB)' }, 500);
    }

    await ensureTables(env);

    const body = await readJson(request);
    const productId = str((body as any).productId);
    const now = Date.now();

    if (!productId) {
      return json({ success: false, error: 'productId required' }, 400);
    }

    const ua = getUA(request);
    const ip = getIp(request);
    const bot = isBotUA(ua);

    // If frontend sends viewerKey, use it.
    // Otherwise derive one from request info.
    // Bots are mixed into the same count too.
    const rawViewerKey = str((body as any).viewerKey);
    const viewerKey =
      rawViewerKey ||
      (bot
        ? `bot:${ip || 'unknown'}:${ua.slice(0, 120)}`
        : `guest:${ip || 'unknown'}`);

    // Prevent immediate accidental duplicates.
    // Keep a small window for humans; give bots a longer window so one crawler
    // does not inflate too fast from repeated hits.
    const duplicateWindowMs = bot ? 60_000 : 1_200;

    const recent = await env.DB.prepare(
      `
      SELECT id, created_at
      FROM product_views
      WHERE product_id = ?
        AND viewer_key = ?
        AND created_at >= ?
      ORDER BY created_at DESC
      LIMIT 1
      `
    )
      .bind(productId, viewerKey, now - duplicateWindowMs)
      .first<any>();

    let skippedDuplicate = false;

    if (!recent) {
      await env.DB.prepare(
        `
        INSERT INTO product_views (product_id, viewer_key, created_at)
        VALUES (?, ?, ?)
        `
      )
        .bind(productId, viewerKey, now)
        .run();

      await env.DB.prepare(
        `
        INSERT INTO product_view_counts (product_id, views, updated_at)
        VALUES (?, 1, ?)
        ON CONFLICT(product_id) DO UPDATE SET
          views = product_view_counts.views + 1,
          updated_at = excluded.updated_at
        `
      )
        .bind(productId, now)
        .run();
    } else {
      skippedDuplicate = true;
    }

    const row = await env.DB.prepare(
      `
      SELECT views, updated_at
      FROM product_view_counts
      WHERE product_id = ?
      `
    )
      .bind(productId)
      .first<any>();

    return json({
      success: true,
      data: {
        productId,
        views: Number(row?.views ?? 0),
        updatedAt: Number(row?.updated_at ?? 0),
        skippedDuplicate,
        bot,
      },
    });
  } catch (e: any) {
    console.error('POST /api/views error', e);
    return json(
      {
        success: false,
        error: e?.message || 'Server error',
      },
      500
    );
  }
};
