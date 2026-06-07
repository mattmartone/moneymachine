import { query } from '../db.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET || 'ftc-admin'}`) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  const { sql, params } = req.body;
  if (!sql) return res.status(400).json({ error: 'sql required' });

  try {
    const result = await query(sql, params || []);
    return res.status(200).json({ rows: result.rows, rowCount: result.rowCount });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
