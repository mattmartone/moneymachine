import { pool, query } from './db.mjs';
import { notify } from './notify.mjs';

const TARGET_TRACKS = ['Saratoga', 'Canterbury Park', 'Delaware Park', 'Gulfstream Park',
  'Horseshoe Indianapolis', 'Monmouth Park', 'Prairie Meadows', 'Churchill Downs', 'Laurel Park'];

const API_USER = process.env.RACING_API_USER;
const API_PASS = process.env.RACING_API_PASS;
const BASE_URL = 'https://api.theracingapi.com/v1/north-america';

async function apiFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Authorization': 'Basic ' + Buffer.from(`${API_USER}:${API_PASS}`).toString('base64') }
  });
  if (!res.ok) return null;
  return res.json();
}

export async function checkScratches(date) {
  // Get today's Commission races
  const commissionRaces = await query(`
    SELECT DISTINCT r.id, r.track, r.race_number, r.post_time,
      sc.win_pick_pp, sc.win_pick_name, sc.fave_pp, sc.fave_name, sc.fave_style,
      sc.pace_scenario, sc.box_pps, sc.vulnerability_reason
    FROM bets b
    JOIN races r ON r.id = b.race_id
    JOIN scored_candidates sc ON sc.race_id = r.id
    WHERE r.date = $1 AND b.conviction = 'COMMISSION'
  `, [date]);

  if (!commissionRaces.length) return;

  // Only monitor target tracks
  const filtered = commissionRaces.filter(r => TARGET_TRACKS.includes(r.track));
  if (!filtered.length) return;

  // Get meets for today
  const meetsData = await apiFetch(`/meets?start_date=${date}&end_date=${date}`);
  const meets = meetsData?.meets || [];

  for (const race of filtered) {
    // Find the meet for this track
    const meet = meets.find(m => m.track_name === race.track || m.track_id === race.track);
    if (!meet) continue;

    const entriesData = await apiFetch(`/meets/${meet.meet_id}/entries`);
    if (!entriesData?.races) continue;

    const apiRace = entriesData.races.find(r => parseInt(r.race_key?.race_number) === race.race_number);
    if (!apiRace) continue;

    // Check for new scratches
    const scratches = (apiRace.runners || []).filter(r => r.scratch_indicator === 'Y');

    for (const scratch of scratches) {
      const pp = parseInt(scratch.program_number);
      if (isNaN(pp)) continue;

      // Check if already marked in DB
      const existing = await query(
        'SELECT scratched FROM entries WHERE race_id = $1 AND post_position = $2',
        [race.id, pp]
      );
      if (existing[0]?.scratched) continue; // Already known

      // Mark scratched in DB
      await pool.query(
        'UPDATE entries SET scratched = true WHERE race_id = $1 AND post_position = $2',
        [race.id, pp]
      );

      // Determine impact
      const horseName = scratch.horse_name || `PP${pp}`;
      let verdict, reasoning;

      if (pp === race.win_pick_pp) {
        // WIN PICK SCRATCHED — DROP
        verdict = 'DROP';
        reasoning = `Win pick ${race.win_pick_name} (PP${pp}) scratched. Thesis dead. No bet.`;
      } else if (race.box_pps && race.box_pps.includes(pp)) {
        // BOX HORSE SCRATCHED — BET STANDS, rebuild box
        verdict = 'BET STANDS';
        reasoning = `Box horse PP${pp} (${horseName}) scratched. Win pick ${race.win_pick_name} intact. Rebuild box from next best Beyer.`;
      } else if (pp === race.fave_pp) {
        // FAVORITE SCRATCHED — RE-ANALYZE
        // Check: is there still a vulnerable favorite?
        const liveEntries = await query(
          `SELECT e.post_position, e.running_style, e.morning_line_odds
           FROM entries e WHERE e.race_id = $1 AND (e.scratched IS NULL OR e.scratched = false)
           ORDER BY e.morning_line_odds`,
          [race.id]
        );

        // Find new fave (lowest ML among remaining)
        let newFave = null;
        let lowestOdds = Infinity;
        for (const e of liveEntries) {
          const ml = e.morning_line_odds;
          if (!ml) continue;
          const odds = ml.includes('/') ? parseInt(ml.split('/')[0]) / parseInt(ml.split('/')[1]) : parseFloat(ml);
          if (odds < lowestOdds) { lowestOdds = odds; newFave = e; }
        }

        if (newFave) {
          const eCount = liveEntries.filter(e => e.running_style === 'E').length;
          const newPaceScenario = eCount === 0 ? 'no_speed' : eCount === 1 ? 'lone_speed' : 'pace_duel';

          // Check if new fave is vulnerable
          let newVulnerable = false;
          if (newFave.running_style === 'E' && newPaceScenario === 'pace_duel') newVulnerable = true;
          if (['S', 'P'].includes(newFave.running_style) && newPaceScenario === 'lone_speed') newVulnerable = true;

          if (newVulnerable) {
            verdict = 'BET STANDS';
            reasoning = `Fav ${race.fave_name} scratched. New fav PP${newFave.post_position} (${newFave.running_style}) is STILL vulnerable in ${newPaceScenario}. Thesis transfers.`;
          } else {
            verdict = 'DROP';
            reasoning = `Fav ${race.fave_name} scratched. New fav PP${newFave.post_position} (${newFave.running_style}) is NOT vulnerable in ${newPaceScenario}. No one to fade.`;
          }
        } else {
          verdict = 'DROP';
          reasoning = `Fav ${race.fave_name} scratched. Cannot identify new favorite. No thesis.`;
        }
      } else {
        // IRRELEVANT SCRATCH
        verdict = 'BET STANDS';
        reasoning = `PP${pp} (${horseName}) scratched. Not our pick, not in box, not the fave. Immaterial.`;
      }

      // EXECUTE the verdict
      if (verdict === 'DROP') {
        // Set all bet stakes to 0 and mark as dropped
        await pool.query(
          `UPDATE bets SET stake = 0 WHERE race_id = $1 AND conviction = 'COMMISSION'`,
          [race.id]
        );
        await pool.query(
          `UPDATE races SET skip_reason = $1 WHERE id = $2`,
          [reasoning, race.id]
        );
        console.log(`[SCRATCH] DROPPED: ${race.track} R${race.race_number} — ${reasoning}`);
      } else if (verdict === 'BET STANDS' && race.box_pps && race.box_pps.includes(pp)) {
        // Box horse scratched — rebuild box from remaining entries by Beyer
        const liveEntries = await query(
          `SELECT e.post_position, e.best_beyer FROM entries e
           WHERE e.race_id = $1 AND (e.scratched IS NULL OR e.scratched = false)
           ORDER BY e.best_beyer DESC NULLS LAST`,
          [race.id]
        );
        const currentBox = race.box_pps.filter(p => p !== pp);
        // Find next best Beyer horse not already in box
        const candidate = liveEntries.find(e => !currentBox.includes(e.post_position));
        const newBox = candidate ? [...currentBox, candidate.post_position] : currentBox;
        const newBoxStr = newBox.slice(0, 4).map(String);

        await pool.query(
          `UPDATE bets SET entries_used = $1 WHERE race_id = $2 AND bet_type = 'exacta' AND conviction = 'COMMISSION'`,
          [newBoxStr, race.id]
        );
        console.log(`[SCRATCH] BOX REBUILT: ${race.track} R${race.race_number} — new box: ${newBoxStr.join(',')}`);
      }

      // Check field size after scratch — traffic trap requires 8+
      const liveField = await query(
        `SELECT count(*) as c FROM entries WHERE race_id = $1 AND (scratched IS NULL OR scratched = false)`,
        [race.id]
      );
      const fieldSize = parseInt(liveField[0]?.c || 0);
      if (fieldSize < 5) {
        // Hard rule: field below 5 = no bet
        await pool.query(`UPDATE bets SET stake = 0 WHERE race_id = $1 AND conviction = 'COMMISSION'`, [race.id]);
        await pool.query(`UPDATE races SET skip_reason = $1 WHERE id = $2`, [`Field dropped to ${fieldSize} after scratches — below minimum`, race.id]);
        verdict = 'DROP';
        reasoning = `Field dropped to ${fieldSize} — below 5-horse minimum. ${reasoning}`;
      } else if (fieldSize < 8 && race.vulnerability_reason && race.vulnerability_reason.startsWith('Trigger A')) {
        // Traffic trap requires 8+
        await pool.query(`UPDATE bets SET stake = 0 WHERE race_id = $1 AND conviction = 'COMMISSION'`, [race.id]);
        await pool.query(`UPDATE races SET skip_reason = $1 WHERE id = $2`, [`Field dropped to ${fieldSize} — traffic trap thesis requires 8+ horses`, race.id]);
        verdict = 'DROP';
        reasoning = `Traffic trap field dropped to ${fieldSize} (need 8+). ${reasoning}`;
      }

      // Check E-type count for pace duel thesis
      if (race.pace_scenario === 'pace_duel' && verdict !== 'DROP') {
        const eTypes = await query(
          `SELECT count(*) as c FROM entries WHERE race_id = $1 AND (scratched IS NULL OR scratched = false) AND running_style IN ('E', 'E/P')`,
          [race.id]
        );
        if (parseInt(eTypes[0]?.c || 0) < 2) {
          // Pace duel needs 2+ E-types
          await pool.query(`UPDATE bets SET stake = 0 WHERE race_id = $1 AND conviction = 'COMMISSION'`, [race.id]);
          await pool.query(`UPDATE races SET skip_reason = $1 WHERE id = $2`, ['Pace duel thesis dead — fewer than 2 E-types remain after scratches', race.id]);
          verdict = 'DROP';
          reasoning = `Pace duel dead (< 2 E-types after scratch). ${reasoning}`;
        }
      }

      // Log to changelog
      try {
        await pool.query(`
          INSERT INTO race_changelog (race_id, date, event_type, description, source)
          VALUES ($1, $2, $3, $4, 'street_boss')
        `, [race.id, date, verdict === 'DROP' ? 'race_dropped' : 'scratch_detected', reasoning]);
      } catch (e) { /* changelog table may not exist yet */ }

      // Post to Slack
      const emoji = verdict === 'DROP' ? '🚨' : '✅';
      await notify(
        `${emoji} Scratch — ${race.track} R${race.race_number}`,
        reasoning,
        `Verdict: ${verdict}. Executed.`
      );
    }
  }
}
