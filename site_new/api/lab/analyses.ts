import { query } from '../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ftc-dev-secret';

export default async function handler(req: any, res: any) {
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

  if (req.method === 'GET') {
    try {
      const { rows } = await query(
        `SELECT a.id, a.strategies_used, a.status, a.result_url, a.tokens_spent, a.created_at, a.completed_at,
                u.filename, u.track, u.race_date
         FROM analyses a
         LEFT JOIN uploads u ON u.id = a.upload_id
         WHERE a.user_id = $1
         ORDER BY a.created_at DESC`,
        [decoded.userId]
      );
      return res.status(200).json({ analyses: rows });
    } catch (err: any) {
      console.error('lab analyses GET error:', err);
      return res.status(500).json({ error: err.message || 'Internal error' });
    }
  }

  if (req.method === 'POST') {
    const { upload_id, strategy_ids } = req.body;
    if (!upload_id || !strategy_ids || !strategy_ids.length) {
      return res.status(400).json({ error: 'upload_id and strategy_ids required' });
    }

    try {
      // Check user has tokens
      const { rows: userRows } = await query(`SELECT tokens FROM users WHERE id = $1`, [decoded.userId]);
      const tokensAvailable = userRows[0]?.tokens || 0;
      const cost = strategy_ids.length * 500; // 500 tokens per strategy applied

      if (tokensAvailable < cost) {
        return res.status(402).json({ error: 'Insufficient tokens', required: cost, available: tokensAvailable });
      }

      // Create analysis
      const { rows } = await query(
        `INSERT INTO analyses (user_id, upload_id, strategies_used, status, tokens_spent)
         VALUES ($1, $2, $3, 'pending', $4) RETURNING id`,
        [decoded.userId, upload_id, JSON.stringify(strategy_ids), cost]
      );

      // Deduct tokens
      await query(
        `UPDATE users SET tokens = tokens - $1, lifetime_tokens_used = lifetime_tokens_used + $1 WHERE id = $2`,
        [cost, decoded.userId]
      );

      return res.status(201).json({ success: true, id: rows[0].id, tokens_spent: cost });
    } catch (err: any) {
      console.error('lab analyses POST error:', err);
      return res.status(500).json({ error: err.message || 'Internal error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
