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
        `SELECT id, title, description, logic, conditions, status, admin_notes, created_at, reviewed_at
         FROM strategy_submissions
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [decoded.userId]
      );
      return res.status(200).json({ submissions: rows });
    } catch (err: any) {
      console.error('submissions GET error:', err);
      return res.status(500).json({ error: err.message || 'Internal error' });
    }
  }

  if (req.method === 'POST') {
    const { title, description, logic, conditions } = req.body;
    if (!title || !description || !logic) {
      return res.status(400).json({ error: 'Title, description, and logic are required' });
    }

    try {
      const { rows } = await query(
        `INSERT INTO strategy_submissions (user_id, title, description, logic, conditions)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [decoded.userId, title, description, logic, conditions || null]
      );

      await query(
        `UPDATE users SET strategies_submitted = strategies_submitted + 1 WHERE id = $1`,
        [decoded.userId]
      );

      return res.status(201).json({ success: true, id: rows[0].id });
    } catch (err: any) {
      console.error('submissions POST error:', err);
      return res.status(500).json({ error: err.message || 'Internal error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
