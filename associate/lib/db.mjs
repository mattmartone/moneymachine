import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function query(sql, params) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

export { pool };
