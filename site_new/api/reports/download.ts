import { query } from '../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ftc-dev-secret';
const DOWNLOAD_COST = 1000;

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

  const { reportId } = req.body;
  if (!reportId) {
    return res.status(400).json({ error: 'reportId required' });
  }

  try {
    const { rows: userRows } = await query(
      `SELECT id, tokens FROM users WHERE id = $1`,
      [decoded.userId]
    );
    const user = userRows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.tokens < DOWNLOAD_COST) {
      return res.status(402).json({
        error: 'Insufficient tokens',
        required: DOWNLOAD_COST,
        available: user.tokens
      });
    }

    const { rows: reportRows } = await query(
      `SELECT id, title, content_url FROM reports WHERE id = $1`,
      [reportId]
    );
    const report = reportRows[0];
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (!report.content_url) return res.status(404).json({ error: 'Report file not available' });

    // Check if user already purchased this report
    const { rows: purchaseRows } = await query(
      `SELECT id FROM report_downloads WHERE user_id = $1 AND report_id = $2`,
      [decoded.userId, reportId]
    );

    if (purchaseRows.length > 0) {
      // Already purchased — return URL without charging again
      return res.status(200).json({ url: report.content_url, already_purchased: true });
    }

    // Deduct tokens
    await query(
      `UPDATE users SET tokens = tokens - $1, lifetime_tokens_used = lifetime_tokens_used + $1 WHERE id = $2`,
      [DOWNLOAD_COST, decoded.userId]
    );

    // Record the download
    await query(
      `INSERT INTO report_downloads (user_id, report_id, tokens_spent) VALUES ($1, $2, $3)`,
      [decoded.userId, reportId, DOWNLOAD_COST]
    );

    return res.status(200).json({
      url: report.content_url,
      tokens_spent: DOWNLOAD_COST,
      tokens_remaining: user.tokens - DOWNLOAD_COST
    });
  } catch (err: any) {
    console.error('report download error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
