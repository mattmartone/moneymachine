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

  if (req.method === 'GET') {
    try {
      const { rows } = await query(
        `SELECT id, title, description, logic, conditions, visibility, created_at
         FROM user_strategies
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [decoded.userId]
      );
      return res.status(200).json({ strategies: rows });
    } catch (err: any) {
      console.error('lab strategies GET error:', err);
      return res.status(500).json({ error: err.message || 'Internal error' });
    }
  }

  if (req.method === 'POST') {
    const { title, description, logic, conditions, visibility } = req.body;
    if (!title || !logic) {
      return res.status(400).json({ error: 'Title and logic required' });
    }

    try {
      const { rows } = await query(
        `INSERT INTO user_strategies (user_id, title, description, logic, conditions, visibility)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [decoded.userId, title, description || null, logic, conditions || null, visibility || 'private']
      );
      return res.status(201).json({ success: true, id: rows[0].id });
    } catch (err: any) {
      console.error('lab strategies POST error:', err);
      return res.status(500).json({ error: err.message || 'Internal error' });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });

    try {
      await query(
        `DELETE FROM user_strategies WHERE id = $1 AND user_id = $2`,
        [id, decoded.userId]
      );
      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.error('lab strategies DELETE error:', err);
      return res.status(500).json({ error: err.message || 'Internal error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
