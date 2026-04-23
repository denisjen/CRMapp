import { NextRequest, NextResponse } from 'next/server';
import { getPool, sql } from '@/db/database';
import { getSession } from '@/lib/session';
import { STALE_DAYS } from '@/lib/constants';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: '未登入' }, { status: 401 });
  if (session.role !== 'manager' && session.role !== 'admin') {
    return NextResponse.json({ error: '無權限' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const filterUserId = searchParams.get('user_id');
  const dateFrom     = searchParams.get('dateFrom');
  const dateTo       = searchParams.get('dateTo');

  const pool = await getPool();

  // Build query — manager sees own dept; admin sees all
  let query = `
    SELECT
      d.*,
      u.name  AS user_name,
      u.email AS user_email,
      DATEDIFF(day, d.last_contact_at, SYSUTCDATETIME()) AS days_since_contact
    FROM deals d
    JOIN users u ON u.id = d.user_id
    JOIN departments dept ON dept.id = u.dept_id
    WHERE 1=1
  `;

  const request = pool.request();

  if (session.role === 'manager') {
    query += ' AND dept.id = @dept_id';
    request.input('dept_id', sql.Int, session.deptId);
  }
  if (filterUserId) {
    query += ' AND d.user_id = @filter_user_id';
    request.input('filter_user_id', sql.Int, parseInt(filterUserId, 10));
  }
  if (dateFrom) {
    query += ' AND d.created_at >= @date_from';
    request.input('date_from', sql.DateTime2, new Date(dateFrom + 'T00:00:00Z'));
  }
  if (dateTo) {
    query += ' AND d.created_at <= @date_to';
    request.input('date_to', sql.DateTime2, new Date(dateTo + 'T23:59:59Z'));
  }

  query += ' ORDER BY d.column_id, d.position ASC';

  const result = await request.query(query);

  const deals = result.recordset.map((row: Record<string, unknown>) => ({
    ...row,
    isStale: (row.days_since_contact as number) >= STALE_DAYS,
    daysSinceContact: row.days_since_contact as number,
  }));

  return NextResponse.json(deals);
}
