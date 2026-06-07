import { Resend } from 'resend';
import { query } from '../db.js';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  try {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    // Upsert user
    await query(
      `INSERT INTO users (email, created_at) VALUES ($1, NOW()) ON CONFLICT (email) DO NOTHING`,
      [email]
    );

    // Get user id
    const { rows } = await query(`SELECT id FROM users WHERE email = $1`, [email]);
    const userId = rows[0].id;

    // Save token
    await query(
      `INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [userId, token, expires.toISOString()]
    );

    // Send magic link
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://fadethechalk.vercel.app';
    const link = `${baseUrl}/verify?token=${token}`;

    await resend.emails.send({
      from: 'Fade the Chalk <picks@org64.com>',
      to: email,
      subject: 'Your login link — Fade the Chalk',
      html: `
        <div style="font-family: monospace; max-width: 500px; margin: 0 auto; border: 2px solid black; padding: 24px;">
          <h1 style="font-family: serif; margin-bottom: 16px;">FADE THE CHALK</h1>
          <p>Click below to sign in:</p>
          <a href="${link}" style="display: inline-block; background: #c0c0c0; border: 2px solid black; padding: 8px 16px; font-weight: bold; color: black; text-decoration: none; margin: 16px 0;">
            SIGN IN &rarr;
          </a>
          <p style="font-size: 12px; color: #666; margin-top: 16px;">This link expires in 15 minutes.</p>
        </div>
      `
    });

    return res.status(200).json({ sent: true });
  } catch (err: any) {
    console.error('send-link error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
