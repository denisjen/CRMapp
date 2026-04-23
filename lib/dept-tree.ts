import type { ConnectionPool } from 'mssql';
import { sql } from '@/db/database';
import type { DeptNode } from './types';

/**
 * Returns all dept IDs in the subtree rooted at rootDeptId (inclusive).
 * Uses SQL Server recursive CTE — safe up to 100 levels deep.
 */
export async function getDeptSubtreeIds(
  pool: ConnectionPool,
  rootDeptId: number,
): Promise<number[]> {
  const result = await pool.request()
    .input('root_id', sql.Int, rootDeptId)
    .query(`
      WITH DeptScope AS (
        SELECT id FROM departments WHERE id = @root_id
        UNION ALL
        SELECT d.id FROM departments d
        JOIN DeptScope ds ON d.parent_id = ds.id
      )
      SELECT id FROM DeptScope OPTION (MAXRECURSION 100)
    `);
  return result.recordset.map((r: { id: number }) => r.id);
}

/**
 * Returns all departments in tree order, enriched with org_name + depth.
 * sort_path drives ORDER BY so rows come out in natural tree order.
 */
export async function getDeptTree(pool: ConnectionPool): Promise<DeptNode[]> {
  const result = await pool.request().query(`
    WITH DeptTree AS (
      SELECT
        d.id, d.org_id, d.parent_id, d.level_name, d.name, d.created_at,
        0 AS depth,
        CAST(d.name AS NVARCHAR(MAX)) AS sort_path
      FROM departments d
      WHERE d.parent_id IS NULL
      UNION ALL
      SELECT
        d.id, d.org_id, d.parent_id, d.level_name, d.name, d.created_at,
        dt.depth + 1,
        dt.sort_path + N'/' + d.name
      FROM departments d
      JOIN DeptTree dt ON d.parent_id = dt.id
    )
    SELECT dt.*, o.name AS org_name
    FROM DeptTree dt
    JOIN organizations o ON o.id = dt.org_id
    ORDER BY o.name, dt.sort_path
    OPTION (MAXRECURSION 100)
  `);
  return result.recordset as DeptNode[];
}

/**
 * Build WHERE clause snippet + bind parameters for manager scope.
 * Inlines the recursive CTE so the caller can embed it in a larger query.
 *
 * Usage:
 *   const { cte, where, bind } = managerScope(session.deptId);
 *   bind(request);
 *   const q = `${cte} SELECT ... FROM deals d JOIN users u ... ${where} ...`;
 */
export function managerScopeSnippet(rootDeptId: number) {
  const cte = `
    WITH DeptScope AS (
      SELECT id FROM departments WHERE id = @ms_root_id
      UNION ALL
      SELECT d.id FROM departments d
      JOIN DeptScope ds ON d.parent_id = ds.id
    )
  `;
  const where = `u.dept_id IN (SELECT id FROM DeptScope)`;
  const bind = (req: ReturnType<ConnectionPool['request']>) =>
    req.input('ms_root_id', sql.Int, rootDeptId);
  return { cte, where, bind };
}
