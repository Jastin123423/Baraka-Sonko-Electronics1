// functions/api/categories.ts
import type { PagesFunction } from '@cloudflare/workers-types';

type Env = { DB: D1Database };

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
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
    if (!env.DB) return json({ success: false, error: 'DB binding missing (DB)' }, 500);

    const url = new URL(request.url);
    const id = str(url.searchParams.get('id'));

    if (id) {
      const row = await env.DB
        .prepare(`SELECT id, name, icon, created_at, updated_at FROM categories WHERE id=? LIMIT 1`)
        .bind(id)
        .first<any>();

      if (!row) return json({ success: false, error: 'Not found' }, 404);
      return json({ success: true, data: row });
    }

    const rows = await env.DB
      .prepare(`SELECT id, name, icon, created_at, updated_at FROM categories ORDER BY CAST(id AS INTEGER) ASC`)
      .all<any>();

    return json({ success: true, data: rows.results || [] });
  } catch (e: any) {
    return json({ success: false, error: e?.message || 'Failed to load categories' }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!env.DB) return json({ success: false, error: 'DB binding missing (DB)' }, 500);

    const body = await request.json().catch(() => ({}));
    const id = body.id != null ? str(body.id) : crypto.randomUUID();
    const name = str(body.name);
    const icon = body.icon != null ? str(body.icon) : null;

    if (!name) return json({ success: false, error: 'Missing required field: name' }, 400);

    await env.DB
      .prepare(
        `INSERT INTO categories (id, name, icon, created_at, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
      .bind(id, name, icon)
      .run();

    const row = await env.DB
      .prepare(`SELECT id, name, icon, created_at, updated_at FROM categories WHERE id=? LIMIT 1`)
      .bind(id)
      .first<any>();

    return json({ success: true, data: row }, 201);
  } catch (e: any) {
    const msg = String(e?.message || '').toLowerCase();
    if (msg.includes('unique') || msg.includes('constraint')) {
      return json({ success: false, error: 'Category id or name already exists' }, 409);
    }
    return json({ success: false, error: e?.message || 'Failed to create category' }, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!env.DB) return json({ success: false, error: 'DB binding missing (DB)' }, 500);

    const url = new URL(request.url);
    const id = str(url.searchParams.get('id'));
    if (!id) return json({ success: false, error: 'Missing id' }, 400);

    const used = await env.DB
      .prepare(`SELECT COUNT(1) as c FROM products WHERE category_id=?`)
      .bind(id)
      .first<any>();

    if (used?.c && Number(used.c) > 0) {
      return json({ success: false, error: 'Cannot delete: category is used by products' }, 409);
    }

    await env.DB.prepare(`DELETE FROM categories WHERE id=?`).bind(id).run();
    return json({ success: true });
  } catch (e: any) {
    return json({ success: false, error: e?.message || 'Failed to delete category' }, 500);
  }
};
