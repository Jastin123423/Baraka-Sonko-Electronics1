// functions/api/messages/templates.ts
import type { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

const makeId = () =>
  `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const { results } = await env.DB.prepare(`
      SELECT
        id,
        title,
        content,
        created_at
      FROM message_templates
      ORDER BY datetime(created_at) DESC, rowid DESC
    `).all();

    const data = Array.isArray(results)
      ? results.map((row: any) => ({
          id: String(row.id),
          title: row.title || '',
          content: row.content || '',
          created_at: row.created_at || null,
        }))
      : [];

    return json({ success: true, data });
  } catch (error: any) {
    console.error('GET /api/messages/templates error:', error);
    return json(
      {
        success: false,
        error: error?.message || 'Failed to load templates',
      },
      500
    );
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json().catch(() => null);

    const id = makeId();
    const title = String(body?.title || '').trim();
    const content = String(body?.content || '').trim();

    if (!title) {
      return json({ success: false, error: 'Template title is required' }, 400);
    }

    if (!content) {
      return json({ success: false, error: 'Template content is required' }, 400);
    }

    await env.DB.prepare(`
      INSERT INTO message_templates (
        id,
        title,
        content,
        created_at
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `)
      .bind(id, title, content)
      .run();

    const created = await env.DB.prepare(`
      SELECT
        id,
        title,
        content,
        created_at
      FROM message_templates
      WHERE id = ?
      LIMIT 1
    `)
      .bind(id)
      .first();

    return json({
      success: true,
      data: {
        id: String((created as any)?.id || id),
        title: (created as any)?.title || title,
        content: (created as any)?.content || content,
        created_at: (created as any)?.created_at || null,
      },
    });
  } catch (error: any) {
    console.error('POST /api/messages/templates error:', error);
    return json(
      {
        success: false,
        error: error?.message || 'Failed to create template',
      },
      500
    );
  }
};
