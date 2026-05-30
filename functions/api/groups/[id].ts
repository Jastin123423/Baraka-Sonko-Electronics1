// functions/api/groups/[id].ts
import type { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,DELETE,OPTIONS',
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

// GET /api/groups/:id - Get single group with contacts
export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  try {
    const groupId = String((params as any)?.id || '').trim();

    if (!groupId) {
      return json({ success: false, error: 'Group ID required' }, 400);
    }

    const group = await env.DB.prepare(`
      SELECT 
        g.id,
        g.name,
        g.created_at,
        g.updated_at,
        COUNT(mc.id) as contact_count
      FROM contact_groups g
      LEFT JOIN message_contacts mc ON mc.group_id = g.id
      WHERE g.id = ?
      GROUP BY g.id
      LIMIT 1
    `)
      .bind(groupId)
      .first();

    if (!group) {
      return json({ success: false, error: 'Group not found' }, 404);
    }

    const { results: contacts } = await env.DB.prepare(`
      SELECT id, name, phone, subscribed, source, tags, created_at
      FROM message_contacts
      WHERE group_id = ?
      ORDER BY datetime(created_at) DESC, rowid DESC
    `)
      .bind(groupId)
      .all();

    return json({
      success: true,
      group: {
        id: String((group as any).id),
        name: (group as any).name || '',
        contactCount: Number((group as any).contact_count || 0),
        created_at: (group as any).created_at || null,
        updated_at: (group as any).updated_at || null,
      },
      contacts: Array.isArray(contacts)
        ? contacts.map((row: any) => ({
            id: String(row.id),
            name: row.name || '',
            phone: row.phone || '',
            subscribed: Number(row.subscribed || 0) === 1,
            source: row.source || 'manual',
            tags: (() => {
              try {
                return row.tags ? JSON.parse(row.tags) : [];
              } catch {
                return [];
              }
            })(),
            created_at: row.created_at || null,
          }))
        : [],
    });
  } catch (error: any) {
    console.error('GET /api/groups/[id] error:', error);
    return json(
      { success: false, error: error?.message || 'Failed to load group' },
      500
    );
  }
};

// PUT /api/groups/:id - Update group name
export const onRequestPut: PagesFunction<Env> = async ({ request, params, env }) => {
  try {
    const groupId = String((params as any)?.id || '').trim();

    if (!groupId) {
      return json({ success: false, error: 'Group ID required' }, 400);
    }

    const body = await request.json().catch(() => null);
    const name = String(body?.name || '').trim();

    if (!name) {
      return json({ success: false, error: 'Group name is required' }, 400);
    }

    if (name.length > 100) {
      return json(
        { success: false, error: 'Group name must be 100 characters or less' },
        400
      );
    }

    // Check if group exists
    const existing = await env.DB.prepare(
      `SELECT id FROM contact_groups WHERE id = ? LIMIT 1`
    )
      .bind(groupId)
      .first();

    if (!existing) {
      return json({ success: false, error: 'Group not found' }, 404);
    }

    // Check for name conflicts (excluding current group)
    const nameConflict = await env.DB.prepare(
      `SELECT id FROM contact_groups WHERE LOWER(name) = LOWER(?) AND id != ? LIMIT 1`
    )
      .bind(name, groupId)
      .first();

    if (nameConflict) {
      return json(
        { success: false, error: `Group "${name}" already exists` },
        409
      );
    }

    await env.DB.prepare(`
      UPDATE contact_groups 
      SET name = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
      .bind(name, groupId)
      .run();

    return json({
      success: true,
      message: 'Group updated successfully',
    });
  } catch (error: any) {
    console.error('PUT /api/groups/[id] error:', error);
    return json(
      { success: false, error: error?.message || 'Failed to update group' },
      500
    );
  }
};

// DELETE /api/groups/:id - Delete group (contacts keep their group_id set to NULL)
export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
  try {
    const groupId = String((params as any)?.id || '').trim();

    if (!groupId) {
      return json({ success: false, error: 'Group ID required' }, 400);
    }

    // Check if group exists
    const existing = await env.DB.prepare(
      `SELECT id FROM contact_groups WHERE id = ? LIMIT 1`
    )
      .bind(groupId)
      .first();

    if (!existing) {
      return json({ success: false, error: 'Group not found' }, 404);
    }

    // Set contacts' group_id to NULL before deleting
    await env.DB.prepare(`
      UPDATE message_contacts SET group_id = NULL WHERE group_id = ?
    `)
      .bind(groupId)
      .run();

    // Delete the group
    await env.DB.prepare(`
      DELETE FROM contact_groups WHERE id = ?
    `)
      .bind(groupId)
      .run();

    return json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error: any) {
    console.error('DELETE /api/groups/[id] error:', error);
    return json(
      { success: false, error: error?.message || 'Failed to delete group' },
      500
    );
  }
};
