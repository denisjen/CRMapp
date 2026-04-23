import { NextRequest, NextResponse } from 'next/server';
import { getPool, sql } from '@/db/database';
import { getSession } from '@/lib/session';
import { STALE_DAYS } from '@/lib/constants';

export interface SalesStats {
  user_id:   number;
  user_name: string;
  developing_count:  number;
  developing_amount: number;
  quoting_count:     number;
  quoting_amount:    number;
  closed_count:      number;
  closed_amount:     number;
  stale_count:       number;
  total_amount:      number;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: '未登入' }, { status: 401 });
  if (session.role !== 'manager' && session.role !== 'admin') {
    return NextResponse.json({ error: '無權限' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get('dateFrom');
  const dateTo   = searchParams.get('dateTo');

  const pool = await getPool();
  const request = pool.request()
    .input('stale_days', sql.Int, STALE_DAYS);

  let where = 'WHERE 1=1';
  if (session.role === 'manager') {
    where += ' AND dept.id = @dept_id';
    request.input('dept_id', sql.Int, session.deptId);
  }
  if (dateFrom) {
    where += ' AND d.created_at >= @date_from';
    request.input('date_from', sql.DateTime2, new Date(dateFrom + 'T00:00:00Z'));
  }
  if (dateTo) {
    where += ' AND d.created_at <= @date_to';
    request.input('date_to', sql.DateTime2, new Date(dateTo + 'T23:59:59Z'));
  }

  const query = `
    SELECT
      u.id   AS user_id,
      u.name AS user_name,
      SUM(CASE WHEN d.column_id = 'developing' THEN 1 ELSE 0 END) AS developing_count,
      SUM(CASE WHEN d.column_id = 'developing' THEN d.amount ELSE 0 END) AS developing_amount,
      SUM(CASE WHEN d.column_id = 'quoting'    THEN 1 ELSE 0 END) AS quoting_count,
      SUM(CASE WHEN d.column_id = 'quoting'    THEN d.amount ELSE 0 END) AS quoting_amount,
      SUM(CASE WHEN d.column_id = 'closed'     THEN 1 ELSE 0 END) AS closed_count,
      SUM(CASE WHEN d.column_id = 'closed'     THEN d.amount ELSE 0 END) AS closed_amount,
      SUM(CASE WHEN DATEDIFF(day, d.last_contact_at, SYSUTCDATETIME()) >= @stale_days THEN 1 ELSE 0 END) AS stale_count,
      SUM(d.amount) AS total_amount
    FROM deals d
    JOIN users u    ON u.id    = d.user_id
    JOIN departments dept ON dept.id = u.dept_id
    ${where}
    GROUP BY u.id, u.name
    ORDER BY closed_amount DESC, u.name
  `;

  const result = await request.query(query);
  return NextResponse.json(result.recordset as SalesStats[]);
}
