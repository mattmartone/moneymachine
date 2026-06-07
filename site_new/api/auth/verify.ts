import { query } from '../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ftc-dev-secret';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    const { rows } = await query(
      `SELECT s.user_id, s.expires_at, u.email, u.name, u.onboarded
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = $1 AND s.used = false`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired link' });
    }

    const session = rows[0];

    if (new Date(session.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Link expired' });
    }

    // Mark token as used
    await query(`UPDATE sessions SET used = true WHERE token = $1`, [token]);

    // Update last login
    await query(`UPDATE users SET last_login = NOW() WHERE id = $1`, [session.user_id]);

    // Generate JWT
    const jwtToken = jwt.sign(
      { userId: session.user_id, email: session.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token: jwtToken,
      user: {
        id: session.user_id,
        email: session.email,
        name: session.name,
        onboarded: session.onboarded
      }
    });
  } catch (err: any) {
    console.error('verify error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
