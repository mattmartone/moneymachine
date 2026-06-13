import { query } from '../db.js';

const API_USER = 'DPoVaGs2XRopMmiHUcJDkHtC';
const API_PASS = 'YQJDPUITg7LCEP0Ascpu5t1S';
const BASE_URL = 'https://api.theracingapi.com/v1/north-america';
const RESEND_KEY = 're_L3cnNm7K_6Fu7rVh8Num5gULJemTdoK9y';
const MATT_EMAIL = 'mwmartone@gmail.com';

const MEET_IDS: Record<string, string> = {
  CD: 'CD_1781308800000',
  BAQ: 'BAQ_1781308800000',
  GP: 'GP_1781308800000',
};

const COMMISSION_RACES = [
  { race_id: 488, track_api: 'SA', race_number: 8, track_name: 'Santa Anita' },
  { race_id: 489, track_api: 'SA', race_number: 9, track_name: 'Santa Anita' },
  { race_id: 491, track_api: 'SA', race_number: 11, track_name: 'Santa Anita' },
  { race_id: 458, track_api: 'BAQ', race_number: 10, track_name: 'Belmont' },
  { race_id: 445, track_api: 'CD', race_number: 8, track_name: 'Churchill' },
  { race_id: 463, track_api: 'GP', race_number: 4, track_name: 'Gulfstream' },
];

async function apiFetch(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Authorization': 'Basic ' + Buffer.from(`${API_USER}:${API_PASS}`).toString('base64') }
  });
  return res.json();
}

async function sendEmail(subject: string, html: string) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Fade the Chalk <noreply@org64.com>',
      to: [MATT_EMAIL],
      subject,
      html
    })
  });
}

async function checkResults(trackName: string, raceNumber: number) {
  const trackSlug = trackName.toLowerCase().replace(/ /g, '-').replace('belmont at the big a', 'belmont-park');
  const url = `https://entries.horseracingnation.com/entries-results/${trackSlug}/2026-06-13`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();
    if (text.includes(`Race ${raceNumber}`) && text.includes('Position')) {
      return `Results may be available at ${url}`;
    }
  } catch {}
  return null;
}

export default async function handler(req: any, res: any) {
  // Verify this is a cron call (Vercel sends this header)
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const now = new Date();
  const etHour = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' })).getHours();

  // Only run between 10 AM and 10 PM ET
  if (etHour < 10 || etHour >= 22) {
    return res.status(200).json({ message: 'Outside operating hours (10AM-10PM ET)' });
  }

  const isHourlySummary = now.getMinutes() < 10;
  const changes: string[] = [];
  const statuses: string[] = [];

  for (const commRace of COMMISSION_RACES) {
    const { race_id, track_api, race_number, track_name } = commRace;

    // SA doesn't have API meet — try results only
    if (!MEET_IDS[track_api]) {
      const resultCheck = await checkResults(track_name, race_number);
      statuses.push(`${track_name} R${race_number}: no live API${resultCheck ? ' — RESULTS AVAILABLE' : ''}`);
      if (resultCheck) changes.push(`🏁 ${track_name} R${race_number}: ${resultCheck}`);
      continue;
    }

    const meetId = MEET_IDS[track_api];
    let data: any;
    try {
      data = await apiFetch(`/meets/${meetId}/entries`);
    } catch {
      statuses.push(`${track_name} R${race_number}: API error`);
      continue;
    }

    const races = data.races || [];
    const race = races.find((r: any) => parseInt(r.race_key?.race_number) === race_number);

    if (!race) {
      statuses.push(`${track_name} R${race_number}: not found in API`);
      continue;
    }

    const runners = (race.runners || []).map((r: any) => ({
      name: (r.horse_name || '').toUpperCase(),
      post_pos: parseInt(r.post_pos) || null,
      ml: r.morning_line_odds || null,
      live: r.live_odds || null,
      scratched: r.scratch_indicator === 'Y',
    }));

    // Get previous check from DB
    const prev = await query(
      `SELECT horse_name, live_odds, scratched FROM odds_tracking
       WHERE race_id = $1 AND checked_at > NOW() - INTERVAL '15 minutes'
       ORDER BY checked_at DESC`,
      [race_id]
    );
    const prevMap = new Map(prev.rows.map((r: any) => [r.horse_name, r]));

    // Store current
    for (const runner of runners) {
      await query(
        `INSERT INTO odds_tracking (race_id, horse_name, post_position, morning_line_odds, live_odds, scratched)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [race_id, runner.name, runner.post_pos, runner.ml, runner.live, runner.scratched]
      );

      // Detect changes
      const previous = prevMap.get(runner.name);
      if (previous) {
        if (runner.live && previous.live_odds && runner.live !== previous.live_odds) {
          changes.push(`📊 ${track_name} R${race_number}: ${runner.name} odds ${previous.live_odds} → ${runner.live}`);
        }
        if (runner.scratched && !previous.scratched) {
          changes.push(`❌ ${track_name} R${race_number}: ${runner.name} SCRATCHED`);
        }
      } else if (runner.live && runner.ml && runner.live !== runner.ml) {
        changes.push(`📊 ${track_name} R${race_number}: ${runner.name} ML=${runner.ml} → Live=${runner.live}`);
      }

      // Update entries with live odds
      if (runner.live) {
        await query(
          `UPDATE entries SET live_odds = $1 WHERE race_id = $2 AND post_position = $3`,
          [runner.live, race_id, runner.post_pos]
        );
      }
    }

    const liveCount = runners.filter((r: any) => r.live).length;
    const scratchCount = runners.filter((r: any) => r.scratched).length;
    statuses.push(`${track_name} R${race_number}: ${runners.length}h, ${liveCount} live, ${scratchCount} scr`);

    // Check for results
    const resultCheck = await checkResults(track_name, race_number);
    if (resultCheck) {
      changes.push(`🏁 ${track_name} R${race_number}: ${resultCheck}`);
    }
  }

  // Alert on changes
  if (changes.length > 0) {
    await sendEmail(
      `⚡ FTC: ${changes.length} change${changes.length > 1 ? 's' : ''} on Commission races`,
      `<div style="font-family: monospace; padding: 16px;">
        <h2 style="color: #c00;">Alert — ${now.toLocaleTimeString('en-US', { timeZone: 'America/New_York' })} ET</h2>
        <ul>${changes.map(c => `<li>${c}</li>`).join('')}</ul>
        <p style="color: #666;">Review and adjust bets if needed.</p>
      </div>`
    );
  }

  // Hourly summary
  if (isHourlySummary) {
    await sendEmail(
      `FTC Monitor: ${etHour}:00 ET — ${changes.length} changes`,
      `<div style="font-family: monospace; padding: 16px;">
        <h2>Hourly Status</h2>
        <ul>${statuses.map(s => `<li>${s}</li>`).join('')}</ul>
        ${changes.length > 0 ? `<h3>Changes:</h3><ul>${changes.map(c => `<li>${c}</li>`).join('')}</ul>` : '<p>No changes.</p>'}
        <p style="color: #666; font-size: 12px;">Running every 10 min until 10 PM ET.</p>
      </div>`
    );
  }

  return res.status(200).json({
    time: now.toISOString(),
    statuses,
    changes,
    hourly_sent: isHourlySummary
  });
}
