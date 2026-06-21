import { query } from '../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ftc-dev-secret';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  const isPublic = authHeader === 'Bearer public';
  if (!isPublic) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
      jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  try {
    const dateParam = req.query?.date;
    let today: string;
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      today = dateParam;
    } else {
      const now = new Date();
      const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      today = `${et.getFullYear()}-${String(et.getMonth() + 1).padStart(2, '0')}-${String(et.getDate()).padStart(2, '0')}`;
    }

    const { rows } = await query(
      `SELECT b.id, b.race_id, b.bet_type, b.stake, b.doubled, b.conviction, b.entries_used,
              r.track, r.race_number, r.conditions, r.distance, r.surface, r.field_size, r.post_time,
              r.race_theory, r.skip_reason,
              (SELECT array_agg(s.name) FROM strategy_activations sa JOIN strategies s ON s.id = sa.strategy_id WHERE sa.bet_id = b.id) as strategies_fired
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
