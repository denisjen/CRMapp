import { NextRequest, NextResponse } from 'next/server';
import { getPool, sql } from '@/db/database';
import { getSession } from '@/lib/session';

async function requireAdmin() {
  const s = await getSession();
  return s.userId && s.role === 'admin' ? s.userId : null;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: '無權限' }, { status: 403 });
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT d.*, o.name AS org_name
    FROM departments d
    JOIN organizations o ON o.id = d.org_id
    ORDER BY o.name, d.name
  `);
  return NextResponse.json(result.recordset);
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: '無權限' }, { status: 403 });
  const { org_id, name } = await req.json();
  if (!org_id || !name?.trim()) return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
  const pool = await getPool();
  const result = await pool.request()
    .input('org_id', sql.Int,          org_id)
    .input('name',   sql.NVarChar(200), name.trim())
    .query('INSERT INTO departments (org_id, name) OUTPUT INSERTED.* VALUES (@org_id, @name)');
  return NextResponse.json(result.recordset[0], { status: 201 });
}
