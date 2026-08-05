import { pool, query } from './db.mjs';
import { RaceTracer, generateRunId, distanceToYards } from './trace_lib.mjs';
import { writeScoredCandidate } from './scored_candidates_lib.mjs';

// Re-export everything the pipeline needs
export { pool, query, RaceTracer, generateRunId, distanceToYards, writeScoredCandidate };

/**
 * Score all races for a given date.
 * This is the Street Boss adaptation of site_new/score_with_trace.mjs.
 * The actual scoring logic lives in the scorer file — this is the orchestrator.
 */
export async function scoreDate(date) {
  // For now, delegate to the local scorer via direct import
  // TODO: port full scoreRace() function here
  // This placeholder confirms the pipeline wiring works
  console.log(`[SCORING] Starting score for ${date}...`);
  
  const { rows: races } = await pool.query(`
    SELECT id, track, race_number, distance, surface, field_size
    FROM races WHERE date = $1 AND (qualified = true OR qualified IS NULL)
    ORDER BY track, race_number
  `, [date]);
  
  console.log(`[SCORING] Found ${races.length} races to evaluate`);
  
  // Check if already scored
  const { rows: [existing] } = await pool.query(
    `SELECT count(*) as c FROM scored_candidates WHERE date = $1`,
    [date]
  );
  
  if (parseInt(existing.c) > 0) {
    console.log(`[SCORING] Already scored (${existing.c} candidates). Skipping.`);
    return { alreadyScored: true, count: parseInt(existing.c) };
  }
  
  // TODO: Full scoring implementation will be ported here
  // For now, return race count for pipeline testing
  return { races: races.length, scored: false, message: 'Scoring not yet ported — run locally' };
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
  }
  
  console.log(`[COMMISSION] Tagged ${rows.length} races as Commission for ${date}`);
  return { tagged: rows.length, races: rows.map(r => r.race_id) };
}
