import { query } from './db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ftc-dev-secret';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
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

  // Check if user is admin
  const { rows: adminCheck } = await query(
    `SELECT role FROM users WHERE id = $1`, [decoded.userId]
  );

  if (!adminCheck.length || adminCheck[0].role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  try {
    const { rows } = await query(
      `SELECT id, name, email, created_at, membership_status, subscription_status, tokens, lifetime_tokens_used, reports_downloaded, lifetime_billed
       FROM users ORDER BY created_at DESC`
    );

    return res.status(200).json({ users: rows });
  } catch (err: any) {
    console.error('users error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
