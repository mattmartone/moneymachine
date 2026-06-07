import { query } from '../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ftc-dev-secret';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
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

  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  // Don't allow deleting yourself
  if (user_id === decoded.userId) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }

  try {
    await query(`DELETE FROM sessions WHERE user_id = $1`, [user_id]);
    await query(`DELETE FROM member_comms WHERE user_id = $1`, [user_id]).catch(() => {});
    await query(`DELETE FROM analyses WHERE user_id = $1`, [user_id]).catch(() => {});
    await query(`DELETE FROM user_strategies WHERE user_id = $1`, [user_id]).catch(() => {});
    await query(`DELETE FROM user_strategy_favorites WHERE user_id = $1`, [user_id]).catch(() => {});
    await query(`DELETE FROM users WHERE id = $1`, [user_id]);

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('delete-user error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
