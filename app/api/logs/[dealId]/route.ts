import { NextRequest, NextResponse } from 'next/server';
import { getPool, sql } from '@/db/database';
import { ContactLog } from '@/lib/types';
import { getSession } from '@/lib/session';

type Params = { params: Promise<{ dealId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: '未登入' }, { status: 401 });
  const userId = session.userId;

  const { dealId } = await params;
  const pool = await getPool();

  const dealCheck = await pool.request()
    .input('deal_id', sql.Int, parseInt(dealId, 10))
    .input('user_id', sql.Int, userId)
    .query('SELECT id FROM deals WHERE id = @deal_id AND user_id = @user_id');
  if (!dealCheck.recordset[0]) {
    return NextResponse.json({ error: '案件不存在' }, { status: 404 });
  }

  const result = await pool.request()
    .input('deal_id', sql.Int, parseInt(dealId, 10))
    .query('SELECT * FROM contact_logs WHERE deal_id = @deal_id ORDER BY created_at DESC');
  return NextResponse.json(result.recordset as ContactLog[]);
}
