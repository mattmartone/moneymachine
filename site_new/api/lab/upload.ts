import { query } from '../db.js';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import { put } from '@vercel/blob';

const JWT_SECRET = process.env.JWT_SECRET || 'ftc-dev-secret';
const resend = new Resend(process.env.RESEND_API_KEY);

export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } }
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
    const { rows: userRows } = await query(`SELECT email, name, tokens FROM users WHERE id = $1`, [decoded.userId]);
    const user = userRows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { filename, strategies, fileData } = req.body;
    const selectedStrategies = Array.isArray(strategies) ? strategies : ['all'];

    const cost = selectedStrategies.length * 15000;
    if (user.tokens < cost) {
      return res.status(402).json({ error: 'Insufficient tokens', required: cost, available: user.tokens });
    }

    // Store PDF in Vercel Blob
    let blobUrl = 'no-file';
    if (fileData) {
      const buffer = Buffer.from(fileData, 'base64');
      const blob = await put(`uploads/${decoded.userId}/${Date.now()}-${filename}`, buffer, {
        access: 'public',
        contentType: 'application/pdf'
      });
      blobUrl = blob.url;
    }

    // Create upload record
    const { rows: uploadRows } = await query(
      `INSERT INTO uploads (user_id, filename, track, race_date, storage_path)
       VALUES ($1, $2, $3, CURRENT_DATE, $4) RETURNING id`,
      [decoded.userId, filename, 'Extracted from PDF', blobUrl]
    );

    // Create analysis record
    const { rows: analysisRows } = await query(
      `INSERT INTO analyses (user_id, upload_id, strategies_used, status, tokens_spent)
       VALUES ($1, $2, $3, 'pending', $4) RETURNING id`,
      [decoded.userId, uploadRows[0].id, JSON.stringify(selectedStrategies), cost]
    );

    // Deduct tokens
    await query(
      `UPDATE users SET tokens = tokens - $1, lifetime_tokens_used = lifetime_tokens_used + $1 WHERE id = $2`,
      [cost, decoded.userId]
    );

    // Email admin about new order (include blob link)
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
          <p><strong>File:</strong> <a href="${blobUrl}">${filename}</a></p>
          <p><strong>Strategies:</strong> ${selectedStrategies.join(', ')}</p>
          <p><strong>Tokens charged:</strong> ${cost.toLocaleString()}</p>
          <p><strong>Analysis ID:</strong> ${analysisRows[0].id}</p>
          <hr/>
          <p>Process the analysis and deliver the report to ${user.email}</p>
        </div>
      `
    });

    // Confirm to user
    await resend.emails.send({
      from: 'Fade the Chalk <picks@org64.com>',
      to: [user.email, 'mmartone@ctcitechnology.com'],
      subject: 'The job is in — Fade the Chalk',
      html: `
        <div style="font-family: monospace; max-width: 500px; border: 2px solid black; padding: 24px;">
          <h1 style="font-family: serif;">FADE THE CHALK</h1>
          <p>We got the book (<strong>${filename}</strong>). The crew's on it.</p>
          <p>Your picks report gets delivered to this address when it's done. Sit tight — we don't rush the work, but we don't sleep on it either.</p>
          <p style="font-size: 12px; color: #666; margin-top: 16px;">${cost.toLocaleString()} tokens off your tab. Remaining: ${(user.tokens - cost).toLocaleString()}</p>
        </div>
      `
    });

    return res.status(201).json({ success: true, analysis_id: analysisRows[0].id, tokens_spent: cost });
  } catch (err: any) {
    console.error('lab upload error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
