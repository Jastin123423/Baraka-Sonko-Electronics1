// functions/api/upload.ts
import type { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  R2_MEDIA: R2Bucket;
  PUBLIC_MEDIA_BASE: string; // e.g. https://media.barakasonko.store
};

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

const safeExt = (name: string) => {
  const m = name.toLowerCase().match(/\.([a-z0-9]{1,8})$/);
  return m ? m[1] : 'bin';
};

const sanitizeBase = (name: string) =>
  name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'file';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!env.R2_MEDIA) return json({ success: false, error: 'R2 binding missing (R2_MEDIA)' }, 500);

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return json({ success: false, error: 'Expected multipart/form-data' }, 400);
    }

    const form = await request.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return json({ success: false, error: 'Missing file field "file"' }, 400);
    }

    // Basic size guard (adjust as needed)
    const MAX_MB = 50;
    if (file.size > MAX_MB * 1024 * 1024) {
      return json({ success: false, error: `File too large. Max ${MAX_MB}MB` }, 413);
    }

    const ext = safeExt(file.name);
    const base = sanitizeBase(file.name);

    // Put everything under /uploads/
    const key = `uploads/${Date.now()}-${crypto.randomUUID()}-${base}.${ext}`;

    await env.R2_MEDIA.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type || 'application/octet-stream',
      },
    });

    const publicBase = env.PUBLIC_MEDIA_BASE || 'https://media.barakasonko.store';
    const url = `${publicBase}/${key}`;

    return json({ success: true, key, url });
  } catch (e: any) {
    return json({ success: false, error: e?.message || 'Upload failed' }, 500);
  }
};
