// functions/api/messages/settings.ts
import type { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
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

const SETTINGS_ID = 'main';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    let row = await env.DB.prepare(`
      SELECT
        id,
        sender_id,
        default_country_code,
        unsubscribe_text,
        batch_size,
        provider,
        updated_at
      FROM message_settings
      WHERE id = ?
      LIMIT 1
    `)
      .bind(SETTINGS_ID)
      .first();

    if (!row) {
      await env.DB.prepare(`
        INSERT INTO message_settings (
          id,
          sender_id,
          default_country_code,
          unsubscribe_text,
          batch_size,
          provider,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `)
        .bind(
          SETTINGS_ID,
          '',
          '+255',
          '',
          200,
          'africastalking'
        )
        .run();

      row = await env.DB.prepare(`
        SELECT
          id,
          sender_id,
          default_country_code,
          unsubscribe_text,
          batch_size,
          provider,
          updated_at
        FROM message_settings
        WHERE id = ?
        LIMIT 1
      `)
        .bind(SETTINGS_ID)
        .first();
    }

    return json({
      success: true,
      data: {
        id: String((row as any)?.id || SETTINGS_ID),
        sender_id: (row as any)?.sender_id || '',
        default_country_code: (row as any)?.default_country_code || '+255',
        unsubscribe_text: (row as any)?.unsubscribe_text || '',
        batch_size: Number((row as any)?.batch_size || 200),
        provider: (row as any)?.provider || 'africastalking',
        updated_at: (row as any)?.updated_at || null,
      },
    });
  } catch (error: any) {
    console.error('GET /api/messages/settings error:', error);
    return json(
      {
        success: false,
        error: error?.message || 'Failed to load settings',
      },
      500
    );
  }
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json().catch(() => null);

    const senderId = String(body?.sender_id || '').trim();
    const defaultCountryCode = String(body?.default_country_code || '+255').trim() || '+255';
    const unsubscribeText = String(body?.unsubscribe_text || '').trim();
    const batchSize = Number(body?.batch_size || 200);
    const provider = String(body?.provider || 'africastalking').trim() || 'africastalking';

    const safeBatchSize =
      Number.isFinite(batchSize) && batchSize > 0 ? Math.floor(batchSize) : 200;

    const existing = await env.DB.prepare(`
      SELECT id
      FROM message_settings
      WHERE id = ?
      LIMIT 1
    `)
      .bind(SETTINGS_ID)
      .first();

    if (existing) {
      await env.DB.prepare(`
        UPDATE message_settings
        SET
          sender_id = ?,
          default_country_code = ?,
          unsubscribe_text = ?,
          batch_size = ?,
          provider = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
        .bind(
          senderId,
          defaultCountryCode,
          unsubscribeText,
          safeBatchSize,
          provider,
          SETTINGS_ID
        )
        .run();
    } else {
      await env.DB.prepare(`
        INSERT INTO message_settings (
          id,
          sender_id,
          default_country_code,
          unsubscribe_text,
          batch_size,
          provider,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `)
        .bind(
          SETTINGS_ID,
          senderId,
          defaultCountryCode,
          unsubscribeText,
          safeBatchSize,
          provider
        )
        .run();
    }

    const updated = await env.DB.prepare(`
      SELECT
        id,
        sender_id,
        default_country_code,
        unsubscribe_text,
        batch_size,
        provider,
        updated_at
      FROM message_settings
      WHERE id = ?
      LIMIT 1
    `)
      .bind(SETTINGS_ID)
      .first();

    return json({
      success: true,
      data: {
        id: String((updated as any)?.id || SETTINGS_ID),
        sender_id: (updated as any)?.sender_id || '',
        default_country_code: (updated as any)?.default_country_code || '+255',
        unsubscribe_text: (updated as any)?.unsubscribe_text || '',
        batch_size: Number((updated as any)?.batch_size || safeBatchSize),
        provider: (updated as any)?.provider || provider,
        updated_at: (updated as any)?.updated_at || null,
      },
    });
  } catch (error: any) {
    console.error('PUT /api/messages/settings error:', error);
    return json(
      {
        success: false,
        error: error?.message || 'Failed to save settings',
      },
      500
    );
  }
};
