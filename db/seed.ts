// Run once: npm run seed
// Safe to re-run — skips if data already exists.
import sql from 'mssql';
import bcrypt from 'bcryptjs';

const config: sql.config = {
  server:   process.env.MSSQL_SERVER   ?? 'localhost',
  user:     process.env.MSSQL_USER     ?? 'sa',
  password: process.env.MSSQL_PASSWORD ?? 'Cj19950422*!',
  database: process.env.MSSQL_DATABASE ?? 'CRMDb',
  port:     parseInt(process.env.MSSQL_PORT ?? '1433', 10),
  options: { encrypt: false, trustServerCertificate: true },
};

async function seed() {
  const pool = await new sql.ConnectionPool(config).connect();

  const existing = await pool.request().query('SELECT COUNT(*) AS cnt FROM organizations');
  if (existing.recordset[0].cnt > 0) {
    console.log('Seed data already exists — skipping.');
    await pool.close();
    return;
  }

  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const orgResult = await new sql.Request(tx)
      .input('name', sql.NVarChar(200), '我的公司')
      .query('INSERT INTO organizations (name) OUTPUT INSERTED.id VALUES (@name)');
    const orgId: number = orgResult.recordset[0].id;

    const deptResult = await new sql.Request(tx)
      .input('org_id', sql.Int, orgId)
      .input('name', sql.NVarChar(200), '業務部')
      .query('INSERT INTO departments (org_id, name) OUTPUT INSERTED.id VALUES (@org_id, @name)');
    const deptId: number = deptResult.recordset[0].id;

    const defaultPassword = await bcrypt.hash('password123', 10);
    const users = [
      { name: '系統管理員', email: 'admin@company.com',   role: 'admin'   },
      { name: '業務主管',   email: 'manager@company.com', role: 'manager' },
      { name: '業務A',      email: 'salesA@company.com',  role: 'sales'   },
      { name: '業務B',      email: 'salesB@company.com',  role: 'sales'   },
    ];

    for (const u of users) {
      await new sql.Request(tx)
        .input('dept_id',       sql.Int,          deptId)
        .input('name',          sql.NVarChar(200), u.name)
        .input('email',         sql.NVarChar(320), u.email)
        .input('role',          sql.NVarChar(10),  u.role)
        .input('password_hash', sql.NVarChar(200), defaultPassword)
        .query('INSERT INTO users (dept_id, name, email, role, password_hash) VALUES (@dept_id, @name, @email, @role, @password_hash)');
    }

    await tx.commit();
    console.log('Seed 完成！');
    console.log('  id=1 系統管理員 admin@company.com   (admin)');
    console.log('  id=2 業務主管   manager@company.com (manager)');
    console.log('  id=3 業務A      salesA@company.com  (sales)');
    console.log('  id=4 業務B      salesB@company.com  (sales)');
    console.log('  預設密碼：password123');
  } catch (err) {
    await tx.rollback();
    throw err;
  } finally {
    await pool.close();
  }
}

seed().catch(err => { console.error(err); process.exit(1); });
