import { NextResponse } from 'next/server';
import { getPool, sql } from '@/db/database';
import { getSession } from '@/lib/session';
import { managerScopeSnippet } from '@/lib/dept-tree';

export async function GET() {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: '未登入' }, { status: 401 });
  if (session.role !== 'manager' && session.role !== 'admin') {
    return NextResponse.json({ error: '無權限' }, { status: 403 });
  }

  const pool    = await getPool();
  const request = pool.request();

  let ctePrefix = '';
  let scopeWhere = '1=1';
  if (session.role === 'manager') {
    const scope = managerScopeSnippet(session.deptId);
    scope.bind(request);
    ctePrefix  = scope.cte;
    scopeWhere = scope.where;
  }

  const query = `
    ${ctePrefix}
    SELECT u.id, u.name, u.role, d.id AS dept_id, d.name AS dept_name, o.name AS org_name
    FROM users u
    JOIN departments d ON d.id = u.dept_id
    JOIN organizations o ON o.id = d.org_id
    WHERE u.is_active = 1 AND ${scopeWhere}
    ORDER BY u.name
    OPTION (MAXRECURSION 100)
  `;

  const result = await request.query(query);
  return NextResponse.json(result.recordset);
}
