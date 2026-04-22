import sql from 'mssql';

const config: sql.config = {
  server:   process.env.MSSQL_SERVER   ?? 'localhost',
  user:     process.env.MSSQL_USER     ?? 'sa',
  password: process.env.MSSQL_PASSWORD ?? '',
  database: process.env.MSSQL_DATABASE ?? 'CRMDb',
  port:     parseInt(process.env.MSSQL_PORT ?? '1433', 10),
  options: {
    encrypt:                process.env.MSSQL_ENCRYPT             === 'true',
    trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERT   === 'true',
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30_000,
  },
};

// Module-level singleton — reused across Next.js API route invocations
let poolPromise: Promise<sql.ConnectionPool> | null = null;

export function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config).connect().catch(err => {
      poolPromise = null;
      throw err;
    });
  }
  return poolPromise;
}

export { sql };
