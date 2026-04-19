// functions/api/message-contacts/import.ts
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

const cleanPhone = (value: any) => {
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

const isValidPhone = (value: string) => /^\+\d{9,15}$/.test(value);

const makeId = () =>
  `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json().catch(() => null);
    const source = String(body?.source || 'import').trim() || 'import';
    const rawContacts = Array.isArray(body?.contacts) ? body.contacts : [];

    if (rawContacts.length === 0) {
      return json(
        {
          success: false,
          error: 'No contacts provided',
        },
        400
      );
    }

    const seen = new Set<string>();
    const validContacts: Array<{ id: string; name: string; phone: string }> = [];
    const invalidContacts: Array<{ name: string; phone: string; reason: string }> = [];
    const duplicateInPayload: string[] = [];
    const duplicateInDb: string[] = [];

    for (const item of rawContacts) {
      const name = String(item?.name || '').trim();
      const phoneRaw = String(item?.phone || '').trim();
      const phone = cleanPhone(phoneRaw);

      if (!phone || !isValidPhone(phone)) {
        invalidContacts.push({
          name,
          phone: phoneRaw,
          reason: 'Invalid phone number',
        });
        continue;
      }

      if (seen.has(phone)) {
        duplicateInPayload.push(phone);
        continue;
      }
      seen.add(phone);

      validContacts.push({
        id: makeId(),
        name,
        phone,
      });
    }

    let inserted = 0;

    for (const contact of validContacts) {
      const existing = await env.DB.prepare(
        `SELECT id FROM message_contacts WHERE phone = ? LIMIT 1`
      )
        .bind(contact.phone)
        .first();

      if (existing) {
        duplicateInDb.push(contact.phone);
        continue;
      }

      await env.DB.prepare(`
        INSERT INTO message_contacts (
          id,
          name,
          phone,
          subscribed,
          source,
          tags,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `)
        .bind(
          contact.id,
          contact.name,
          contact.phone,
          1,
          source,
          JSON.stringify([])
        )
        .run();

      inserted += 1;
    }

    return json({
      success: true,
      data: {
        received: rawContacts.length,
        valid: validContacts.length,
        inserted,
        invalid: invalidContacts.length,
        duplicate_in_payload: duplicateInPayload.length,
        duplicate_in_db: duplicateInDb.length,
        invalid_contacts: invalidContacts,
        skipped_duplicates_in_payload: duplicateInPayload,
        skipped_duplicates_in_db: duplicateInDb,
      },
    });
  } catch (error: any) {
    console.error('POST /api/message-contacts/import error:', error);
    return json(
      {
        success: false,
        error: error?.message || 'Failed to import contacts',
      },
      500
    );
  }
};
