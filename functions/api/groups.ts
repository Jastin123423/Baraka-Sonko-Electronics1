// functions/api/groups.ts
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

// GET /api/groups - Fetch all groups with contact counts
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const { results } = await env.DB.prepare(`
      SELECT 
        g.id,
        g.name,
        g.created_at,
        g.updated_at,
        COUNT(mc.id) as contact_count
      FROM contact_groups g
      LEFT JOIN message_contacts mc ON mc.group_id = g.id
      GROUP BY g.id
      ORDER BY g.name ASC
    `).all();

    const groups = Array.isArray(results)
      ? results.map((row: any) => ({
          id: String(row.id),
          name: row.name || '',
          contactCount: Number(row.contact_count || 0),
          created_at: row.created_at || null,
          updated_at: row.updated_at || null,
        }))
      : [];

    return json({ success: true, groups });
  } catch (error: any) {
    console.error('GET /api/groups error:', error);
    return json(
      { success: false, error: error?.message || 'Failed to load groups' },
      500
    );
  }
};

// POST /api/groups - Create a new group
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json().catch(() => null);
    const name = String(body?.name || '').trim();

    if (!name) {
      return json(
        { success: false, error: 'Group name is required' },
        400
      );
    }

    if (name.length > 100) {
      return json(
        { success: false, error: 'Group name must be 100 characters or less' },
        400
      );
    }

    // Check for duplicate name (case-insensitive)
    const existing = await env.DB.prepare(
      `SELECT id, name FROM contact_groups WHERE LOWER(name) = LOWER(?) LIMIT 1`
    )
      .bind(name)
      .first();

    if (existing) {
      return json(
        { 
          success: false, 
          error: `Group "${name}" already exists`,
          group: {
            id: String((existing as any).id),
            name: (existing as any).name,
          }
        },
        409
      );
    }

    const id = makeId();

    await env.DB.prepare(`
      INSERT INTO contact_groups (id, name, created_at, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `)
      .bind(id, name)
      .run();

    const created = await env.DB.prepare(`
      SELECT id, name, created_at, updated_at
      FROM contact_groups
      WHERE id = ?
      LIMIT 1
    `)
      .bind(id)
      .first();

    return json({
      success: true,
      group: {
        id: String((created as any)?.id || id),
        name: (created as any)?.name || name,
        contactCount: 0,
        created_at: (created as any)?.created_at || null,
        updated_at: (created as any)?.updated_at || null,
      },
      message: 'Group created successfully',
    }, 201);
  } catch (error: any) {
    console.error('POST /api/groups error:', error);
    return json(
      { success: false, error: error?.message || 'Failed to create group' },
      500
    );
  }
};
