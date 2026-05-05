// functions/api/messages/campaigns/[id].ts
import type { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PATCH,DELETE,OPTIONS',
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

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  try {
    const id = String(params.id || '').trim();

    if (!id) {
      return json({ success: false, error: 'Missing campaign id' }, 400);
    }

    const campaign = await env.DB.prepare(`
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

    if (!campaign) {
      return json({ success: false, error: 'Campaign not found' }, 404);
    }

    return json({
      success: true,
      data: {
        id: String((campaign as any).id),
        title: (campaign as any).title || '',
        message: (campaign as any).message || '',
        recipient_mode: (campaign as any).recipient_mode || 'subscribed',
        recipients: Number((campaign as any).recipients || 0),
        status: (campaign as any).status || 'draft',
        provider: (campaign as any).provider || '',
        created_at: (campaign as any).created_at || null,
      },
    });
  } catch (error: any) {
    console.error('GET /api/messages/campaigns/:id error:', error);
    return json(
      {
        success: false,
        error: error?.message || 'Failed to load campaign',
      },
      500
    );
  }
};

export const onRequestPatch: PagesFunction<Env> = async ({ params, request, env }) => {
  try {
    const id = String(params.id || '').trim();

    if (!id) {
      return json({ success: false, error: 'Missing campaign id' }, 400);
    }

    const body = await request.json().catch(() => null);

    const existing = await env.DB.prepare(`
      SELECT id, status
      FROM message_campaigns
      WHERE id = ?
      LIMIT 1
    `)
      .bind(id)
      .first();

    if (!existing) {
      return json({ success: false, error: 'Campaign not found' }, 404);
    }

    const title = String(body?.title ?? '').trim();
    const message = String(body?.message ?? '').trim();
    const status = String(body?.status ?? '').trim();

    const updates: string[] = [];
    const values: any[] = [];

    if (title) {
      updates.push('title = ?');
      values.push(title);
    }

    if (message) {
      updates.push('message = ?');
      values.push(message);
    }

    if (status) {
      const allowed = new Set(['draft', 'queued', 'sending', 'completed', 'failed']);
      if (!allowed.has(status)) {
        return json({ success: false, error: 'Invalid campaign status' }, 400);
      }
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      return json({ success: false, error: 'Nothing to update' }, 400);
    }

    values.push(id);

    await env.DB.prepare(`
      UPDATE message_campaigns
      SET ${updates.join(', ')}
      WHERE id = ?
    `)
      .bind(...values)
      .run();

    const updated = await env.DB.prepare(`
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
        id: String((updated as any).id),
        title: (updated as any).title || '',
        message: (updated as any).message || '',
        recipient_mode: (updated as any).recipient_mode || 'subscribed',
        recipients: Number((updated as any).recipients || 0),
        status: (updated as any).status || 'draft',
        provider: (updated as any).provider || '',
        created_at: (updated as any).created_at || null,
      },
    });
  } catch (error: any) {
    console.error('PATCH /api/messages/campaigns/:id error:', error);
    return json(
      {
        success: false,
        error: error?.message || 'Failed to update campaign',
      },
      500
    );
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
  try {
    const id = String(params.id || '').trim();

    if (!id) {
      return json({ success: false, error: 'Missing campaign id' }, 400);
    }

    const existing = await env.DB.prepare(`
      SELECT id
      FROM message_campaigns
      WHERE id = ?
      LIMIT 1
    `)
      .bind(id)
      .first();

    if (!existing) {
      return json({ success: false, error: 'Campaign not found' }, 404);
    }

    await env.DB.prepare(`
      DELETE FROM message_campaign_recipients
      WHERE campaign_id = ?
    `)
      .bind(id)
      .run();

    await env.DB.prepare(`
      DELETE FROM message_logs
      WHERE campaign_id = ?
    `)
      .bind(id)
      .run();

    await env.DB.prepare(`
      DELETE FROM message_campaigns
      WHERE id = ?
    `)
      .bind(id)
      .run();

    return json({
      success: true,
      data: { id },
      message: 'Campaign deleted successfully',
    });
  } catch (error: any) {
    console.error('DELETE /api/messages/campaigns/:id error:', error);
    return json(
      {
        success: false,
        error: error?.message || 'Failed to delete campaign',
      },
      500
    );
  }
};
