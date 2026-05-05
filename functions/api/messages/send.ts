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

  // Beem examples use numbers like 2557XXXXXXXX without +
  if (v.startsWith('+')) v = v.slice(1);

  return v;
};

const chunkArray = <T,>(items: T[], size: number) => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
};

const toBase64 = (value: string) => btoa(value);

async function sendViaBeem(params: {
  apiKey: string;
  secretKey: string;
  message: string;
  recipients: Array<{ recipient_id: number; dest_addr: string }>;
  source_addr?: string;
}) {
  const payload: any = {
    schedule_time: '',
    encoding: 0,
    message: params.message,
    recipients: params.recipients,
  };

  // sender name optional
  if (params.source_addr && String(params.source_addr).trim()) {
    payload.source_addr = String(params.source_addr).trim();
  }

  const auth = toBase64(`${params.apiKey}:${params.secretKey}`);

  const response = await fetch('https://apisms.beem.africa/v1/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(payload),
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
      parsed?.message ||
        parsed?.error ||
        parsed?.description ||
        `Beem request failed with HTTP ${response.status}: ${rawText}`
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

    // hardcoded for testing as requested
    const beemApiKey = '4594d67f9df36874';
    const beemSecretKey =
      'YzRmMjU0OTlhZmFlNTdkODI2ZDAyNWY1YmJkMWYyMWNmZDQ0MDllZGI5MTg2YzE1ZTg5YmE4YTI4NmI1ZTY2Mw==';

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
    const provider = String((settingsRow as any)?.provider || 'beem').trim();
    const batchSizeRaw = Number((settingsRow as any)?.batch_size || 50);

    const batchSize =
      Number.isFinite(batchSizeRaw) && batchSizeRaw > 0
        ? Math.min(Math.floor(batchSizeRaw), 200)
        : 50;

    if (provider && provider !== 'beem') {
      return json(
        {
          success: false,
          error: `Current provider is "${provider}". Set provider to "beem" in message_settings.`,
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
        'beem'
      )
      .run();

    let sent = 0;
    let failed = 0;
    const failures: Array<{ phone: string; error: string }> = [];

    const chunks = chunkArray(recipients, batchSize);

    for (const group of chunks) {
      const beemRecipients = group.map((r, index) => ({
        recipient_id: index + 1,
        dest_addr: r.phone,
      }));

      try {
        const beemResponse = await sendViaBeem({
          apiKey: beemApiKey,
          secretKey: beemSecretKey,
          message: finalMessage,
          recipients: beemRecipients,
          // keep optional until sender name is approved
          source_addr:'BarakaSonko',
        });
        
        // Beem may return different response shapes depending on account/version.
        // For now, if request succeeds, we mark this batch as sent.
        const providerResponse = JSON.stringify(beemResponse || {});

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
            .bind(makeId(), campaignId, r.id, r.phone, 'sent')
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
              'sent',
              providerResponse
            )
            .run();

          sent += 1;
        }
      } catch (err: any) {
        const errorText = err?.message || 'Beem batch send failed';
        console.error('Beem batch error:', errorText);

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
        provider: 'beem',
        failures: failures.slice(0, 20),
      },
      message: 'Campaign processed with Beem',
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
