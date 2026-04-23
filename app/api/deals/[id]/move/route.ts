import { NextRequest, NextResponse } from 'next/server';
import { getPool, sql } from '@/db/database';
import { ColumnId } from '@/lib/types';
import { getSession } from '@/lib/session';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: '未登入' }, { status: 401 });
  const userId = session.userId;

  const { id } = await params;
  const { column_id, position } = await req.json() as { column_id: ColumnId; position: number };
  if (!column_id || position === undefined) {
    return NextResponse.json({ error: '缺少欄位' }, { status: 400 });
  }

  const pool = await getPool();
  const existing = await pool.request()
    .input('id',      sql.Int, parseInt(id, 10))
    .input('user_id', sql.Int, userId)
    .query('SELECT id FROM deals WHERE id = @id AND user_id = @user_id');
  if (!existing.recordset[0]) return NextResponse.json({ error: '案件不存在' }, { status: 404 });

  await pool.request()
    .input('id',        sql.Int,          parseInt(id, 10))
    .input('user_id',   sql.Int,          userId)
    .input('column_id', sql.NVarChar(20), column_id)
    .input('position',  sql.Int,          position)
    .query('UPDATE deals SET column_id = @column_id, position = @position WHERE id = @id AND user_id = @user_id');
  return NextResponse.json({ success: true });
}
