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

  try {
    jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const { rows } = await query(
      `SELECT u.name, u.strategies_approved, u.lifetime_earned,
              COALESCE(SUM(s.usage_count), 0) as total_usage
       FROM users u
       LEFT JOIN strategies s ON s.contributor_id = u.id AND s.status = 'active'
       WHERE u.strategies_approved > 0
       GROUP BY u.id, u.name, u.strategies_approved, u.lifetime_earned
       ORDER BY u.lifetime_earned DESC`
    );

    return res.status(200).json({ leaders: rows });
  } catch (err: any) {
    console.error('leaderboard error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
