import { query } from '../db.js';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';

const JWT_SECRET = process.env.JWT_SECRET || 'ftc-dev-secret';
const resend = new Resend(process.env.RESEND_API_KEY);

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

  const { user_id, tokens } = req.body;
  if (!user_id || !tokens) {
    return res.status(400).json({ error: 'user_id and tokens required' });
  }

  try {
    await query(
      `UPDATE users SET tokens = tokens + $1 WHERE id = $2`,
      [tokens, user_id]
    );

    // Get updated user info
    const { rows: userRows } = await query(
      `SELECT email, name, tokens FROM users WHERE id = $1`, [user_id]
    );
    const user = userRows[0];

    // Notify user of token allocation
    if (user && tokens > 0) {
      await resend.emails.send({
        from: 'Fade the Chalk <picks@org64.com>',
        to: user.email,
        subject: 'The Commission has spoken — Fade the Chalk',
        html: `
          <div style="font-family: monospace; max-width: 500px; border: 2px solid black; padding: 24px;">
            <h1 style="font-family: serif; margin-bottom: 4px;">FADE THE CHALK</h1>
            <hr style="border: 1px solid black;"/>
            <p style="font-size: 16px;">${user.name ? user.name.split(' ')[0] : 'Friend'},</p>
            <p style="font-size: 16px;">Matt, the omnipotent admin and Capo di Tutti Capi, Leader of the Fade The Chalk Commission has allotted you <strong>${tokens.toLocaleString()} tokens</strong>.</p>
            <p style="font-size: 16px;">Your balance: <strong>${user.tokens.toLocaleString()} tokens</strong></p>
            <hr style="border: 1px solid #ccc;"/>
            <p style="font-size: 14px;">Head to <strong>MY LAB</strong> to upload a race book and put the model to work.</p>
            <p style="font-size: 12px; color: #666; margin-top: 24px;">1,000,000 tokens ≈ 3 full card analyses with all strategies selected.</p>
          </div>
        `
      });
    }

    return res.status(200).json({ success: true, new_balance: user?.tokens });
  } catch (err: any) {
    console.error('allocate error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
