import { NextRequest, NextResponse } from 'next/server';
import { getPool, sql } from '@/db/database';
import { getSession } from '@/lib/session';

async function requireAdmin() {
  const s = await getSession();
  return s.userId && s.role === 'admin' ? s.userId : null;
}

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!await requireAdmin()) return NextResponse.json({ error: '無權限' }, { status: 403 });
  const { id } = await params;
  const { name, org_id } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: '請輸入名稱' }, { status: 400 });
  const pool = await getPool();
  const result = await pool.request()
    .input('id',     sql.Int,          parseInt(id, 10))
    .input('name',   sql.NVarChar(200), name.trim())
    .input('org_id', sql.Int,          org_id)
    .query('UPDATE departments SET name = @name, org_id = @org_id OUTPUT INSERTED.* WHERE id = @id');
  if (!result.recordset[0]) return NextResponse.json({ error: '找不到部門' }, { status: 404 });
  return NextResponse.json(result.recordset[0]);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!await requireAdmin()) return NextResponse.json({ error: '無權限' }, { status: 403 });
  const { id } = await params;
  const pool = await getPool();
  // Check if dept has users
  const check = await pool.request()
    .input('dept_id', sql.Int, parseInt(id, 10))
    .query('SELECT COUNT(*) AS cnt FROM users WHERE dept_id = @dept_id');
  if (check.recordset[0].cnt > 0) {
    return NextResponse.json({ error: '此部門仍有使用者，無法刪除' }, { status: 409 });
  }
  await pool.request()
    .input('id', sql.Int, parseInt(id, 10))
    .query('DELETE FROM departments WHERE id = @id');
  return NextResponse.json({ success: true });
}
