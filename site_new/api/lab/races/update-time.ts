import { query } from '../../db.js';
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

  try {
    const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    // Only Matt can update
    const user = await query('SELECT email FROM users WHERE id = $1', [decoded.userId || decoded.id]);
    if (!user.rows[0] || user.rows[0].email !== 'mwmartone@gmail.com') {
      return res.status(403).json({ error: 'Admin only' });
    }
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { race_id, post_time } = req.body;
  if (!race_id || !post_time) {
    return res.status(400).json({ error: 'race_id and post_time required' });
  }

  try {
    await query('UPDATE races SET post_time = $1 WHERE id = $2', [post_time, race_id]);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
