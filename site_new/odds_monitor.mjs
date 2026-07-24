import pg from 'pg';
const { Pool } = pg;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const pool = new Pool({
  connectionString: 'postgres://postgres.bazvhjajajkpkqqvyelg:LMczMTBYFGH6w9yn@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: true
});

const API_USER = 'Vy3tbvnI66ZOQKUBdokAI7FY';
const API_PASS = 'mkuaEi2qrgZpraYMoLj3a6fg';
const BASE_URL = 'https://api.theracingapi.com/v1/north-america';
const RESEND_KEY = 're_L3cnNm7K_6Fu7rVh8Num5gULJemTdoK9y';
const MATT_EMAIL = 'mwmartone@gmail.com';

const COMMISSION_RACES = [
  { race_id: 488, track_api: 'SA', race_number: 8, track_name: 'Santa Anita' },
  { race_id: 489, track_api: 'SA', race_number: 9, track_name: 'Santa Anita' },
  { race_id: 491, track_api: 'SA', race_number: 11, track_name: 'Santa Anita' },
  { race_id: 458, track_api: 'BAQ', race_number: 10, track_name: 'Belmont' },
  { race_id: 445, track_api: 'CD', race_number: 8, track_name: 'Churchill' },
  { race_id: 463, track_api: 'GP', race_number: 4, track_name: 'Gulfstream' },
];

const MEET_IDS = {
  CD: 'CD_1781308800000',
  BAQ: 'BAQ_1781308800000',
  GP: 'GP_1781308800000',
};

async function apiFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Authorization': 'Basic ' + Buffer.from(`${API_USER}:${API_PASS}`).toString('base64') }
  });
  return res.json();
}

async function sendEmail(subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Fade the Chalk <noreply@org64.com>',
      to: [MATT_EMAIL],
      subject,
      html
    })
  });
  const data = await res.json();
  return data;
}

async function checkRace(commRace) {
  const { race_id, track_api, race_number, track_name } = commRace;

  // SA doesn't have a meet ID in the Racing API — skip API check, return null
  if (!MEET_IDS[track_api]) return { race_id, track_name, race_number, runners: null, source: 'no_api' };

  const meetId = MEET_IDS[track_api];
  const data = await apiFetch(`/meets/${meetId}/entries`);
  const races = data.races || [];
  const race = races.find(r => parseInt(r.race_key?.race_number) === race_number);

  if (!race) return { race_id, track_name, race_number, runners: null, source: 'not_found' };

  const runners = (race.runners || []).map(r => ({
    name: r.horse_name?.toUpperCase(),
    post_pos: parseInt(r.post_pos) || null,
    ml: r.morning_line_odds || null,
    live: r.live_odds || null,
    scratched: r.scratch_indicator === 'Y',
  }));

  return { race_id, track_name, race_number, runners, source: 'api' };
}

async function run() {
  const now = new Date();
  const hour = now.getHours();
  const isHourlySummary = now.getMinutes() < 10; // First run of each hour

  console.log(`[${now.toLocaleTimeString()}] Odds monitor running...`);

  const changes = [];
  const statuses = [];

  for (const commRace of COMMISSION_RACES) {
    const result = await checkRace(commRace);

    if (!result.runners) {
      statuses.push(`${result.track_name} R${result.race_number}: ${result.source}`);
      continue;
    }

    // Get previous check from DB
    const prev = await pool.query(
      `SELECT horse_name, live_odds, scratched FROM odds_tracking
       WHERE race_id = $1
       ORDER BY checked_at DESC
       LIMIT 20`,
      [result.race_id]
    );
    const prevMap = new Map(prev.rows.map(r => [r.horse_name, r]));

    // Store current odds
    for (const runner of result.runners) {
      await pool.query(
        `INSERT INTO odds_tracking (race_id, horse_name, post_position, morning_line_odds, live_odds, scratched)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [result.race_id, runner.name, runner.post_pos, runner.ml, runner.live, runner.scratched]
      );

      // Check for changes
      const previous = prevMap.get(runner.name);
      if (previous) {
        if (runner.live && previous.live_odds && runner.live !== previous.live_odds) {
          changes.push(`📊 ${result.track_name} R${result.race_number}: ${runner.name} odds moved ${previous.live_odds} → ${runner.live}`);
        }
        if (runner.scratched && !previous.scratched) {
          changes.push(`❌ ${result.track_name} R${result.race_number}: ${runner.name} SCRATCHED`);
        }
      } else if (runner.live && runner.ml && runner.live !== runner.ml) {
        // First time seeing live odds different from ML
        changes.push(`📊 ${result.track_name} R${result.race_number}: ${runner.name} ML=${runner.ml} → Live=${runner.live}`);
      }
    }

    const liveCount = result.runners.filter(r => r.live).length;
    const scratchCount = result.runners.filter(r => r.scratched).length;
    statuses.push(`${result.track_name} R${result.race_number}: ${result.runners.length} runners, ${liveCount} with live odds, ${scratchCount} scratched`);

    // Update entries table with live odds
    for (const runner of result.runners) {
      if (runner.live) {
        await pool.query(
          `UPDATE entries SET live_odds = $1 WHERE race_id = $2 AND post_position = $3`,
          [runner.live, result.race_id, runner.post_pos]
        );
      }
    }
  }

  // Send alert if changes detected
  if (changes.length > 0) {
    const subject = `⚡ FTC ALERT: ${changes.length} change${changes.length > 1 ? 's' : ''} on Commission races`;
    const html = `
      <div style="font-family: monospace; padding: 16px;">
        <h2 style="color: #c00;">Odds/Scratch Alert</h2>
        <p>${now.toLocaleTimeString()} ET</p>
        <ul>${changes.map(c => `<li>${c}</li>`).join('')}</ul>
        <hr>
        <p style="color: #666; font-size: 12px;">This may impact our bets. Review and adjust if needed.</p>
      </div>
    `;
    await sendEmail(subject, html);
    console.log(`  ALERT SENT: ${changes.length} changes`);
  }

  // Hourly summary
  if (isHourlySummary) {
    const subject = `FTC Monitor: ${hour}:00 ET — ${changes.length} changes`;
    const html = `
      <div style="font-family: monospace; padding: 16px;">
        <h2>Hourly Status — ${now.toLocaleTimeString()} ET</h2>
        <h3>Commission Races:</h3>
        <ul>${statuses.map(s => `<li>${s}</li>`).join('')}</ul>
        ${changes.length > 0 ? `<h3>Changes this cycle:</h3><ul>${changes.map(c => `<li>${c}</li>`).join('')}</ul>` : '<p>No changes detected.</p>'}
        <hr>
        <p style="color: #666; font-size: 12px;">Monitor running every 10 min. Stops at 10 PM ET.</p>
      </div>
    `;
    await sendEmail(subject, html);
    console.log(`  HOURLY SUMMARY SENT`);
  }

  console.log(`  Status: ${statuses.join(' | ')}`);
  console.log(`  Changes: ${changes.length > 0 ? changes.join(', ') : 'none'}`);

  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
