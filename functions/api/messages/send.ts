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

const SMS_FOOTER_LINES = [
  'Tel: 0656738253',
  'Pakua App:https://bit.ly/4cufLcJ',
];

const SMS_FOOTER_TEXT = SMS_FOOTER_LINES.join('\n');

const buildFinalSmsMessage = (rawMessage: string) => {
  const body = String(rawMessage || '').trim();
  if (!body) return SMS_FOOTER_TEXT;
  return `${body}\n\n-----------------------\n${SMS_FOOTER_TEXT}`;
};

const normalizePhone = (value: any) => {
  let v = String(value || '').trim();
  v = v.replace(/[^\d+]/g, '');

  if (!v) return '';

  if (v.startsWith('00')) v = `+${v.slice(2)}`;

  if (!v.startsWith('+') && v.startsWith('0')) {
    if (v.length >= 10) v = `+255${v.slice(1)}`;
  }

  if (!v.startsWith('+') && /^\d+$/.test(v)) {
    if (v.startsWith('255')) v = `+${v}`;
    else if (v.length >= 9) v = `+${v}`;
  }

  return v;
};

const chunkArray = <T,>(items: T[], size: number) => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
};

async function sendViaAfricasTalking(params: {
  username: string;
  apiKey: string;
  to: string[];
  message: string;
  from?: string;
}) {
  const form = new URLSearchParams();
  form.set('username', params.username);
  form.set('to', params.to.join(','));
  form.set('message', params.message);

  if (params.from) {
    form.set('from', params.from);
  }

  const response = await fetch('https://api.africastalking.com/version1/messaging', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      apiKey: params.apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });

  const rawText = await response.text();

  let parsed: any = null;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = { raw: rawText };
  }

  if (!response.ok) {
    throw new Error(
      parsed?.errorMessage ||
        parsed?.message ||
        parsed?.SMSMessageData?.Message ||
        `Africa's Talking request failed with HTTP ${response.status}`
    );
  }

  return parsed;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json().catch(() => null);

    const title = String(body?.title || '').trim();
    const rawMessage = String(body?.message || '').trim();
    const recipientMode = String(body?.recipient_mode || 'subscribed').trim() || 'subscribed';
    const selectedIds = Array.isArray(body?.selected_ids)
      ? body.selected_ids.map((v: any) => String(v || '').trim()).filter(Boolean)
      : [];

    if (!title) {
      return json({ success: false, error: 'Title required' }, 400);
    }

    if (!rawMessage) {
      return json({ success: false, error: 'Message required' }, 400);
    }

    // Hardcoded for testing as requested
    const atUsername = 'BarakaSonko';
    const atApiKey =
      'atsk_eaf76e68c412d8ec543a71f13a5f483ba014aabad31b9729379e5b6831527c58e147a638';

    const settingsRow = await env.DB.prepare(`
      SELECT
        sender_id,
        batch_size,
        provider
      FROM message_settings
      WHERE id = 'main'
      LIMIT 1
    `).first();

    const senderId = String((settingsRow as any)?.sender_id || '').trim();
    const provider = String((settingsRow as any)?.provider || 'africastalking').trim();
    const batchSizeRaw = Number((settingsRow as any)?.batch_size || 50);

    const batchSize =
      Number.isFinite(batchSizeRaw) && batchSizeRaw > 0
        ? Math.min(Math.floor(batchSizeRaw), 100)
        : 50;

    if (provider && provider !== 'africastalking') {
      return json(
        {
          success: false,
          error: `Current provider is "${provider}". Set provider to "africastalking" in message_settings.`,
        },
        400
      );
    }

    let recipientRows: any[] = [];

    if (recipientMode === 'all') {
      const { results } = await env.DB.prepare(`
        SELECT id, name, phone
        FROM message_contacts
        ORDER BY datetime(created_at) DESC, rowid DESC
      `).all();
      recipientRows = Array.isArray(results) ? results : [];
    } else if (recipientMode === 'subscribed') {
      const { results } = await env.DB.prepare(`
        SELECT id, name, phone
        FROM message_contacts
        WHERE subscribed = 1
        ORDER BY datetime(created_at) DESC, rowid DESC
      `).all();
      recipientRows = Array.isArray(results) ? results : [];
    } else if (recipientMode === 'selected') {
      if (selectedIds.length === 0) {
        return json({ success: false, error: 'No selected recipients' }, 400);
      }

      const placeholders = selectedIds.map(() => '?').join(',');
      const stmt = env.DB.prepare(`
        SELECT id, name, phone
        FROM message_contacts
        WHERE id IN (${placeholders})
      `).bind(...selectedIds);

      const { results } = await stmt.all();
      recipientRows = Array.isArray(results) ? results : [];
    } else {
      return json({ success: false, error: 'Invalid recipient_mode' }, 400);
    }

    const deduped = new Map<string, { id: string; name: string; phone: string }>();

    for (const row of recipientRows) {
      const id = String(row.id || '').trim();
      const name = String(row.name || '').trim();
      const phone = normalizePhone(row.phone);

      if (!id || !phone) continue;

      if (!deduped.has(phone)) {
        deduped.set(phone, { id, name, phone });
      }
    }

    const recipients = Array.from(deduped.values());

    if (recipients.length === 0) {
      return json({ success: false, error: 'No recipients found' }, 400);
    }

    const finalMessage = buildFinalSmsMessage(rawMessage);
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
        finalMessage,
        recipientMode,
        recipients.length,
        'sending',
        'africastalking'
      )
      .run();

    let sent = 0;
    let failed = 0;
    const failures: Array<{ phone: string; error: string }> = [];

    const chunks = chunkArray(recipients, batchSize);

    for (const group of chunks) {
      const phones = group.map((r) => r.phone);

      try {
        const atResponse = await sendViaAfricasTalking({
          username: atUsername,
          apiKey: atApiKey,
          to: phones,
          message: finalMessage,
          // IMPORTANT: do not send custom senderId in sandbox
          from: atUsername === 'sandbox' ? undefined : senderId || undefined,
        });

        const recipientsData = Array.isArray(atResponse?.SMSMessageData?.Recipients)
          ? atResponse.SMSMessageData.Recipients
          : [];

        const responseMap = new Map<string, any>();
        for (const item of recipientsData) {
          const num = normalizePhone(item?.number);
          if (num) responseMap.set(num, item);
        }

        for (const r of group) {
          const providerRow = responseMap.get(r.phone);
          const statusText = String(providerRow?.status || '').toLowerCase();

          const accepted =
            statusText.includes('success') ||
            statusText.includes('sent') ||
            statusText.includes('submitted') ||
            statusText.includes('queued');

          const recipientStatus = accepted ? 'sent' : 'failed';
          const providerResponse = JSON.stringify(providerRow || atResponse || {});

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
            .bind(makeId(), campaignId, r.id, r.phone, recipientStatus)
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
              r.phone,
              finalMessage,
              recipientStatus,
              providerResponse
            )
            .run();

          if (accepted) {
            sent += 1;
          } else {
            failed += 1;
            failures.push({
              phone: r.phone,
              error: providerRow?.status || 'Failed to send',
            });
          }
        }
      } catch (err: any) {
        const errorText = err?.message || 'Batch send failed';
        console.error('AfricaTalking batch error:', errorText);

        for (const r of group) {
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
            .bind(makeId(), campaignId, r.id, r.phone, 'failed')
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
              r.phone,
              finalMessage,
              'failed',
              errorText
            )
            .run();

          failed += 1;
          failures.push({
            phone: r.phone,
            error: errorText,
          });
        }
      }
    }

    const finalStatus =
      sent > 0 && failed === 0
        ? 'completed'
        : sent > 0 && failed > 0
          ? 'completed'
          : 'failed';

    await env.DB.prepare(`
      UPDATE message_campaigns
      SET status = ?
      WHERE id = ?
    `)
      .bind(finalStatus, campaignId)
      .run();

    return json({
      success: true,
      data: {
        campaign_id: campaignId,
        recipients: recipients.length,
        sent,
        failed,
        status: finalStatus,
        provider: 'africastalking',
        sandbox: atUsername === 'sandbox',
        failures: failures.slice(0, 20),
      },
      message:
        atUsername === 'sandbox'
          ? 'Campaign processed in Africa’s Talking sandbox'
          : 'Campaign sent successfully',
    });
  } catch (error: any) {
    console.error('POST /api/messages/send error:', error);
    return json(
      {
        success: false,
        error: error?.message || 'Failed to send campaign',
      },
      500
    );
  }
};
