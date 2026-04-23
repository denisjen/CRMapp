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
  const { name, level_name, parent_id, org_id } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: '請輸入名稱' }, { status: 400 });

  const deptId = parseInt(id, 10);

  // Prevent setting parent to self or own descendant (basic cycle guard)
  if (parent_id === deptId) {
    return NextResponse.json({ error: '不可將自己設為上層單位' }, { status: 400 });
  }

  const pool = await getPool();
  const result = await pool.request()
    .input('id',         sql.Int,          deptId)
    .input('name',       sql.NVarChar(200), name.trim())
    .input('level_name', sql.NVarChar(20),  level_name?.trim() || '部門')
    .input('parent_id',  sql.Int,           parent_id ?? null)
    .input('org_id',     sql.Int,           org_id)
    .query(`
      UPDATE departments
      SET name=@name, level_name=@level_name, parent_id=@parent_id, org_id=@org_id
      OUTPUT INSERTED.*
      WHERE id=@id
    `);
  if (!result.recordset[0]) return NextResponse.json({ error: '找不到部門' }, { status: 404 });
  return NextResponse.json(result.recordset[0]);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!await requireAdmin()) return NextResponse.json({ error: '無權限' }, { status: 403 });
  const { id } = await params;
  const pool = await getPool();

  // Block if has users
  const usersCheck = await pool.request()
    .input('dept_id', sql.Int, parseInt(id, 10))
    .query('SELECT COUNT(*) AS cnt FROM users WHERE dept_id = @dept_id');
  if (usersCheck.recordset[0].cnt > 0) {
    return NextResponse.json({ error: '此單位仍有使用者，無法刪除' }, { status: 409 });
  }

  // Block if has children
  const childCheck = await pool.request()
    .input('parent_id', sql.Int, parseInt(id, 10))
    .query('SELECT COUNT(*) AS cnt FROM departments WHERE parent_id = @parent_id');
  if (childCheck.recordset[0].cnt > 0) {
    return NextResponse.json({ error: '此單位仍有下層單位，請先刪除子單位' }, { status: 409 });
  }

  await pool.request()
    .input('id', sql.Int, parseInt(id, 10))
    .query('DELETE FROM departments WHERE id = @id');
  return NextResponse.json({ success: true });
}
