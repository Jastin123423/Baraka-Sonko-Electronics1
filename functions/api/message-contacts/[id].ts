// functions/api/message-contacts/[id].ts
import type { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH,DELETE,OPTIONS',
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

export const onRequestPatch: PagesFunction<Env> = async ({ params, request, env }) => {
  try {
    const id = String(params.id || '').trim();
    if (!id) {
      return json({ success: false, error: 'Missing contact id' }, 400);
    }

    const body = await request.json().catch(() => null);
    const subscribed =
      typeof body?.subscribed === 'boolean'
        ? body.subscribed
          ? 1
          : 0
        : null;

    if (subscribed === null) {
      return json(
        {
          success: false,
          error: 'Nothing to update',
        },
        400
      );
    }

    const existing = await env.DB.prepare(
      `SELECT id FROM message_contacts WHERE id = ? LIMIT 1`
    )
      .bind(id)
      .first();

    if (!existing) {
      return json(
        {
          success: false,
          error: 'Contact not found',
        },
        404
      );
    }

    await env.DB.prepare(`
      UPDATE message_contacts
      SET subscribed = ?
      WHERE id = ?
    `)
      .bind(subscribed, id)
      .run();

    const updated = await env.DB.prepare(`
      SELECT
        id,
        name,
        phone,
        subscribed,
        source,
        tags,
        created_at
      FROM message_contacts
      WHERE id = ?
      LIMIT 1
    `)
      .bind(id)
      .first();

    return json({
      success: true,
      data: {
        id: String((updated as any)?.id || id),
        name: (updated as any)?.name || '',
        phone: (updated as any)?.phone || '',
        subscribed: Number((updated as any)?.subscribed || 0) === 1,
        source: (updated as any)?.source || 'manual',
        tags: (() => {
          try {
            return (updated as any)?.tags ? JSON.parse((updated as any).tags) : [];
          } catch {
            return [];
          }
        })(),
        created_at: (updated as any)?.created_at || null,
      },
    });
  } catch (error: any) {
    console.error('PATCH /api/message-contacts/:id error:', error);
    return json(
      {
        success: false,
        error: error?.message || 'Failed to update contact',
      },
      500
    );
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
  try {
    const id = String(params.id || '').trim();
    if (!id) {
      return json({ success: false, error: 'Missing contact id' }, 400);
    }

    const existing = await env.DB.prepare(
      `SELECT id FROM message_contacts WHERE id = ? LIMIT 1`
    )
      .bind(id)
      .first();

    if (!existing) {
      return json(
        {
          success: false,
          error: 'Contact not found',
        },
        404
      );
    }

    await env.DB.prepare(`DELETE FROM message_contacts WHERE id = ?`)
      .bind(id)
      .run();

    return json({
      success: true,
      data: { id },
      message: 'Contact deleted successfully',
    });
  } catch (error: any) {
    console.error('DELETE /api/message-contacts/:id error:', error);
    return json(
      {
        success: false,
        error: error?.message || 'Failed to delete contact',
      },
      500
    );
  }
};
