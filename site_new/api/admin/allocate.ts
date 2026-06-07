import { query } from '../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ftc-dev-secret';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  let decoded: any;
  try {
    decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { rows: adminCheck } = await query(
    `SELECT role FROM users WHERE id = $1`, [decoded.userId]
  );
  if (!adminCheck.length || adminCheck[0].role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { user_id, tokens } = req.body;
  if (!user_id || !tokens) {
    return res.status(400).json({ error: 'user_id and tokens required' });
  }

  try {
    await query(
      `UPDATE users SET tokens = tokens + $1 WHERE id = $2`,
      [tokens, user_id]
    );
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('allocate error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
