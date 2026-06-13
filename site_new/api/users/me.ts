import { query } from '../db.js';
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

  try {
    // Ensure subscription columns exist
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none'`).catch(() => {});
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT`).catch(() => {});

    const { rows } = await query(
      `SELECT email, tokens, membership_status, subscription_status, lifetime_tokens_used, reports_downloaded, lifetime_billed, role
       FROM users WHERE id = $1`,
      [decoded.userId]
    );

    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json(rows[0]);
  } catch (err: any) {
    console.error('users/me error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
