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

  const { name, source } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name required' });
  }

  try {
    await query(
      `UPDATE users SET name = $1, source = $2, onboarded = true WHERE id = $3`,
      [name, source || null, decoded.userId]
    );

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('onboard error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
