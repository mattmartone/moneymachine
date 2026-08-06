import { query } from '../db.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (authHeader !== 'Bearer public') return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { date, track } = req.query || {};
    if (!date || !track) return res.status(400).json({ error: 'date and track params required' });

    // Get all races for this track/date
    const { rows: races } = await query(
      `SELECT id, race_number, distance, surface, purse, conditions, post_time, field_size, race_theory, skip_reason
       FROM races WHERE date = $1 AND track = $2 ORDER BY race_number`,
      [date, track]
    );

    if (!races.length) return res.status(200).json({ races: [], deterministic: [], fable: [], results: {}, entries: {} });

    const raceIds = races.map((r: any) => r.id);

    // Get deterministic scored_candidates for these races
    const { rows: detRows } = await query(
      `SELECT race_id, status, conviction, composite_score, signal_score,
              win_pick_pp, win_pick_name, win_pick_ml, win_pick_style, win_pick_beyer,
              box_pps, box_names, pace_scenario, fave_vulnerable, fave_name, fave_style,
              vulnerability_reason, race_theory,
              s1_fired, s4_fired, s5_fired, s6_fired, s9_fired, s11_fired
       FROM scored_candidates WHERE race_id = ANY($1) AND date = $2
       ORDER BY race_number`,
      [raceIds, date]
    );

    // Get Fable candidates for these races
    const { rows: fableRows } = await query(
      `SELECT race_id, bettable, skip_reason, conviction, pace_scenario, pace_reasoning,
              fave_pp, fave_name, fave_vulnerable, vulnerability_reasoning,
              win_pick_pp, win_pick_name, win_pick_ml, win_pick_thesis,
              box_pps, conviction_reasoning
       FROM fable_candidates WHERE race_id = ANY($1) AND date = $2`,
      [raceIds, date]
    );

    // Get results
    const { rows: resultsRows } = await query(
      `SELECT res.race_id, res.win_payout, res.place_payout, res.exacta_payout,
              ew.post_position AS win_pp, hw.name AS win_horse,
              ep.post_position AS place_pp, hp.name AS place_horse,
              es.post_position AS show_pp, hs.name AS show_horse
       FROM results res
       LEFT JOIN entries ew ON ew.id = res.win_entry_id LEFT JOIN horses hw ON hw.id = ew.horse_id
       LEFT JOIN entries ep ON ep.id = res.place_entry_id LEFT JOIN horses hp ON hp.id = ep.horse_id
       LEFT JOIN entries es ON es.id = res.show_entry_id LEFT JOIN horses hs ON hs.id = es.horse_id
       WHERE res.race_id = ANY($1)`,
      [raceIds]
    );
    const results: Record<number, any> = {};
    for (const r of resultsRows) results[r.race_id] = r;

    // Get entries/field for each race
    const { rows: entriesRows } = await query(
      `SELECT e.race_id, e.post_position, h.name AS horse_name, e.morning_line_odds,
              e.running_style, e.best_beyer, e.last_beyer, e.scratched
       FROM entries e JOIN horses h ON h.id = e.horse_id
       WHERE e.race_id = ANY($1)
       ORDER BY e.race_id, e.post_position`,
      [raceIds]
    );
    const entries: Record<number, any[]> = {};
    for (const e of entriesRows) {
      if (!entries[e.race_id]) entries[e.race_id] = [];
      entries[e.race_id].push(e);
    }

    // Build deterministic map by race_id
    const deterministic: Record<number, any> = {};
    for (const d of detRows) deterministic[d.race_id] = d;

    // Build fable map by race_id
    const fable: Record<number, any> = {};
    for (const f of fableRows) fable[f.race_id] = f;

    return res.status(200).json({ races, deterministic, fable, results, entries });
  } catch (err: any) {
    console.error('track-card error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
