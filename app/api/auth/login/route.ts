import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getPool, sql } from '@/db/database';
import { getSession } from '@/lib/session';
import { User } from '@/lib/types';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: '請輸入帳號與密碼' }, { status: 400 });
  }

  const pool = await getPool();
  const result = await pool.request()
    .input('email', sql.NVarChar(320), email.trim().toLowerCase())
    .query('SELECT id, name, email, role, password_hash FROM users WHERE email = @email');

  const user = result.recordset[0] as (User & { password_hash: string }) | undefined;
  if (!user || !user.password_hash) {
    return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });
  }

  const session = await getSession();
  session.userId = user.id;
  session.name   = user.name;
  session.email  = user.email;
  session.role   = user.role;
  await session.save();

  return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role });
}
