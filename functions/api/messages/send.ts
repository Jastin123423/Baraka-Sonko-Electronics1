// functions/api/messages/send.ts
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

const makeId = () =>
  `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json().catch(() => null);

    const title = String(body?.title || '').trim();
    const message = String(body?.message || '').trim();
    const recipientMode = String(body?.recipient_mode || 'subscribed');
    const selectedIds = Array.isArray(body?.selected_ids)
      ? body.selected_ids.map((v: any) => String(v))
      : [];
    const provider = String(body?.provider || 'mock');

    if (!title) return json({ success: false, error: 'Title required' }, 400);
    if (!message) return json({ success: false, error: 'Message required' }, 400);

    // 1. Fetch recipients
    let recipients: any[] = [];

    if (recipientMode === 'all') {
      const { results } = await env.DB.prepare(`
        SELECT id, phone FROM message_contacts
      `).all();
      recipients = results || [];
    }

    if (recipientMode === 'subscribed') {
      const { results } = await env.DB.prepare(`
        SELECT id, phone FROM message_contacts
        WHERE subscribed = 1
      `).all();
      recipients = results || [];
    }

    if (recipientMode === 'selected') {
      if (selectedIds.length === 0) {
        return json({ success: false, error: 'No selected recipients' }, 400);
      }

      const placeholders = selectedIds.map(() => '?').join(',');
      const { results } = await env.DB.prepare(`
        SELECT id, phone FROM message_contacts
        WHERE id IN (${placeholders})
      `)
        .bind(...selectedIds)
        .all();

      recipients = results || [];
    }

    const totalRecipients = recipients.length;

    if (totalRecipients === 0) {
      return json({ success: false, error: 'No recipients found' }, 400);
    }

    // 2. Create campaign
    const campaignId = makeId();

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
      .bind(
        campaignId,
        title,
        message,
        recipientMode,
        totalRecipients,
        'sending',
        provider
      )
      .run();

    let sent = 0;
    let failed = 0;

    // 3. Send loop (currently mock)
    for (const r of recipients) {
      const contactId = String(r.id);
      const phone = String(r.phone);

      const recipientId = makeId();

      try {
        // 🔥 HERE you will later plug SMS provider (Africa's Talking / Next SMS)

        const success = true; // mock success

        await env.DB.prepare(`
          INSERT INTO message_campaign_recipients (
            id,
            campaign_id,
            contact_id,
            phone,
            status,
            created_at
          ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `)
          .bind(
            recipientId,
            campaignId,
            contactId,
            phone,
            success ? 'sent' : 'failed'
          )
          .run();

        await env.DB.prepare(`
          INSERT INTO message_logs (
            id,
            campaign_id,
            phone,
            message,
            status,
            provider_response,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `)
          .bind(
            makeId(),
            campaignId,
            phone,
            message,
            success ? 'sent' : 'failed',
            'mock'
          )
          .run();

        if (success) sent++;
        else failed++;
      } catch (err) {
        failed++;
      }
    }

    // 4. Update campaign status
    await env.DB.prepare(`
      UPDATE message_campaigns
      SET status = ?
      WHERE id = ?
    `)
      .bind('completed', campaignId)
      .run();

    return json({
      success: true,
      data: {
        campaign_id: campaignId,
        recipients: totalRecipients,
        sent,
        failed,
      },
      message: 'Campaign sent successfully',
    });
  } catch (error: any) {
    console.error('SEND SMS error:', error);
    return json(
      {
        success: false,
        error: error?.message || 'Failed to send campaign',
      },
      500
    );
  }
};
