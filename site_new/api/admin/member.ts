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

  let decoded: any;
  try {
    decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { rows: adminCheck } = await query(
    `SELECT role FROM users WHERE id = $1`, [decoded.userId]
  );
  if (!adminCheck.length || adminCheck[0].role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });

  try {
    const { rows: userRows } = await query(
      `SELECT id, email, name, tokens, lifetime_tokens_used, reports_downloaded, lifetime_billed, membership_status, role, created_at, last_login
       FROM users WHERE id = $1`,
      [id]
    );
    if (!userRows.length) return res.status(404).json({ error: 'User not found' });

    const { rows: comms } = await query(
      `SELECT id, type, subject, body, created_at FROM member_comms WHERE user_id = $1 ORDER BY created_at DESC`,
      [id]
    );

    const { rows: analyses } = await query(
      `SELECT a.id, a.status, a.tokens_spent, a.created_at, u.filename
       FROM analyses a LEFT JOIN uploads u ON u.id = a.upload_id
       WHERE a.user_id = $1 ORDER BY a.created_at DESC`,
      [id]
    );

    return res.status(200).json({ user: userRows[0], comms, analyses });
  } catch (err: any) {
    console.error('admin/member error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
