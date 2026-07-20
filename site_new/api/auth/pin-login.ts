import { query } from '../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';
const VALID_PINS = ['7413', '666'];
const PIN_EMAILS = ['mwmartone@gmail.com'];

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const email = (req.body.email || '').toLowerCase().trim();
  const pin = req.body.pin || '';

  if (!PIN_EMAILS.includes(email)) {
    return res.status(403).json({ error: 'PIN login not available for this account' });
  }

  if (!VALID_PINS.includes(pin)) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }

  try {
    await query(
      `INSERT INTO users (email, created_at) VALUES ($1, NOW()) ON CONFLICT (email) DO NOTHING`,
      [email]
    );

    const { rows } = await query(`SELECT id, email, name, role, onboarded FROM users WHERE email = $1`, [email]);
    const user = rows[0];

    await query(`UPDATE users SET last_login = NOW() WHERE id = $1`, [user.id]);

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    return res.status(200).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, onboarded: user.onboarded }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
