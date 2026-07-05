import { pool, query } from './db.mjs';
import { notify } from './notify.mjs';

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

  // Get meets for today
  const meetsData = await apiFetch(`/meets?start_date=${date}&end_date=${date}`);
  const meets = meetsData?.meets || [];

  for (const race of commissionRaces) {
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

      // Post to Slack
      const emoji = verdict === 'DROP' ? '🚨' : verdict === 'BET STANDS' ? '✅' : '⚠️';
      await notify(
        `${emoji} Scratch Alert — ${race.track} R${race.race_number}`,
        reasoning,
        `Verdict: ${verdict}. Awaiting confirmation.`
      );
    }
  }
}
