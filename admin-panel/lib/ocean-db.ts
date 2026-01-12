import { Pool } from 'pg';

const oceanPool = new Pool({
  host: process.env.OCEAN_DB_HOST || 'localhost',
  port: 5432,
  database: 'ocean_db',
  user: 'ocean_user',
  password: process.env.OCEAN_DB_PASSWORD || 'OceanSecure2026!DB',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function queryOcean(sql: string, params?: any[]) {
  const client = await oceanPool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

export default oceanPool;
