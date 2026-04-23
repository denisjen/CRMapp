// Update existing users with hashed passwords
// Run: npx tsx db/update-passwords.ts
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

async function run() {
  const pool = await new sql.ConnectionPool(config).connect();
  const hash = await bcrypt.hash('password123', 10);

  await pool.request()
    .input('hash', sql.NVarChar(200), hash)
    .query('UPDATE users SET password_hash = @hash');

  console.log('所有使用者密碼已更新為 password123');
  await pool.close();
}

run().catch(err => { console.error(err); process.exit(1); });
