import { pool, query } from './db.mjs';
import { runScorer } from './score_engine.mjs';

/**
 * Score all races for a given date using the full scoring engine.
 */
export async function scoreDate(date) {
  console.log(`[SCORING] Starting score for ${date}...`);

  // Check if already scored
  const { rows: [existing] } = await pool.query(
    `SELECT count(*) as c FROM scored_candidates WHERE date = $1`,
    [date]
  );
  
  if (parseInt(existing.c) > 0) {
    console.log(`[SCORING] Already scored (${existing.c} candidates). Skipping.`);
    return { alreadyScored: true, count: parseInt(existing.c) };
  }

  // Run the full scoring engine
  const result = await runScorer(date);
  return result;
}

/**
 * Tag top 10 HIGH conviction candidates as COMMISSION
 */
export async function tagCommission(date) {
  const { rows } = await pool.query(`
    SELECT id, race_id, composite_score 
    FROM scored_candidates 
    WHERE date = $1 AND conviction = 'HIGH' AND status = 'scored'
    ORDER BY composite_score DESC
    LIMIT 10
  `, [date]);
  
  if (rows.length === 0) {
    console.log(`[COMMISSION] No HIGH conviction candidates for ${date}`);
    return { tagged: 0 };
  }
  
  const raceIds = rows.map(r => r.race_id);
  
  // Clear existing commission bets for this date
  await pool.query(`
    DELETE FROM strategy_activations WHERE bet_id IN (
      SELECT id FROM bets WHERE race_id = ANY($1)
    )`, [raceIds]);
  await pool.query(`DELETE FROM bets WHERE race_id = ANY($1)`, [raceIds]);
  
  // Write place + exacta bets for each Commission race
  for (const sc of rows) {
    const candidate = await pool.query(`SELECT * FROM scored_candidates WHERE id = $1`, [sc.id]);
    const c = candidate.rows[0];
    if (!c) continue;
    
    const placeStake = 25;
    const exactaStake = 60;
    const winPickPP = c.win_pick_pp ? [String(c.win_pick_pp)] : [];
    const boxPPs = c.box_pps || [];
    
    // Place bet
    if (winPickPP.length > 0) {
      await pool.query(
        `INSERT INTO bets (race_id, bet_type, entries_used, stake, conviction, doubled) VALUES ($1, $2, $3, $4, $5, $6)`,
        [c.race_id, 'place', winPickPP, placeStake, 'COMMISSION', false]
      );
    }
    
    // Exacta bet
    if (boxPPs.length > 0) {
      const maxBox = boxPPs.slice(0, 4).map(String);
      await pool.query(
        `INSERT INTO bets (race_id, bet_type, entries_used, stake, conviction, doubled) VALUES ($1, $2, $3, $4, $5, $6)`,
        [c.race_id, 'exacta', maxBox, exactaStake, 'COMMISSION', false]
      );
    }
    
    // Win bet ($0 — we don't bet win on pace duels)
    await pool.query(
      `INSERT INTO bets (race_id, bet_type, entries_used, stake, conviction, doubled) VALUES ($1, $2, $3, $4, $5, $6)`,
      [c.race_id, 'win', winPickPP, 0, 'COMMISSION', false]
    );
    
    // Write race theory
    if (c.race_theory) {
      await pool.query(`UPDATE races SET race_theory = $1 WHERE id = $2`, [c.race_theory, c.race_id]);
    }

    // Tag strategy activations with reasoning
    const betRows = await pool.query(`SELECT id FROM bets WHERE race_id = $1 AND conviction = 'COMMISSION'`, [c.race_id]);
    const strategyMap = [
      { signal: c.s1_fired, id: 6, reasoning: `${c.win_pick_name} at ${c.win_pick_ml} with a top jockey aboard. Elite rider wouldn't take a longshot mount without confidence.` },
      { signal: c.s4_fired, id: 3, reasoning: `${c.win_pick_name} has a speed figure of ${c.win_pick_beyer} at this distance — at or near the field ceiling. The horse has proven it can run this fast here.` },
      { signal: c.s5_fired, id: 10, reasoning: `${c.win_pick_name} is stretching out to a longer distance for the first time. Pedigree and running style suggest they'll improve with more ground.` },
      { signal: c.s6_fired, id: 7, reasoning: `${c.win_pick_name} ran the highest speed figure in their most recent race (${c.win_pick_beyer}). They're in peak current form — not relying on an old number.` },
      { signal: c.s9_fired, id: 4, reasoning: `${c.win_pick_name} has the best speed figure at today's exact distance. They've proven they handle this trip better than anyone else in the field.` },
      { signal: c.fave_vulnerable, id: 1, reasoning: `${c.fave_name} (${c.fave_style} style) is vulnerable: ${c.vulnerability_reason}. The public is overvaluing a horse set up to fail.` },
      { signal: true, id: 33, reasoning: `Exacta box built from the top speed figures in the field. The fastest horses finish in the money most often — we capture them all.` },
    ];
    const firedStrategies = strategyMap.filter(s => s.signal);

    for (const bet of betRows.rows) {
      for (const strat of firedStrategies) {
        await pool.query(
          `INSERT INTO strategy_activations (bet_id, strategy_id, reasoning) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [bet.id, strat.id, strat.reasoning]
        ).catch(() => {});
      }
    }
  }

  console.log(`[COMMISSION] Tagged ${rows.length} races as Commission for ${date}`);
  return { tagged: rows.length, races: rows.map(r => r.race_id) };
}
