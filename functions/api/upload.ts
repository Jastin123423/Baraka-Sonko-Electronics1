// functions/api/upload.ts
import type { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  R2_MEDIA: R2Bucket; // R2 bucket binding (sonko)
};

const PUBLIC_MEDIA_BASE = 'https://media.barakasonko.store';

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

const safeExt = (filename: string) => {
  const m = filename.toLowerCase().match(/\.([a-z0-9]{1,8})$/);
  return m ? m[1] : 'bin';
};

const sanitizeBase = (filename: string) =>
  filename
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'file';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!env.R2_MEDIA) {
      return json({ success: false, error: 'R2 binding missing (R2_MEDIA)' }, 500);
    }

    // ✅ DO NOT check content-type — Cloudflare Pages can be inconsistent
    const form = await request.formData();

    const multi = form.getAll('files').filter(v => v instanceof File) as File[];
    const single = form.get('file');
    const files: File[] = multi.length
      ? multi
      : single instanceof File
      ? [single]
      : [];

    if (files.length === 0) {
      return json({
        success: false,
        error: 'No files found. Use field "files" or "file".',
      }, 400);
    }

    const urls: string[] = [];
    const MAX_MB = 80;

    for (const file of files) {
      if (file.size > MAX_MB * 1024 * 1024) {
        return json({ success: false, error: `File too large: ${file.name}` }, 413);
      }

      const ext = safeExt(file.name);
      const base = sanitizeBase(file.name);
      const key = `uploads/${Date.now()}-${crypto.randomUUID()}-${base}.${ext}`;

      await env.R2_MEDIA.put(key, file.stream(), {
        httpMetadata: { contentType: file.type || 'application/octet-stream' },
      });

      urls.push(`${PUBLIC_MEDIA_BASE}/${key}`);
    }

    return json({ success: true, data: urls });
  } catch (e: any) {
    return json({ success: false, error: e?.message || 'Upload failed' }, 500);
  }
};
