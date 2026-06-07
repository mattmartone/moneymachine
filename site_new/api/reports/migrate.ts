import { query } from '../db.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET || 'ftc-admin'}`) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS report_downloads (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        report_id INTEGER NOT NULL REFERENCES reports(id),
        tokens_spent INTEGER NOT NULL DEFAULT 1000,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, report_id)
      )
    `);

    return res.status(200).json({ success: true, message: 'report_downloads table created' });
  } catch (err: any) {
    console.error('migrate error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
