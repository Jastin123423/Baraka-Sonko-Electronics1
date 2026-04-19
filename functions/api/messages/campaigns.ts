// functions/api/messages/campaigns.ts
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
        message,
        recipient_mode,
        recipients,
        status,
        provider,
        created_at
      FROM message_campaigns
      ORDER BY datetime(created_at) DESC, rowid DESC
    `).all();

    const data = Array.isArray(results)
      ? results.map((row: any) => ({
          id: String(row.id),
          title: row.title || '',
          message: row.message || '',
          recipient_mode: row.recipient_mode || 'subscribed',
          recipients: Number(row.recipients || 0),
          status: row.status || 'draft',
          provider: row.provider || '',
          created_at: row.created_at || null,
        }))
      : [];

    return json({ success: true, data });
  } catch (error: any) {
    console.error('GET /api/messages/campaigns error:', error);
    return json(
      {
        success: false,
        error: error?.message || 'Failed to load campaigns',
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
    const message = String(body?.message || '').trim();
    const recipientMode = String(body?.recipient_mode || 'subscribed').trim() || 'subscribed';
    const status = String(body?.status || 'draft').trim() || 'draft';
    const provider = String(body?.provider || '').trim();

    const selectedIds = Array.isArray(body?.selected_ids)
      ? body.selected_ids.map((v: any) => String(v || '').trim()).filter(Boolean)
      : [];

    if (!title) {
      return json({ success: false, error: 'Campaign title is required' }, 400);
    }

    if (!message) {
      return json({ success: false, error: 'Campaign message is required' }, 400);
    }

    let recipients = 0;

    if (recipientMode === 'all') {
      const row = await env.DB.prepare(`
        SELECT COUNT(*) as total
        FROM message_contacts
      `).first();
      recipients = Number((row as any)?.total || 0);
    } else if (recipientMode === 'subscribed') {
      const row = await env.DB.prepare(`
        SELECT COUNT(*) as total
        FROM message_contacts
        WHERE subscribed = 1
      `).first();
      recipients = Number((row as any)?.total || 0);
    } else if (recipientMode === 'selected') {
      recipients = selectedIds.length;
    }

    await env.DB.prepare(`
      INSERT INTO message_campaigns (
        id,
        title,
        message,
        recipient_mode,
        recipients,
        status,
        provider,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
      .bind(id, title, message, recipientMode, recipients, status, provider)
      .run();

    const created = await env.DB.prepare(`
      SELECT
        id,
        title,
        message,
        recipient_mode,
        recipients,
        status,
        provider,
        created_at
      FROM message_campaigns
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
        message: (created as any)?.message || message,
        recipient_mode: (created as any)?.recipient_mode || recipientMode,
        recipients: Number((created as any)?.recipients || recipients),
        status: (created as any)?.status || status,
        provider: (created as any)?.provider || provider,
        created_at: (created as any)?.created_at || null,
      },
    });
  } catch (error: any) {
    console.error('POST /api/messages/campaigns error:', error);
    return json(
      {
        success: false,
        error: error?.message || 'Failed to save campaign',
      },
      500
    );
  }
};
