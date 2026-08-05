import { query } from './db.mjs';
import { pullRacingAPI, pullResults } from './racing_api_pull.mjs';
import { scoreDate, tagCommission } from './scoring.mjs';
import { notify } from './notify.mjs';

/**
 * Run the full pipeline for a given date:
 * 1. Pull Racing API (ML odds, post times, jockeys, scratches)
 * 2. Score all races
 * 3. Tag Commission (top 10 by composite)
 * 4. Notify Slack
 */
export async function runPipeline(date) {
  console.log(`\n[PIPELINE] ═══ Starting for ${date} ═══`);
  
  try {
    // Step 1: Racing API enrichment
    const apiResult = await pullRacingAPI(date);
    
    // Step 2: Score
    const scoreResult = await scoreDate(date);
    
    // Step 3: Tag Commission (runs if scorer produced results OR was already scored)
    let commissionResult = { tagged: 0 };
    if (scoreResult.alreadyScored || scoreResult.commission > 0 || scoreResult.scored > 0) {
      commissionResult = await tagCommission(date);
    }
    
    // Step 4: Notify
    const summary = `Pipeline complete for ${date}: ${apiResult.meets} tracks enriched, ${commissionResult.tagged} Commission races published.`;
    console.log(`[PIPELINE] ${summary}`);
    await notify(summary);
    
    return { date, apiResult, scoreResult, commissionResult };
  } catch (err) {
    const errMsg = `Pipeline FAILED for ${date}: ${err.message}`;
    console.error(`[PIPELINE] ${errMsg}`);
    await notify(errMsg);
    return { date, error: err.message };
  }
}

/**
 * Run pipeline for all dates that have races loaded but not yet scored
 */
export async function runPendingPipelines() {
  const rows = await query(`
    SELECT DISTINCT date FROM races
    WHERE date >= CURRENT_DATE
    AND date NOT IN (SELECT DISTINCT date FROM scored_candidates WHERE status = 'scored')
    ORDER BY date
  `);

  if (!rows || rows.length === 0) {
    console.log('[PIPELINE] No pending dates to process');
    return [];
  }

  console.log(`[PIPELINE] Found ${rows.length} pending dates: ${rows.map(r => r.date.toISOString().split('T')[0]).join(', ')}`);

  const results = [];
  for (const row of rows) {
    const dateStr = row.date.toISOString().split('T')[0];
    results.push(await runPipeline(dateStr));
  }
  return results;
}

/**
 * Settle results for today's races
 */
export async function settleToday() {
  const today = new Date().toISOString().split('T')[0];
  return await pullResults(today);
}
