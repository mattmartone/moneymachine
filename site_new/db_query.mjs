import pg from 'pg';
const { Pool } = pg;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
  connectionString: 'postgres://postgres.bazvhjajajkpkqqvyelg:LMczMTBYFGH6w9yn@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: true
});

const sql = process.argv[2];
if (!sql) { console.error('Usage: node db_query.mjs "SELECT ..."'); process.exit(1); }

try {
  const result = await pool.query(sql);
  if (result.rows.length > 0) {
    console.log(JSON.stringify(result.rows, null, 2));
  } else {
    console.log(`OK (${result.rowCount} rows affected)`);
  }
} catch (e) {
  console.error('ERROR:', e.message);
} finally {
  await pool.end();
}
