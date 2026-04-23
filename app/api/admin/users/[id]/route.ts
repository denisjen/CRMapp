import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getPool, sql } from '@/db/database';
import { getSession } from '@/lib/session';

async function requireAdmin() {
  const s = await getSession();
  return s.userId && s.role === 'admin' ? s.userId : null;
}

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: '無權限' }, { status: 403 });

  const { id } = await params;
  const userId = parseInt(id, 10);
  const body = await req.json();
  const pool = await getPool();

  const existing = await pool.request()
    .input('id', sql.Int, userId)
    .query('SELECT * FROM users WHERE id = @id');
  if (!existing.recordset[0]) return NextResponse.json({ error: '使用者不存在' }, { status: 404 });

  const cur = existing.recordset[0];

  // Build update
  const req2 = pool.request()
    .input('id',        sql.Int,          userId)
    .input('name',      sql.NVarChar(200), body.name      ?? cur.name)
    .input('email',     sql.NVarChar(320), (body.email ?? cur.email).toLowerCase())
    .input('role',      sql.NVarChar(10),  body.role      ?? cur.role)
    .input('dept_id',   sql.Int,           body.dept_id   ?? cur.dept_id)
    .input('is_active', sql.Bit,           body.is_active ?? cur.is_active);

  // Optional password reset
  if (body.password) {
    const hash = await bcrypt.hash(body.password, 10);
    req2.input('password_hash', sql.NVarChar(200), hash);
    const result = await req2.query(`
      UPDATE users
      SET name=@name, email=@email, role=@role, dept_id=@dept_id, is_active=@is_active, password_hash=@password_hash
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role, INSERTED.is_active, INSERTED.dept_id
      WHERE id=@id
    `);
    return NextResponse.json(result.recordset[0]);
  }

  const result = await req2.query(`
    UPDATE users
    SET name=@name, email=@email, role=@role, dept_id=@dept_id, is_active=@is_active
    OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role, INSERTED.is_active, INSERTED.dept_id
    WHERE id=@id
  `);
  return NextResponse.json(result.recordset[0]);
}
