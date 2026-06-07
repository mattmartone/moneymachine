import { Pool } from 'pg';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = (process.env.POSTGRES_URL || '').replace(/\?.*$/, '');

const pool = new Pool({
  connectionString,
  ssl: true
});

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}
