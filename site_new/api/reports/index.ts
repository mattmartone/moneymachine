import { query } from '../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

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
      `SELECT id, title, track, date, races_analyzed, roi_pct, summary, content_url, created_at
       FROM reports ORDER BY date DESC, created_at DESC`
    );

    return res.status(200).json({ reports: rows });
  } catch (err: any) {
    console.error('reports error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
