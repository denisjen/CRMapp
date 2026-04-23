import { NextResponse } from 'next/server';
import { getPool, sql } from '@/db/database';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: '未登入' }, { status: 401 });
  if (session.role !== 'manager' && session.role !== 'admin') {
    return NextResponse.json({ error: '無權限' }, { status: 403 });
  }

  const pool = await getPool();
  const request = pool.request();

  let query = `
    SELECT u.id, u.name, u.role, d.name AS dept_name, o.name AS org_name
    FROM users u
    JOIN departments d ON d.id = u.dept_id
    JOIN organizations o ON o.id = d.org_id
    WHERE u.is_active = 1
  `;

  if (session.role === 'manager') {
    query += ' AND u.dept_id = @dept_id';
    request.input('dept_id', sql.Int, session.deptId);
  }

  query += ' ORDER BY u.name';
  const result = await request.query(query);
  return NextResponse.json(result.recordset);
}
