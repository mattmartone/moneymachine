import { query } from '../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

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
        `SELECT e.id, e.post_position, e.morning_line_odds, e.live_odds,
                e.jockey, e.trainer, e.weight, e.owner, e.equipment,
                e.last_race_date, e.days_since_last, e.best_beyer, e.last_beyer,
                e.lifetime_earnings, e.running_style,
                h.id AS horse_id, h.name AS horse_name, h.sire, h.dam,
                e.scratched
         FROM entries e
         JOIN horses h ON h.id = e.horse_id
         WHERE e.race_id = $1
         ORDER BY e.post_position ASC NULLS LAST`,
        [race_id]
      );
      return res.status(200).json({ entries: rows });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'PATCH') {
    const { entry_id, live_odds, morning_line_odds, scratched } = req.body;
    if (!entry_id) return res.status(400).json({ error: 'entry_id required' });

    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (live_odds !== undefined) {
      sets.push(`live_odds = $${idx++}`);
      params.push(live_odds);
    }
    if (morning_line_odds !== undefined) {
      sets.push(`morning_line_odds = $${idx++}`);
      params.push(morning_line_odds);
    }
    if (scratched !== undefined) {
      sets.push(`scratched = $${idx++}`);
      params.push(scratched);
    }

    if (sets.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    params.push(entry_id);

    try {
      await query(`UPDATE entries SET ${sets.join(', ')} WHERE id = $${idx}`, params);
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
