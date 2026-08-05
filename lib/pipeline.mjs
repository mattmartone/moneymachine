import { query } from './db.mjs';
import { pullRacingAPI, pullResults } from './racing_api_pull.mjs';
import { scoreDate, tagCommission } from './scoring.mjs';
import { writeTheories } from './theory-writer.mjs';
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
  await notify(`⚙️ Pipeline starting for ${date}...`);

  try {
    // Step 1: Racing API enrichment
    await notify(`📡 Pulling Racing API — ML odds, post times, scratches...`);
    const apiResult = await pullRacingAPI(date);
    await notify(`✅ Racing API complete: ${apiResult.meets} tracks, ${apiResult.updated} entries enriched.`);

    // Step 2: Score
    await notify(`🧮 Scoring all races...`);
    const scoreResult = await scoreDate(date);
    if (scoreResult.alreadyScored) {
      await notify(`ℹ️ Already scored (${scoreResult.count} candidates). Skipping to Commission.`);
    } else {
      await notify(`✅ Scoring complete: ${scoreResult.total} races evaluated. ${scoreResult.commission || 0} HIGH conviction.`);
    }

    // Step 3: Tag Commission (runs if scorer produced results OR was already scored)
    let commissionResult = { tagged: 0 };
    if (scoreResult.alreadyScored || scoreResult.commission > 0 || scoreResult.scored > 0) {
      await notify(`🏆 Tagging top Commission picks...`);
      commissionResult = await tagCommission(date);
      await notify(`✅ ${commissionResult.tagged} Commission races tagged.`);

      // Step 4: Write theories (Claude-powered, plain English)
      await notify(`📝 Writing race theories...`);
      const theoryResult = await writeTheories(date);
      await notify(`✅ ${theoryResult.written} theories written and published.`);
    } else {
      await notify(`⚠️ No HIGH conviction races found for ${date}. Nothing to publish.`);
    }

    // Final summary
    const summary = `🏇 *Pipeline complete for ${date}*\n• ${apiResult.meets} tracks enriched\n• ${scoreResult.total || scoreResult.count || 0} races scored\n• ${commissionResult.tagged} Commission picks live on site`;
    console.log(`[PIPELINE] Done for ${date}`);
    await notify(summary);

    return { date, apiResult, scoreResult, commissionResult };
  } catch (err) {
    const errMsg = `❌ Pipeline FAILED for ${date}: ${err.message}`;
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
