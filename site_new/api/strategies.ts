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
      `SELECT name, type, description, active, win_rate, itm_rate, form, best_conditions, trend
       FROM strategies ORDER BY active DESC, win_rate DESC NULLS LAST`
    );

    return res.status(200).json({ strategies: rows });
  } catch (err: any) {
    console.error('strategies error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
