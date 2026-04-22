import { NextRequest, NextResponse } from 'next/server';
import { getPool, sql } from '@/db/database';
import { ContactLog } from '@/lib/types';

// TODO: replace with session.userId once auth is implemented
const CURRENT_USER_ID = 1;

export async function POST(req: NextRequest) {
  const { deal_id, content } = await req.json();
  if (!deal_id || !content?.trim()) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
  }

  const pool = await getPool();
  const dealCheck = await pool.request()
    .input('deal_id', sql.Int, deal_id)
    .input('user_id', sql.Int, CURRENT_USER_ID)
    .query('SELECT id FROM deals WHERE id = @deal_id AND user_id = @user_id');
  if (!dealCheck.recordset[0]) {
    return NextResponse.json({ error: '案件不存在' }, { status: 404 });
  }

  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    const logResult = await new sql.Request(tx)
      .input('deal_id', sql.Int,              deal_id)
      .input('user_id', sql.Int,              CURRENT_USER_ID)
      .input('content', sql.NVarChar(sql.MAX), content.trim())
      .query('INSERT INTO contact_logs (deal_id, user_id, content) OUTPUT INSERTED.* VALUES (@deal_id, @user_id, @content)');

    await new sql.Request(tx)
      .input('deal_id', sql.Int,              deal_id)
      .input('notes',   sql.NVarChar(sql.MAX), content.trim())
      .query('UPDATE deals SET last_contact_at = SYSUTCDATETIME(), notes = @notes WHERE id = @deal_id');

    await tx.commit();
    return NextResponse.json(logResult.recordset[0] as ContactLog, { status: 201 });
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}
