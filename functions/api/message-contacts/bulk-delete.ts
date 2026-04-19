// functions/api/message-contacts/bulk-delete.ts
import type { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
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

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json().catch(() => null);
    const ids = Array.isArray(body?.ids)
      ? body.ids.map((v: any) => String(v || '').trim()).filter(Boolean)
      : [];

    if (ids.length === 0) {
      return json(
        {
          success: false,
          error: 'No ids provided',
        },
        400
      );
    }

    let deleted = 0;

    for (const id of ids) {
      const existing = await env.DB.prepare(
        `SELECT id FROM message_contacts WHERE id = ? LIMIT 1`
      )
        .bind(id)
        .first();

      if (!existing) continue;

      await env.DB.prepare(`DELETE FROM message_contacts WHERE id = ?`)
        .bind(id)
        .run();

      deleted += 1;
    }

    return json({
      success: true,
      data: {
        requested: ids.length,
        deleted,
      },
      message: `${deleted} contact(s) deleted successfully`,
    });
  } catch (error: any) {
    console.error('POST /api/message-contacts/bulk-delete error:', error);
    return json(
      {
        success: false,
        error: error?.message || 'Failed to bulk delete contacts',
      },
      500
    );
  }
};
