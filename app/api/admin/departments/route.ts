import { NextRequest, NextResponse } from 'next/server';
import { getPool, sql } from '@/db/database';
import { getSession } from '@/lib/session';
import { getDeptTree } from '@/lib/dept-tree';

async function requireAdmin() {
  const s = await getSession();
  return s.userId && s.role === 'admin' ? s.userId : null;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: '無權限' }, { status: 403 });
  const pool = await getPool();
  return NextResponse.json(await getDeptTree(pool));
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: '無權限' }, { status: 403 });
  const { name, level_name, parent_id, org_id } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: '請輸入名稱' }, { status: 400 });

  const pool = await getPool();

  // Resolve org_id: inherit from parent if not supplied
  let resolvedOrgId = org_id ?? null;
  if (!resolvedOrgId && parent_id) {
    const parent = await pool.request()
      .input('pid', sql.Int, parent_id)
      .query('SELECT org_id FROM departments WHERE id = @pid');
    resolvedOrgId = parent.recordset[0]?.org_id ?? null;
  }
  if (!resolvedOrgId) return NextResponse.json({ error: '無法確定所屬組織' }, { status: 400 });

  const result = await pool.request()
    .input('name',       sql.NVarChar(200), name.trim())
    .input('level_name', sql.NVarChar(20),  level_name?.trim() || '部門')
    .input('parent_id',  sql.Int,           parent_id ?? null)
    .input('org_id',     sql.Int,           resolvedOrgId)
    .query(`
      INSERT INTO departments (name, level_name, parent_id, org_id)
      OUTPUT INSERTED.*
      VALUES (@name, @level_name, @parent_id, @org_id)
    `);
  return NextResponse.json(result.recordset[0], { status: 201 });
}
