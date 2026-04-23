import { NextRequest, NextResponse } from 'next/server';
import { getPool, sql } from '@/db/database';
import { Deal, ApiDeal, ColumnId } from '@/lib/types';
import { STALE_DAYS } from '@/lib/constants';
import { getSession } from '@/lib/session';

async function requireUser() {
  const session = await getSession();
  if (!session.userId) return null;
  return session.userId;
}

function computeStale(lastContactAt: Date | string) {
  const d = lastContactAt instanceof Date ? lastContactAt : new Date(lastContactAt);
  const daysSinceContact = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  return { isStale: daysSinceContact >= STALE_DAYS, daysSinceContact };
}

export async function GET() {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: '未登入' }, { status: 401 });

  const pool = await getPool();
  const result = await pool.request()
    .input('user_id', sql.Int, userId)
    .query('SELECT * FROM deals WHERE user_id = @user_id ORDER BY column_id, position ASC');

  const deals = result.recordset as Deal[];

  const grouped: Record<ColumnId, ApiDeal[]> = { developing: [], quoting: [], closed: [] };
  for (const deal of deals) {
    const { isStale, daysSinceContact } = computeStale(deal.last_contact_at);
    grouped[deal.column_id].push({ ...deal, isStale, daysSinceContact });
  }
  for (const col of Object.keys(grouped) as ColumnId[]) {
    grouped[col].sort((a, b) => (b.isStale ? 1 : 0) - (a.isStale ? 1 : 0));
  }

  return NextResponse.json(grouped);
}

export async function POST(req: NextRequest) {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: '未登入' }, { status: 401 });

  const { customer, contact_person, amount, column_id, notes } = await req.json();
  if (!customer || !column_id) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
  }

  const pool = await getPool();
  const posResult = await pool.request()
    .input('user_id',   sql.Int,          userId)
    .input('column_id', sql.NVarChar(20), column_id)
    .query('SELECT ISNULL(MAX(position), -1000) AS m FROM deals WHERE user_id = @user_id AND column_id = @column_id');
  const position = (posResult.recordset[0].m as number) + 1000;

  const insertResult = await pool.request()
    .input('user_id',        sql.Int,              userId)
    .input('customer',       sql.NVarChar(300),    customer)
    .input('contact_person', sql.NVarChar(200),    contact_person ?? '')
    .input('amount',         sql.Decimal(18, 2),   amount ?? 0)
    .input('column_id',      sql.NVarChar(20),     column_id)
    .input('position',       sql.Int,              position)
    .input('notes',          sql.NVarChar(sql.MAX), notes ?? '')
    .query(`
      INSERT INTO deals (user_id, customer, contact_person, amount, column_id, position, notes)
      OUTPUT INSERTED.*
      VALUES (@user_id, @customer, @contact_person, @amount, @column_id, @position, @notes)
    `);

  const deal = insertResult.recordset[0] as Deal;
  const { isStale, daysSinceContact } = computeStale(deal.last_contact_at);
  return NextResponse.json({ ...deal, isStale, daysSinceContact }, { status: 201 });
}
