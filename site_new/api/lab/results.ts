import { query } from '../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ftc-dev-secret';

export default async function handler(req: any, res: any) {
  const authHeader = req.headers.authorization;
  const isPublic = authHeader === 'Bearer public';
  if (!isPublic) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
      jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  if (req.method === 'GET') {
    const { race_id } = req.query;
    if (!race_id) return res.status(400).json({ error: 'race_id required' });

    try {
      const { rows } = await query(
        `SELECT r.id, r.race_id, r.win_payout, r.exacta_payout, r.trifecta_payout, r.superfecta_payout, r.settled_at,
                hw.name AS win_horse, ew.post_position AS win_pp,
                hp.name AS place_horse, ep.post_position AS place_pp,
                hs.name AS show_horse, es.post_position AS show_pp,
                hf.name AS fourth_horse, ef.post_position AS fourth_pp
         FROM results r
         LEFT JOIN entries ew ON ew.id = r.win_entry_id
         LEFT JOIN horses hw ON hw.id = ew.horse_id
         LEFT JOIN entries ep ON ep.id = r.place_entry_id
         LEFT JOIN horses hp ON hp.id = ep.horse_id
         LEFT JOIN entries es ON es.id = r.show_entry_id
         LEFT JOIN horses hs ON hs.id = es.horse_id
         LEFT JOIN entries ef ON ef.id = r.fourth_entry_id
         LEFT JOIN horses hf ON hf.id = ef.horse_id
         WHERE r.race_id = $1`,
        [race_id]
      );

      if (rows.length === 0) {
        return res.status(200).json({ results: null });
      }

      return res.status(200).json({ results: rows[0] });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    // Admin only — insert/update results
    const decoded: any = jwt.verify(req.headers.authorization.split(' ')[1], JWT_SECRET);
    const { rows: userRows } = await query('SELECT email FROM users WHERE id = $1', [decoded.userId]);
    if (!userRows.length || userRows[0].email !== 'mwmartone@gmail.com') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const { race_id, win_pp, place_pp, show_pp, win_payout, exacta_payout, trifecta_payout, superfecta_payout } = req.body;
    if (!race_id) return res.status(400).json({ error: 'race_id required' });

    try {
      // Look up entry IDs by post position
      const lookupEntry = async (pp: number | null) => {
        if (!pp) return null;
        const { rows } = await query(
          'SELECT id FROM entries WHERE race_id = $1 AND post_position = $2',
          [race_id, pp]
        );
        return rows.length ? rows[0].id : null;
      };

      const win_entry_id = await lookupEntry(win_pp);
      const place_entry_id = await lookupEntry(place_pp);
      const show_entry_id = await lookupEntry(show_pp);

      await query(
        `INSERT INTO results (race_id, win_entry_id, place_entry_id, show_entry_id, win_payout, exacta_payout, trifecta_payout, superfecta_payout)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (race_id) DO UPDATE SET
           win_entry_id = EXCLUDED.win_entry_id,
           place_entry_id = EXCLUDED.place_entry_id,
           show_entry_id = EXCLUDED.show_entry_id,
           win_payout = EXCLUDED.win_payout,
           exacta_payout = EXCLUDED.exacta_payout,
           trifecta_payout = EXCLUDED.trifecta_payout,
           superfecta_payout = EXCLUDED.superfecta_payout,
           settled_at = NOW()`,
        [race_id, win_entry_id, place_entry_id, show_entry_id, win_payout || null, exacta_payout || null, trifecta_payout || null, superfecta_payout || null]
      );

      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
