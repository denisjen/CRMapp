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
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: '請輸入名稱' }, { status: 400 });
  const pool = await getPool();
  const result = await pool.request()
    .input('id',   sql.Int,          parseInt(id, 10))
    .input('name', sql.NVarChar(200), name.trim())
    .query('UPDATE organizations SET name = @name OUTPUT INSERTED.* WHERE id = @id');
  if (!result.recordset[0]) return NextResponse.json({ error: '找不到組織' }, { status: 404 });
  return NextResponse.json(result.recordset[0]);
}
