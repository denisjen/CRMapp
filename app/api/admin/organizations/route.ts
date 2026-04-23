import { NextRequest, NextResponse } from 'next/server';
import { getPool, sql } from '@/db/database';
import { getSession } from '@/lib/session';

async function requireAdmin() {
  const s = await getSession();
  if (!s.userId || s.role !== 'admin') return null;
  return s.userId;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: '無權限' }, { status: 403 });
  const pool = await getPool();
  const result = await pool.request().query('SELECT * FROM organizations ORDER BY created_at ASC');
  return NextResponse.json(result.recordset);
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: '無權限' }, { status: 403 });
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: '請輸入名稱' }, { status: 400 });
  const pool = await getPool();
  const result = await pool.request()
    .input('name', sql.NVarChar(200), name.trim())
    .query('INSERT INTO organizations (name) OUTPUT INSERTED.* VALUES (@name)');
  return NextResponse.json(result.recordset[0], { status: 201 });
}
