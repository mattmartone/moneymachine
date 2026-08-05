import { pool, query } from './db.mjs';

const API_USER = process.env.RACING_API_USER;
const API_PASS = process.env.RACING_API_PASS;
const BASE_URL = 'https://api.theracingapi.com/v1/north-america';

async function apiFetch(path) {
  const auth = Buffer.from(`${API_USER}:${API_PASS}`).toString('base64');
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Authorization': `Basic ${auth}` }
  });
  if (!res.ok) throw new Error(`Racing API ${res.status}: ${path}`);
  return res.json();
}

const TARGET_TRACKS = ['SAR', 'GP', 'PRM', 'CBY', 'DEL', 'EMD', 'MTH', 'ELP', 'CNL', 'DMR', 'IND'];

export async function pullRacingAPI(date) {
  console.log(`[RACING API] Pulling data for ${date}...`);
  
  const meetsData = await apiFetch(`/meets?start_date=${date}&end_date=${date}`);
  const meets = (meetsData.meets || []).filter(m => TARGET_TRACKS.includes(m.track_id));
  
  if (meets.length === 0) {
    console.log(`[RACING API] No target track meets for ${date}`);
    return { meets: 0, updated: 0 };
  }
  
  console.log(`[RACING API] Found ${meets.length} target meets: ${meets.map(m => m.track_name).join(', ')}`);
  
  let totalUpdated = 0;
  
  for (const meet of meets) {
    try {
      const entriesData = await apiFetch(`/meets/${meet.meet_id}/entries`);
      const races = entriesData.races || [];
      
      for (const race of races) {
        const runners = race.runners || [];
        for (const runner of runners) {
          // Update morning line odds, jockey, trainer, scratch status
          const pp = runner.post_pos || runner.program_number_stripped;
          if (!pp) continue;
          
          const updates = [];
          const values = [];
          let paramIdx = 1;
          
          if (runner.morning_line_odds) {
            updates.push(`morning_line_odds = $${paramIdx++}`);
            values.push(runner.morning_line_odds);
          }
          if (runner.jockey?.alias) {
            updates.push(`jockey = $${paramIdx++}`);
            values.push(runner.jockey.alias);
          }
          if (runner.trainer?.alias || (runner.trainer?.last_name)) {
            const trainerName = runner.trainer.alias || `${runner.trainer.last_name} ${runner.trainer.first_name_initial || ''}`.trim();
            updates.push(`trainer = $${paramIdx++}`);
            values.push(trainerName);
          }
          if (runner.scratch_indicator === 'Y') {
            updates.push(`scratched = $${paramIdx++}`);
            values.push(true);
          }
          
          if (updates.length > 0) {
            // Find the entry by track + date + post position
            const raceRow = await pool.query(
              `SELECT r.id FROM races r WHERE r.track = $1 AND r.date = $2 AND r.race_number = $3`,
              [meet.track_name, date, races.indexOf(race) + 1]
            );
            
            if (raceRow.rows.length > 0) {
              const raceId = raceRow.rows[0].id;
              values.push(raceId, parseInt(pp));
              await pool.query(
                `UPDATE entries SET ${updates.join(', ')} WHERE race_id = $${paramIdx++} AND post_position = $${paramIdx}`,
                values
              );
              totalUpdated++;
            }
          }
        }
      }
      
      console.log(`[RACING API] ${meet.track_name}: ${races.length} races processed`);
    } catch (err) {
      console.error(`[RACING API] Error processing ${meet.track_name}:`, err.message);
    }
  }
  
  console.log(`[RACING API] Done. ${totalUpdated} entries updated.`);
  return { meets: meets.length, updated: totalUpdated };
}

export async function pullResults(date) {
  console.log(`[RESULTS] Pulling results for ${date}...`);
  
  const meetsData = await apiFetch(`/meets?start_date=${date}&end_date=${date}`);
  const meets = (meetsData.meets || []).filter(m => TARGET_TRACKS.includes(m.track_id));
  
  let settled = 0;
  
  for (const meet of meets) {
    try {
      const resultsData = await apiFetch(`/meets/${meet.meet_id}/results`);
      const races = resultsData.races || [];
      
      for (let i = 0; i < races.length; i++) {
        const race = races[i];
        const runners = race.runners || [];
        if (runners.length < 2) continue;
        
        const raceNum = i + 1;
        const raceRow = await pool.query(
          `SELECT r.id FROM races r WHERE r.track = $1 AND r.date = $2 AND r.race_number = $3`,
          [meet.track_name, date, raceNum]
        );
        if (raceRow.rows.length === 0) continue;
        const raceId = raceRow.rows[0].id;
        
        // Check if already settled
        const existing = await pool.query(`SELECT id FROM results WHERE race_id = $1`, [raceId]);
        if (existing.rows.length > 0) continue;
        
        // Get entry IDs for top 3 finishers
        const winner = runners[0];
        const placer = runners[1];
        const shower = runners[2];
        
        const getEntryId = async (pp) => {
          const r = await pool.query(`SELECT id FROM entries WHERE race_id = $1 AND post_position = $2`, [raceId, parseInt(pp)]);
          return r.rows[0]?.id || null;
        };
        
        const winEntryId = await getEntryId(winner.program_number_stripped || winner.program_number);
        const placeEntryId = await getEntryId(placer.program_number_stripped || placer.program_number);
        const showEntryId = shower ? await getEntryId(shower.program_number_stripped || shower.program_number) : null;
        
        if (!winEntryId) continue;
        
        await pool.query(`
          INSERT INTO results (race_id, win_entry_id, place_entry_id, show_entry_id, win_payout, place_payout, exacta_payout)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (race_id) DO NOTHING
        `, [
          raceId, winEntryId, placeEntryId, showEntryId,
          winner.win_payoff || null,
          winner.place_payoff || null,
          null // exacta payout not in runner data — would need wager_types
        ]);
        
        settled++;
      }
    } catch (err) {
      console.error(`[RESULTS] Error for ${meet.track_name}:`, err.message);
    }
  }
  
  console.log(`[RESULTS] Settled ${settled} races for ${date}`);
  return { settled };
}
