import { sql } from '@vercel/postgres';
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

  // Find valid session
  const { rows } = await sql`
    SELECT s.user_id, s.expires_at, u.email, u.name, u.onboarded
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token} AND s.used = false
  `;

  if (rows.length === 0) {
    return res.status(401).json({ error: 'Invalid or expired link' });
  }

  const session = rows[0];

  if (new Date(session.expires_at) < new Date()) {
    return res.status(401).json({ error: 'Link expired' });
  }

  // Mark token as used
  await sql`UPDATE sessions SET used = true WHERE token = ${token}`;

  // Update last login
  await sql`UPDATE users SET last_login = NOW() WHERE id = ${session.user_id}`;

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
}
