import { query } from '../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

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

  const { rows: adminCheck } = await query(
    `SELECT role FROM users WHERE id = $1`, [decoded.userId]
  );
  if (!adminCheck.length || adminCheck[0].role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  if (req.method === 'GET') {
    try {
      const { rows } = await query(
        `SELECT s.id, s.title, s.description, s.logic, s.conditions, s.status, s.created_at,
                u.name as submitter_name, u.email as submitter_email
         FROM strategy_submissions s
         JOIN users u ON u.id = s.user_id
         ORDER BY s.status = 'pending' DESC, s.created_at DESC`
      );
      return res.status(200).json({ submissions: rows });
    } catch (err: any) {
      console.error('admin submissions GET error:', err);
      return res.status(500).json({ error: err.message || 'Internal error' });
    }
  }

  if (req.method === 'POST') {
    const { id, action, admin_notes, strategy_name } = req.body;
    if (!id || !action) {
      return res.status(400).json({ error: 'id and action required' });
    }

    try {
      if (action === 'approve') {
        const { rows: sub } = await query(
          `SELECT * FROM strategy_submissions WHERE id = $1`, [id]
        );
        if (!sub.length) return res.status(404).json({ error: 'Submission not found' });

        const submission = sub[0];
        const name = strategy_name || submission.title;

        await query(
          `INSERT INTO strategies (name, type, description, prompt, active, contributor_id, status, submitted_at, reviewed_at)
           VALUES ($1, 'signal', $2, $3, true, $4, 'active', $5, NOW())`,
          [name, submission.description, submission.logic, submission.user_id, submission.created_at]
        );

        await query(
          `UPDATE strategy_submissions SET status = 'approved', admin_notes = $1, reviewed_at = NOW() WHERE id = $2`,
          [admin_notes || null, id]
        );

        await query(
          `UPDATE users SET strategies_approved = strategies_approved + 1 WHERE id = $1`,
          [submission.user_id]
        );

        return res.status(200).json({ success: true, action: 'approved' });
      }

      if (action === 'reject') {
        await query(
          `UPDATE strategy_submissions SET status = 'rejected', admin_notes = $1, reviewed_at = NOW() WHERE id = $2`,
          [admin_notes || null, id]
        );
        return res.status(200).json({ success: true, action: 'rejected' });
      }

      return res.status(400).json({ error: 'Invalid action' });
    } catch (err: any) {
      console.error('admin submissions POST error:', err);
      return res.status(500).json({ error: err.message || 'Internal error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
