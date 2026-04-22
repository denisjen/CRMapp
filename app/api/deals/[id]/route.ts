import { NextRequest, NextResponse } from 'next/server';
import { getPool, sql } from '@/db/database';
import { Deal, ApiDeal } from '@/lib/types';
import { STALE_DAYS } from '@/lib/constants';

// TODO: replace with session.userId once auth is implemented
const CURRENT_USER_ID = 1;

function computeStale(lastContactAt: Date | string) {
  const d = lastContactAt instanceof Date ? lastContactAt : new Date(lastContactAt);
  const daysSinceContact = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  return { isStale: daysSinceContact >= STALE_DAYS, daysSinceContact };
}

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const pool = await getPool();

  const existingResult = await pool.request()
    .input('id',      sql.Int, parseInt(id, 10))
    .input('user_id', sql.Int, CURRENT_USER_ID)
    .query('SELECT * FROM deals WHERE id = @id AND user_id = @user_id');
  const existing = existingResult.recordset[0] as Deal | undefined;
  if (!existing) return NextResponse.json({ error: '案件不存在' }, { status: 404 });

  const updateResult = await pool.request()
    .input('id',             sql.Int,               parseInt(id, 10))
    .input('user_id',        sql.Int,               CURRENT_USER_ID)
    .input('customer',       sql.NVarChar(300),     body.customer        ?? existing.customer)
    .input('contact_person', sql.NVarChar(200),     body.contact_person  ?? existing.contact_person)
    .input('amount',         sql.Decimal(18, 2),    body.amount          ?? existing.amount)
    .input('notes',          sql.NVarChar(sql.MAX), body.notes           ?? existing.notes)
    .query(`
      UPDATE deals SET customer = @customer, contact_person = @contact_person, amount = @amount, notes = @notes
      OUTPUT INSERTED.*
      WHERE id = @id AND user_id = @user_id
    `);

  const updated = updateResult.recordset[0] as Deal;
  const { isStale, daysSinceContact } = computeStale(updated.last_contact_at);
  return NextResponse.json({ ...updated, isStale, daysSinceContact } as ApiDeal);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const pool = await getPool();

  const existing = await pool.request()
    .input('id',      sql.Int, parseInt(id, 10))
    .input('user_id', sql.Int, CURRENT_USER_ID)
    .query('SELECT id FROM deals WHERE id = @id AND user_id = @user_id');
  if (!existing.recordset[0]) return NextResponse.json({ error: '案件不存在' }, { status: 404 });

  await pool.request()
    .input('id',      sql.Int, parseInt(id, 10))
    .input('user_id', sql.Int, CURRENT_USER_ID)
    .query('DELETE FROM deals WHERE id = @id AND user_id = @user_id');
  return NextResponse.json({ success: true });
}
