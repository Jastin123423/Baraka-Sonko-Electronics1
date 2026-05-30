// functions/api/message-contacts.ts
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

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const { results } = await env.DB.prepare(`
      SELECT
        mc.id,
        mc.name,
        mc.phone,
        mc.subscribed,
        mc.source,
        mc.tags,
        mc.group_id,
        cg.name as group_name,
        mc.created_at
      FROM message_contacts mc
      LEFT JOIN contact_groups cg ON mc.group_id = cg.id
      ORDER BY datetime(mc.created_at) DESC, mc.rowid DESC
    `).all();

    const data = Array.isArray(results)
      ? results.map((row: any) => ({
          id: String(row.id),
          name: row.name || '',
          phone: row.phone || '',
          subscribed: Number(row.subscribed || 0) === 1,
          source: row.source || 'manual',
          group_id: row.group_id || null,
          group_name: row.group_name || null,
          tags: (() => {
            try {
              return row.tags ? JSON.parse(row.tags) : [];
            } catch {
              return [];
            }
          })(),
          created_at: row.created_at || null,
        }))
      : [];

    return json({ success: true, data });
  } catch (error: any) {
    console.error('GET /api/message-contacts error:', error);
    return json(
      {
        success: false,
        error: error?.message || 'Failed to load contacts',
      },
      500
    );
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json().catch(() => null);

    const id = makeId();
    const name = String(body?.name || '').trim();
    const source = String(body?.source || 'manual').trim() || 'manual';
    const cleanedPhone = cleanPhone(body?.phone);
    const groupId = String(body?.group_id || '').trim() || null;

    if (!cleanedPhone || !isValidPhone(cleanedPhone)) {
      return json(
        {
          success: false,
          error: 'Invalid phone number. Use format like +255712345678',
        },
        400
      );
    }

    // Validate group if provided
    if (groupId) {
      const groupExists = await env.DB.prepare(
        `SELECT id FROM contact_groups WHERE id = ? LIMIT 1`
      )
        .bind(groupId)
        .first();

      if (!groupExists) {
        return json(
          { success: false, error: 'Selected group does not exist' },
          400
        );
      }
    }

    const existing = await env.DB.prepare(
      `SELECT id, group_id FROM message_contacts WHERE phone = ? LIMIT 1`
    )
      .bind(cleanedPhone)
      .first();

    if (existing) {
      // Update group_id if contact exists and groupId is provided
      if (groupId) {
        await env.DB.prepare(`
          UPDATE message_contacts 
          SET group_id = ?, name = COALESCE(NULLIF(?, ''), name)
          WHERE phone = ?
        `)
          .bind(groupId, name, cleanedPhone)
          .run();

        // Update group contact count
        await env.DB.prepare(`
          UPDATE contact_groups 
          SET contact_count = (
            SELECT COUNT(*) FROM message_contacts WHERE group_id = ?
          ),
          updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)
          .bind(groupId, groupId)
          .run();
      }

      return json({
        success: true,
        data: {
          id: String((existing as any).id),
          name,
          phone: cleanedPhone,
          subscribed: true,
          source,
          group_id: groupId || (existing as any).group_id || null,
        },
        message: 'Contact already exists',
      });
    }

    await env.DB.prepare(`
      INSERT INTO message_contacts (
        id,
        name,
        phone,
        subscribed,
        source,
        tags,
        group_id,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
      .bind(id, name, cleanedPhone, 1, source, JSON.stringify([]), groupId)
      .run();

    // Update group contact count
    if (groupId) {
      await env.DB.prepare(`
        UPDATE contact_groups 
        SET contact_count = (
          SELECT COUNT(*) FROM message_contacts WHERE group_id = ?
        ),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
        .bind(groupId, groupId)
        .run();
    }

    const created = await env.DB.prepare(`
      SELECT
        mc.id,
        mc.name,
        mc.phone,
        mc.subscribed,
        mc.source,
        mc.tags,
        mc.group_id,
        cg.name as group_name,
        mc.created_at
      FROM message_contacts mc
      LEFT JOIN contact_groups cg ON mc.group_id = cg.id
      WHERE mc.id = ?
      LIMIT 1
    `)
      .bind(id)
      .first();

    return json({
      success: true,
      data: {
        id: String((created as any)?.id || id),
        name: (created as any)?.name || name,
        phone: (created as any)?.phone || cleanedPhone,
        subscribed: Number((created as any)?.subscribed || 0) === 1,
        source: (created as any)?.source || source,
        group_id: (created as any)?.group_id || null,
        group_name: (created as any)?.group_name || null,
        tags: (() => {
          try {
            return (created as any)?.tags ? JSON.parse((created as any).tags) : [];
          } catch {
            return [];
          }
        })(),
        created_at: (created as any)?.created_at || null,
      },
    });
  } catch (error: any) {
    console.error('POST /api/message-contacts error:', error);
    return json(
      {
        success: false,
        error: error?.message || 'Failed to create contact',
      },
      500
    );
  }
};
