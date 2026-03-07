// functions/api/products.ts
import type { PagesFunction } from '@cloudflare/workers-types';

type Env = { DB: D1Database };

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: cors });

// ✅ DEFAULT PRODUCT VIDEO
const DEFAULT_VIDEO_URL =
  'https://media.barakasonko.store/uploads/Facebook_1770123707890(720p).mp4';

const safeJsonParseArray = (v: any): string[] => {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);

  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      return [];
    } catch {
      if (s.startsWith('http')) return [s];
      return [];
    }
  }
  return [];
};

type ImageVariant = {
  url: string;
  price: number;
  label: string;
  isMain: boolean;
  position: number;
};

const safeJsonParseImageVariants = (v: any): ImageVariant[] => {
  if (!v) return [];

  let parsed: any = v;

  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return [];
    try {
      parsed = JSON.parse(s);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item: any, index: number) => ({
      url: String(item?.url || '').trim(),
      price: Number(item?.price || 0),
      label: String(item?.label || '').trim(),
      isMain: !!item?.isMain,
      position: Number.isFinite(Number(item?.position)) ? Number(item.position) : index,
    }))
    .filter((item: ImageVariant) => !!item.url);
};

const pickFirstUrl = (arr: string[]): string => (arr && arr.length ? String(arr[0]) : '');

const genId = () => {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const buildProductResponse = (row: any) => {
  const imagesArr = safeJsonParseArray(row.images);
  const descArr = safeJsonParseArray(row.description_images);
  const imageVariants = safeJsonParseImageVariants(row.image_variants);

  return {
    id: String(row.id),
    title: String(row.title || ''),
    description: String(row.description || ''),

    image: String(row.image || pickFirstUrl(imagesArr) || ''),
    image_url: String(row.image || pickFirstUrl(imagesArr) || ''),

    images: imagesArr,
    image_urls: imagesArr,

    description_images: descArr,
    descriptionImages: descArr,

    video_url: String(row.video_url || '').trim() || DEFAULT_VIDEO_URL,
    videoUrl: String(row.video_url || '').trim() || DEFAULT_VIDEO_URL,

    price: Number(row.price || 0),
    sellingPrice: Number(row.price || 0),

    original_price: row.original_price == null ? null : Number(row.original_price),
    originalPrice: row.original_price == null ? null : Number(row.original_price),

    discount: row.discount == null ? 0 : Number(row.discount),

    sold_count: String(row.sold_count || '0 sold'),
    soldCount: String(row.sold_count || '0 sold'),

    order_count: String(row.order_count || '0 orders'),
    orderCount: String(row.order_count || '0 orders'),

    rating: row.rating == null ? 5.0 : Number(row.rating),

    category_id: row.category_id == null ? null : String(row.category_id),
    categoryId: row.category_id == null ? null : String(row.category_id),

    category_name: String(row.category_name || ''),
    categoryName: String(row.category_name || ''),

    image_variants: imageVariants,
    imageVariants,

    status: String(row.status || 'online'),
    created_at: String(row.created_at || ''),
    createdAt: String(row.created_at || ''),
    updated_at: String(row.updated_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
};

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  try {
    if (!env.DB) return json({ success: false, error: 'DB binding missing (DB)' }, 500);

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 200), 1), 500);

    if (id) {
      const row = await env.DB.prepare(
        `
        SELECT
          id, title, image, images, description_images, video_url,
          price, original_price, discount, sold_count, order_count, rating,
          category_id, category_name, status, created_at, updated_at,
          description, image_variants
        FROM products
        WHERE id = ?
        `
      )
        .bind(id)
        .first<any>();

      if (!row) return json({ success: false, error: 'Not found' }, 404);

      const product = buildProductResponse(row);
      return json({ success: true, data: product });
    }

    const { results } = await env.DB.prepare(
      `
      SELECT
        id, title, image, images, description_images, video_url,
        price, original_price, discount, sold_count, order_count, rating,
        category_id, category_name, status, created_at, updated_at,
        description, image_variants
      FROM products
      ORDER BY datetime(created_at) DESC
      LIMIT ?
      `
    )
      .bind(limit)
      .all<any>();

    const list = (results || []).map((row: any) => buildProductResponse(row));

    return json({ success: true, data: list });
  } catch (e: any) {
    console.error('GET /api/products error', e);
    return json({ success: false, error: e?.message || 'Server error' }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  try {
    if (!env.DB) return json({ success: false, error: 'DB binding missing (DB)' }, 500);

    const body = await request.json().catch(() => ({} as any));

    const title = String(body.title || '').trim();
    const description = String(body.description || '').trim();

    const price = Number(body.price ?? body.sellingPrice);
    const discount = body.discount == null ? 0 : Number(body.discount);
    const originalPrice = body.originalPrice ?? body.original_price ?? null;

    const imagesArr = safeJsonParseArray(body.images ?? body.image_urls ?? []);
    const descArr = safeJsonParseArray(body.descriptionImages ?? body.description_images ?? []);

    const rawImageVariants =
      Array.isArray(body.imageVariants) ? body.imageVariants :
      Array.isArray(body.image_variants) ? body.image_variants :
      [];

    const imageVariants = safeJsonParseImageVariants(rawImageVariants);

    const videoUrl =
      String(body.videoUrl ?? body.video_url ?? '').trim() || DEFAULT_VIDEO_URL;

    const mainImageFromVariants =
      imageVariants.find(v => v.isMain)?.url ||
      imageVariants[0]?.url ||
      '';

    const mainImage =
      String(body.image || body.image_url || '').trim() ||
      mainImageFromVariants ||
      pickFirstUrl(imagesArr);

    if (!title) return json({ success: false, error: 'Title is required' }, 400);
    if (!Number.isFinite(price) || price <= 0) {
      return json({ success: false, error: 'Valid price is required' }, 400);
    }
    if (!mainImage) {
      return json({ success: false, error: 'At least one image is required' }, 400);
    }

    const categoryId = String(body.category_id || body.categoryId || '').trim() || null;
    const categoryName = String(body.category_name || body.categoryName || body.category || '').trim();

    const id = String(body.id || genId());
    const now = new Date().toISOString();

    const imagesJson = JSON.stringify(imagesArr);
    const descJson = JSON.stringify(descArr);
    const imageVariantsJson = JSON.stringify(imageVariants);

    await env.DB.prepare(
      `
      INSERT INTO products (
        id, title, image, images, description_images, video_url,
        price, original_price, discount,
        sold_count, order_count, rating,
        category_id, category_name,
        status, created_at, updated_at,
        description, image_variants
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?
      )
      `
    )
      .bind(
        id,
        title,
        mainImage,
        imagesJson,
        descJson,
        videoUrl,
        price,
        originalPrice == null ? null : Number(originalPrice),
        Number.isFinite(discount) ? discount : 0,
        String(body.sold_count || body.soldCount || '0 sold'),
        String(body.order_count || body.orderCount || '0 orders'),
        body.rating == null ? 5.0 : Number(body.rating),
        categoryId,
        categoryName,
        String(body.status || 'online'),
        String(body.created_at || body.createdAt || now),
        now,
        description,
        imageVariantsJson
      )
      .run();

    const saved = {
      id,
      title,
      description,

      image: mainImage,
      image_url: mainImage,

      images: imagesArr,
      image_urls: imagesArr,

      description_images: descArr,
      descriptionImages: descArr,

      video_url: videoUrl,
      videoUrl: videoUrl,

      price,
      sellingPrice: price,

      original_price: originalPrice == null ? null : Number(originalPrice),
      originalPrice: originalPrice == null ? null : Number(originalPrice),

      discount: Number.isFinite(discount) ? discount : 0,

      sold_count: String(body.sold_count || body.soldCount || '0 sold'),
      soldCount: String(body.sold_count || body.soldCount || '0 sold'),

      order_count: String(body.order_count || body.orderCount || '0 orders'),
      orderCount: String(body.order_count || body.orderCount || '0 orders'),

      rating: body.rating == null ? 5.0 : Number(body.rating),

      category_id: categoryId,
      categoryId: categoryId,

      category_name: categoryName,
      categoryName: categoryName,

      image_variants: imageVariants,
      imageVariants: imageVariants,

      status: String(body.status || 'online'),
      created_at: String(body.created_at || body.createdAt || now),
      createdAt: String(body.created_at || body.createdAt || now),
      updated_at: now,
      updatedAt: now,
    };

    return json({ success: true, data: saved }, 201);
  } catch (e: any) {
    console.error('POST /api/products error', e);
    return json({ success: false, error: e?.message || 'Server error' }, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, request }) => {
  try {
    if (!env.DB) return json({ success: false, error: 'DB binding missing (DB)' }, 500);

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return json({ success: false, error: 'Missing id' }, 400);

    await env.DB.prepare(`DELETE FROM products WHERE id = ?`).bind(id).run();
    return json({ success: true, data: { id } });
  } catch (e: any) {
    console.error('DELETE /api/products error', e);
    return json({ success: false, error: e?.message || 'Server error' }, 500);
  }
};
