import { query } from '../db.js';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';

const JWT_SECRET = process.env.JWT_SECRET || 'ftc-dev-secret';
const resend = new Resend(process.env.RESEND_API_KEY);

export const config = {
  api: { bodyParser: false }
};

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

  try {
    // Get user info
    const { rows: userRows } = await query(`SELECT email, name, tokens FROM users WHERE id = $1`, [decoded.userId]);
    const user = userRows[0];

    if (!user) return res.status(404).json({ error: 'User not found' });

    // 1000 tokens per full card analysis (10 races × 10 horses)
    // $10/mo = 10,000 tokens = ~10 full card analyses
    const cost = 1000;
    if (user.tokens < cost) {
      return res.status(402).json({ error: 'Insufficient tokens', required: cost, available: user.tokens });
    }

    // For now we can't parse multipart in Vercel serverless easily,
    // so we'll accept JSON with the track name and note the PDF will come via email
    // In production this would use Vercel Blob or Supabase Storage
    const track = req.body?.track || req.query?.track || 'Unknown Track';
    const filename = req.body?.filename || 'race_book.pdf';

    // Create upload record
    const { rows: uploadRows } = await query(
      `INSERT INTO uploads (user_id, filename, track, race_date, storage_path)
       VALUES ($1, $2, $3, CURRENT_DATE, 'pending') RETURNING id`,
      [decoded.userId, filename, track]
    );

    // Create analysis record
    const { rows: analysisRows } = await query(
      `INSERT INTO analyses (user_id, upload_id, strategies_used, status, tokens_spent)
       VALUES ($1, $2, 'all', 'pending', $3) RETURNING id`,
      [decoded.userId, uploadRows[0].id, cost]
    );

    // Deduct tokens
    await query(
      `UPDATE users SET tokens = tokens - $1, lifetime_tokens_used = lifetime_tokens_used + $1 WHERE id = $2`,
      [cost, decoded.userId]
    );

    // Email admin about new order
    const { rows: adminRows } = await query(`SELECT email FROM users WHERE role = 'admin'`);
    const adminEmails = adminRows.map((r: any) => r.email);

    await resend.emails.send({
      from: 'Fade the Chalk <picks@org64.com>',
      to: adminEmails,
      subject: `[FTC Order] New analysis request from ${user.name || user.email}`,
      html: `
        <div style="font-family: monospace; max-width: 500px; border: 2px solid black; padding: 24px;">
          <h2 style="font-family: serif;">New Analysis Order</h2>
          <p><strong>From:</strong> ${user.name || 'No name'} (${user.email})</p>
          <p><strong>Track:</strong> ${track}</p>
          <p><strong>Strategies:</strong> All</p>
          <p><strong>Tokens charged:</strong> ${cost}</p>
          <p><strong>Analysis ID:</strong> ${analysisRows[0].id}</p>
          <hr/>
          <p>Process the analysis and deliver the report to ${user.email}</p>
        </div>
      `
    });

    // Confirm to user
    await resend.emails.send({
      from: 'Fade the Chalk <picks@org64.com>',
      to: user.email,
      subject: 'Your analysis is being processed — Fade the Chalk',
      html: `
        <div style="font-family: monospace; max-width: 500px; border: 2px solid black; padding: 24px;">
          <h1 style="font-family: serif;">FADE THE CHALK</h1>
          <p>We received your race book for <strong>${track}</strong>.</p>
          <p>Your analysis is being processed. We'll deliver your picks report to this email once it's ready.</p>
          <p style="font-size: 12px; color: #666; margin-top: 16px;">${cost} tokens deducted. Remaining: ${user.tokens - cost}</p>
        </div>
      `
    });

    return res.status(201).json({ success: true, analysis_id: analysisRows[0].id, tokens_spent: cost });
  } catch (err: any) {
    console.error('lab upload error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
