// functions/api/products.ts
import type { PagesFunction } from '@cloudflare/workers-types';

type Env = { DB: D1Database };

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
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
const num = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const int = (v: any, fallback = 0) => {
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : fallback;
};

const parseJsonArray = (v: any): string[] => {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  try {
    const a = JSON.parse(String(v));
    return Array.isArray(a) ? a.map(String) : [];
  } catch {
    return [];
  }
};

const toClientProduct = (row: any) => {
  // Map DB snake_case -> your React camelCase expectations
  return {
    id: row.id,
    title: row.title,
    image: row.image,
    images: parseJsonArray(row.images),
    descriptionImages: parseJsonArray(row.description_images),
    videoUrl: row.video_url || null,
    price: Number(row.price),
    originalPrice: row.original_price ?? null,
    discount: row.discount ?? null,
    soldCount: row.sold_count ?? '0 sold',
    orderCount: row.order_count ?? '0 orders',
    rating: row.rating ?? 5.0,
    categoryId: row.category_id ?? null,
    category: row.category_name ?? null, // your UI uses product.category sometimes
    categoryName: row.category_name ?? null,
    status: row.status ?? 'online',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!env.DB) return json({ success: false, error: 'DB binding missing (DB)' }, 500);

    const url = new URL(request.url);
    const id = str(url.searchParams.get('id'));

    if (id) {
      const row = await env.DB.prepare(`SELECT * FROM products WHERE id=? LIMIT 1`).bind(id).first<any>();
      if (!row) return json({ success: false, error: 'Not found' }, 404);
      return json({ success: true, data: toClientProduct(row) });
    }

    const rows = await env.DB.prepare(`SELECT * FROM products ORDER BY created_at DESC`).all<any>();
    const list = (rows?.results || []).map(toClientProduct);

    return json({ success: true, data: list });
  } catch (e: any) {
    return json({ success: false, error: e?.message || 'Failed to load products' }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!env.DB) return json({ success: false, error: 'DB binding missing (DB)' }, 500);

    const body = await request.json().catch(() => ({}));

    // IMPORTANT: Body must already contain final R2 URLs (upload first).
    const id = crypto.randomUUID();
    const title = str(body.title);
    const image = str(body.image);
    const price = num(body.price, NaN);

    if (!title || !image || !Number.isFinite(price)) {
      return json({ success: false, error: 'Missing required: title, image, price' }, 400);
    }

    const images = Array.isArray(body.images) ? body.images.map(String) : [];
    const descriptionImages = Array.isArray(body.descriptionImages) ? body.descriptionImages.map(String) : [];
    const videoUrl = body.videoUrl ? String(body.videoUrl) : null;

    const originalPrice = body.originalPrice != null ? num(body.originalPrice, null as any) : null;
    const discount = body.discount != null ? int(body.discount, null as any) : null;

    const soldCount = str(body.soldCount || '0 sold');
    const orderCount = str(body.orderCount || '0 orders');
    const rating = body.rating != null ? num(body.rating, 5.0) : 5.0;

    const categoryId = body.categoryId ? str(body.categoryId) : null;
    const categoryName = body.categoryName ? str(body.categoryName) : (body.category ? str(body.category) : null);

    const status = str(body.status || 'online');

    await env.DB.prepare(
      `INSERT INTO products (
        id, title, image, images, description_images, video_url,
        price, original_price, discount, sold_count, order_count, rating,
        category_id, category_name, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        title,
        image,
        JSON.stringify(images),
        JSON.stringify(descriptionImages),
        videoUrl,
        price,
        originalPrice,
        discount,
        soldCount,
        orderCount,
        rating,
        categoryId,
        categoryName,
        status
      )
      .run();

    const row = await env.DB.prepare(`SELECT * FROM products WHERE id=? LIMIT 1`).bind(id).first<any>();
    return json({ success: true, data: toClientProduct(row) }, 201);
  } catch (e: any) {
    return json({ success: false, error: e?.message || 'Failed to create product' }, 500);
  }
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!env.DB) return json({ success: false, error: 'DB binding missing (DB)' }, 500);

    const url = new URL(request.url);
    const id = str(url.searchParams.get('id'));
    if (!id) return json({ success: false, error: 'Missing id' }, 400);

    const body = await request.json().catch(() => ({}));

    // Only update fields provided
    const sets: string[] = [];
    const binds: any[] = [];

    const set = (col: string, val: any) => {
      sets.push(`${col}=?`);
      binds.push(val);
    };

    if (body.title != null) set('title', str(body.title));
    if (body.image != null) set('image', str(body.image));
    if (body.images != null) set('images', JSON.stringify(parseJsonArray(body.images)));
    if (body.descriptionImages != null) set('description_images', JSON.stringify(parseJsonArray(body.descriptionImages)));
    if (body.videoUrl !== undefined) set('video_url', body.videoUrl ? str(body.videoUrl) : null);

    if (body.price != null) set('price', num(body.price, 0));
    if (body.originalPrice !== undefined) set('original_price', body.originalPrice == null ? null : num(body.originalPrice, 0));
    if (body.discount !== undefined) set('discount', body.discount == null ? null : int(body.discount, 0));

    if (body.soldCount != null) set('sold_count', str(body.soldCount));
    if (body.orderCount != null) set('order_count', str(body.orderCount));
    if (body.rating != null) set('rating', num(body.rating, 5));

    if (body.categoryId !== undefined) set('category_id', body.categoryId ? str(body.categoryId) : null);
    if (body.categoryName !== undefined) set('category_name', body.categoryName ? str(body.categoryName) : null);
    if (body.status != null) set('status', str(body.status));

    // Always update updated_at
    set('updated_at', new Date().toISOString());

    if (sets.length === 0) return json({ success: false, error: 'No fields to update' }, 400);

    await env.DB.prepare(`UPDATE products SET ${sets.join(', ')} WHERE id=?`)
      .bind(...binds, id)
      .run();

    const row = await env.DB.prepare(`SELECT * FROM products WHERE id=? LIMIT 1`).bind(id).first<any>();
    if (!row) return json({ success: false, error: 'Not found' }, 404);

    return json({ success: true, data: toClientProduct(row) });
  } catch (e: any) {
    return json({ success: false, error: e?.message || 'Failed to update product' }, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!env.DB) return json({ success: false, error: 'DB binding missing (DB)' }, 500);

    const url = new URL(request.url);
    const id = str(url.searchParams.get('id'));
    if (!id) return json({ success: false, error: 'Missing id' }, 400);

    const res = await env.DB.prepare(`DELETE FROM products WHERE id=?`).bind(id).run();
    return json({ success: true, deleted: res.success });
  } catch (e: any) {
    return json({ success: false, error: e?.message || 'Failed to delete product' }, 500);
  }
};
