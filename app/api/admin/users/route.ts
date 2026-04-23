import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
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
    SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
           d.name AS dept_name, o.name AS org_name
    FROM users u
    JOIN departments d ON d.id = u.dept_id
    JOIN organizations o ON o.id = d.org_id
    ORDER BY o.name, d.name, u.name
  `);
  return NextResponse.json(result.recordset);
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: '無權限' }, { status: 403 });
  const { name, email, role, dept_id, password } = await req.json();
  if (!name?.trim() || !email?.trim() || !role || !dept_id || !password) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
  }
  const pool = await getPool();
  // Check email uniqueness
  const dup = await pool.request()
    .input('email', sql.NVarChar(320), email.trim().toLowerCase())
    .query('SELECT id FROM users WHERE email = @email');
  if (dup.recordset[0]) return NextResponse.json({ error: '此 Email 已被使用' }, { status: 409 });

  const hash = await bcrypt.hash(password, 10);
  const result = await pool.request()
    .input('dept_id',       sql.Int,          dept_id)
    .input('name',          sql.NVarChar(200), name.trim())
    .input('email',         sql.NVarChar(320), email.trim().toLowerCase())
    .input('role',          sql.NVarChar(10),  role)
    .input('password_hash', sql.NVarChar(200), hash)
    .query(`
      INSERT INTO users (dept_id, name, email, role, password_hash, is_active)
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role, INSERTED.is_active, INSERTED.created_at, INSERTED.dept_id
      VALUES (@dept_id, @name, @email, @role, @password_hash, 1)
    `);
  return NextResponse.json(result.recordset[0], { status: 201 });
}
