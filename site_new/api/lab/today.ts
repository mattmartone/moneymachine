import { query } from '../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

  try {
    const dateParam = req.query?.date;
    let today: string;
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      today = dateParam;
    } else {
      const now = new Date();
      const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      today = `${et.getFullYear()}-${String(et.getMonth() + 1).padStart(2, '0')}-${String(et.getDate()).padStart(2, '0')}`;
    }

    const { rows } = await query(
      `SELECT b.id, b.race_id, b.bet_type, b.stake, b.doubled, b.conviction, b.entries_used,
              r.track, r.race_number, r.conditions, r.distance, r.surface, r.field_size, r.post_time,
              r.race_theory, r.skip_reason,
              (SELECT array_agg(s.name) FROM strategy_activations sa JOIN strategies s ON s.id = sa.strategy_id WHERE sa.bet_id = b.id) as strategies_fired,
              (SELECT json_agg(json_build_object('name', s.name, 'reasoning', sa.reasoning)) FROM strategy_activations sa JOIN strategies s ON s.id = sa.strategy_id WHERE sa.bet_id = b.id AND sa.reasoning IS NOT NULL) as strategies_detail,
              sc.composite_score, sc.signal_score, sc.win_pick_name, sc.win_pick_ml, sc.win_pick_beyer
       FROM bets b
       JOIN races r ON r.id = b.race_id
       LEFT JOIN scored_candidates sc ON sc.race_id = r.id AND sc.date = r.date AND sc.conviction = 'HIGH'
       WHERE r.date = $1
       ORDER BY r.post_time NULLS LAST, r.track, r.race_number, b.id`,
      [today]
    );

    const raceIds = [...new Set(rows.map((r: any) => r.race_id))];
    const { rows: resultsRows } = raceIds.length ? await query(
      `SELECT res.race_id, res.win_payout, res.place_payout, res.show_payout, res.exacta_payout, res.trifecta_payout, res.superfecta_payout,
              ew.post_position AS win_pp, hw.name AS win_horse,
              ep.post_position AS place_pp, hp.name AS place_horse,
              es.post_position AS show_pp, hs.name AS show_horse,
              ef.post_position AS fourth_pp, hf.name AS fourth_horse
       FROM results res
       LEFT JOIN entries ew ON ew.id = res.win_entry_id LEFT JOIN horses hw ON hw.id = ew.horse_id
       LEFT JOIN entries ep ON ep.id = res.place_entry_id LEFT JOIN horses hp ON hp.id = ep.horse_id
       LEFT JOIN entries es ON es.id = res.show_entry_id LEFT JOIN horses hs ON hs.id = es.horse_id
       LEFT JOIN entries ef ON ef.id = res.fourth_entry_id LEFT JOIN horses hf ON hf.id = ef.horse_id
       WHERE res.race_id = ANY($1)`,
      [raceIds]
    ) : { rows: [] };
    const resultsMap: Record<number, any> = {};
    for (const r of resultsRows) resultsMap[r.race_id] = r;

    const { rows: entriesRows } = raceIds.length ? await query(
      `SELECT e.race_id, e.post_position, h.name AS horse_name, e.morning_line_odds, e.live_odds, e.scratched
       FROM entries e JOIN horses h ON h.id = e.horse_id
       WHERE e.race_id = ANY($1)
       ORDER BY e.race_id, e.post_position`,
      [raceIds]
    ) : { rows: [] };
    const entriesMap: Record<number, any[]> = {};
    for (const e of entriesRows) {
      if (!entriesMap[e.race_id]) entriesMap[e.race_id] = [];
      entriesMap[e.race_id].push(e);
    }

    const { rows: videoRows } = await query(
      `SELECT youtube_id, title FROM videos WHERE date <= $1 ORDER BY date DESC LIMIT 1`,
      [today]
    );
    const video = videoRows.length ? videoRows[0] : null;

    return res.status(200).json({ picks: rows, results: resultsMap, entries: entriesMap, video });
  } catch (err: any) {
    console.error('today picks error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
