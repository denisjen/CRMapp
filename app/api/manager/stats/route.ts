import { NextRequest, NextResponse } from 'next/server';
import { getPool, sql } from '@/db/database';
import { getSession } from '@/lib/session';
import { STALE_DAYS } from '@/lib/constants';
import { managerScopeSnippet } from '@/lib/dept-tree';

export interface SalesStats {
  user_id:           number;
  user_name:         string;
  dept_id:           number;
  dept_name:         string;
  dept_path:         string;   // e.g. "業務部/北區課"
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

  const pool    = await getPool();
  const request = pool.request().input('stale_days', sql.Int, STALE_DAYS);

  let ctePrefix = '';
  let scopeWhere = '1=1';
  if (session.role === 'manager') {
    const scope = managerScopeSnippet(session.deptId);
    scope.bind(request);
    ctePrefix  = scope.cte;
    scopeWhere = scope.where;
  }

  let dateWhere = '';
  if (dateFrom) {
    dateWhere += ' AND d.created_at >= @date_from';
    request.input('date_from', sql.DateTime2, new Date(dateFrom + 'T00:00:00Z'));
  }
  if (dateTo) {
    dateWhere += ' AND d.created_at <= @date_to';
    request.input('date_to', sql.DateTime2, new Date(dateTo + 'T23:59:59Z'));
  }

  // Also build a dept-path CTE (separate from scope CTE to avoid conflict)
  const deptPathJoin = ctePrefix ? ', DeptPath AS (' : 'WITH DeptPath AS (';
  const query = `
    ${ctePrefix}
    ${deptPathJoin}
      SELECT id, name, parent_id, CAST(name AS NVARCHAR(MAX)) AS path
      FROM departments WHERE parent_id IS NULL
      UNION ALL
      SELECT d.id, d.name, d.parent_id, dp.path + N'/' + d.name
      FROM departments d JOIN DeptPath dp ON d.parent_id = dp.id
    )
    SELECT
      u.id   AS user_id,
      u.name AS user_name,
      dept.id   AS dept_id,
      dept.name AS dept_name,
      ISNULL(dp.path, dept.name) AS dept_path,
      SUM(CASE WHEN d.column_id='developing' THEN 1     ELSE 0 END) AS developing_count,
      SUM(CASE WHEN d.column_id='developing' THEN d.amount ELSE 0 END) AS developing_amount,
      SUM(CASE WHEN d.column_id='quoting'    THEN 1     ELSE 0 END) AS quoting_count,
      SUM(CASE WHEN d.column_id='quoting'    THEN d.amount ELSE 0 END) AS quoting_amount,
      SUM(CASE WHEN d.column_id='closed'     THEN 1     ELSE 0 END) AS closed_count,
      SUM(CASE WHEN d.column_id='closed'     THEN d.amount ELSE 0 END) AS closed_amount,
      SUM(CASE WHEN DATEDIFF(day,d.last_contact_at,SYSUTCDATETIME())>=@stale_days THEN 1 ELSE 0 END) AS stale_count,
      SUM(d.amount) AS total_amount
    FROM deals d
    JOIN users u    ON u.id    = d.user_id
    JOIN departments dept ON dept.id = u.dept_id
    LEFT JOIN DeptPath dp ON dp.id = dept.id
    WHERE ${scopeWhere} ${dateWhere}
    GROUP BY u.id, u.name, dept.id, dept.name, dp.path
    ORDER BY dept_path, closed_amount DESC, u.name
    OPTION (MAXRECURSION 100)
  `;

  const result = await request.query(query);
  return NextResponse.json(result.recordset as SalesStats[]);
}
