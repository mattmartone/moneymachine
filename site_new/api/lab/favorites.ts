import { query } from '../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ftc-dev-secret';

export default async function handler(req: any, res: any) {
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

  // Ensure table exists
  await query(`
    CREATE TABLE IF NOT EXISTS user_strategy_favorites (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      strategy_name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, strategy_name)
    )
  `);

  if (req.method === 'GET') {
    try {
      const { rows } = await query(
        `SELECT s.name, s.type, s.description, s.win_rate, s.itm_rate, s.best_conditions, s.trend
         FROM user_strategy_favorites f
         JOIN strategies s ON s.name = f.strategy_name
         WHERE f.user_id = $1
         ORDER BY f.created_at DESC`,
        [decoded.userId]
      );
      return res.status(200).json({ favorites: rows });
    } catch (err: any) {
      console.error('favorites GET error:', err);
      return res.status(500).json({ error: err.message || 'Internal error' });
    }
  }

  if (req.method === 'POST') {
    const { strategy_name } = req.body;
    if (!strategy_name) return res.status(400).json({ error: 'strategy_name required' });

    try {
      await query(
        `INSERT INTO user_strategy_favorites (user_id, strategy_name) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [decoded.userId, strategy_name]
      );
      return res.status(201).json({ success: true });
    } catch (err: any) {
      console.error('favorites POST error:', err);
      return res.status(500).json({ error: err.message || 'Internal error' });
    }
  }

  if (req.method === 'DELETE') {
    const { strategy_name } = req.body;
    if (!strategy_name) return res.status(400).json({ error: 'strategy_name required' });

    try {
      await query(
        `DELETE FROM user_strategy_favorites WHERE user_id = $1 AND strategy_name = $2`,
        [decoded.userId, strategy_name]
      );
      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.error('favorites DELETE error:', err);
      return res.status(500).json({ error: err.message || 'Internal error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
