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

  try {
    jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    const { rows } = await query(
      `SELECT b.id, b.race_id, b.bet_type, b.stake, b.doubled, b.conviction, b.entries_used,
              r.track, r.race_number, r.conditions, r.distance, r.surface, r.field_size, r.post_time
       FROM bets b
       JOIN races r ON r.id = b.race_id
       WHERE r.date = $1
       ORDER BY r.post_time NULLS LAST, r.track, r.race_number, b.id`,
      [today]
    );

    return res.status(200).json({ picks: rows });
  } catch (err: any) {
    console.error('today picks error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
