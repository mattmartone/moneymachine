import { query } from '../db.js';

const API_USER = 'DPoVaGs2XRopMmiHUcJDkHtC';
const API_PASS = 'YQJDPUITg7LCEP0Ascpu5t1S';
const BASE_URL = 'https://api.theracingapi.com/v1/north-america';
const RESEND_KEY = 're_L3cnNm7K_6Fu7rVh8Num5gULJemTdoK9y';

const MEET_IDS: Record<string, string> = {
  BAQ: 'BAQ_1781395200000',
  GP: 'GP_1781395200000',
  LRL: 'LRL_1781395200000',
  MTH: 'MTH_1781395200000',
  SA: 'SA_1781395200000',
};

interface WatchedRace {
  track_api: string;
  track_name: string;
  race_number: number;
  product: string;
  favorite: string;
  win_pick: string;
  box: string[];
  post_time_et?: string;
}

const WATCHED_RACES: WatchedRace[] = [
  // Commission Picks (with estimated post times ET)
  { track_api: 'LRL', track_name: 'Laurel', race_number: 3, product: 'Commission Pick 1', favorite: 'BIG TANKNESS', win_pick: 'BUSHIDO', box: ['BUSHIDO', 'TALENTED MAN', 'BIG TANKNESS', 'CACTUS'], post_time_et: '13:25' },
  { track_api: 'BAQ', track_name: 'Belmont', race_number: 7, product: 'Commission Pick 2', favorite: "MOMENT'S NOTICE", win_pick: 'MOMENTUM FILES', box: ['MOMENTUM FILES', 'SALMING', "TOGA D'ORO", "MOMENT'S NOTICE"], post_time_et: '15:56' },
  { track_api: 'BAQ', track_name: 'Belmont', race_number: 5, product: 'Commission Pick 3', favorite: 'HARD CIRCLE', win_pick: 'HONG KONG PHOOEY', box: ['HARD CIRCLE', 'HONG KONG PHOOEY', 'TAKE A STANCE', 'RAGING SEA CAPTAIN'], post_time_et: '14:52' },
  { track_api: 'LRL', track_name: 'Laurel', race_number: 7, product: 'Commission Pick 4', favorite: 'ONLY FOR NOW', win_pick: 'NICHE', box: ['NICHE', 'JUST PHILTORED', 'GERRARDS CROSS', 'THE TOWN TEMPTER'], post_time_et: '15:25' },
  { track_api: 'BAQ', track_name: 'Belmont', race_number: 9, product: 'Commission Pick 5', favorite: 'OCEAN ATLANTIQUE', win_pick: 'FROSTED OVER', box: ['FROSTED OVER', 'DETERMINEDLY', 'PRESIDER', 'BRIGADIER GENERAL'], post_time_et: '16:56' },
  { track_api: 'GP', track_name: 'Gulfstream', race_number: 8, product: 'Commission Pick 6', favorite: 'GREAT VENEZUELA', win_pick: 'VINDICATE CHA CHA', box: ['VINDICATE CHA CHA', 'TIFFANY GOLD', "TREE C'S KAI", 'JOKES UP'], post_time_et: '15:47' },
  { track_api: 'BAQ', track_name: 'Belmont', race_number: 3, product: 'Commission Pick 7', favorite: 'EGYPTIAN', win_pick: 'DROP ME A DIME', box: ['DROP ME A DIME', 'EGYPTIAN', 'SOLO JIM', 'FIRST PITCH'], post_time_et: '13:56' },
  // Monmouth Park Race Day
  { track_api: 'MTH', track_name: 'Monmouth', race_number: 5, product: 'MTH Race Day', favorite: 'GROUCH', win_pick: 'LORD BERRIER', box: ['GROUCH', 'NATURAL HARBOR', 'LORD BERRIER', "CHARLIE'S EXPRESS"] },
  { track_api: 'MTH', track_name: 'Monmouth', race_number: 6, product: 'MTH Race Day', favorite: 'SINGALONG KAYLA', win_pick: 'CELESTIAL EXPRESS', box: ['CELESTIAL EXPRESS', 'SINGALONG KAYLA', 'PRINCESS GLADYS', "POSTINO'S PROPHECY"] },
  { track_api: 'MTH', track_name: 'Monmouth', race_number: 7, product: 'MTH Race Day', favorite: "ELSIE'S SMILE", win_pick: "CASSIE'S VAULT", box: ["CASSIE'S VAULT", 'TOASTTOTHESTONES', 'LADY KHOZ', "ELSIE'S SMILE"] },
  { track_api: 'MTH', track_name: 'Monmouth', race_number: 8, product: 'MTH Race Day', favorite: 'MAGNETO', win_pick: 'FIRST NAVY JACK', box: ['FIRST NAVY JACK', 'CHAOS COMIN', 'REDEMPTION SPEIGHT', "JOEVIA'S FIRST", 'MAGNETO'] },
  // Santa Anita Race Day Pass
  { track_api: 'SA', track_name: 'Santa Anita', race_number: 4, product: 'SA Race Day', favorite: 'CLEVER CLOVER', win_pick: 'DES DOIGTS', box: ['CLEVER CLOVER', 'DES DOIGTS', 'ZOMBO BOMBO', 'ONE SMOKIN DUDE'] },
  { track_api: 'SA', track_name: 'Santa Anita', race_number: 5, product: 'SA Race Day', favorite: "CAN'T SLEEP", win_pick: 'TAHINI', box: ['TAHINI', 'IMABOUTAGO', 'YOUNG LOVE', 'KUWAITYA', "CAN'T SLEEP"] },
  { track_api: 'SA', track_name: 'Santa Anita', race_number: 9, product: 'SA Race Day', favorite: 'GOLD PHOENIX', win_pick: 'POOR CONNECTION', box: ['POOR CONNECTION', 'AMERICAN HOPE', 'LIVING LIFE', 'RIMPROTECTOR', 'GOLD PHOENIX'] },
  { track_api: 'SA', track_name: 'Santa Anita', race_number: 11, product: 'SA Race Day', favorite: 'KIKURIDE', win_pick: 'MARS MAGIC', box: ['NO CAP', 'SHOCKING GREY', 'MARS MAGIC', 'CANTO DELLA TERRA', 'KIKURIDE'] },
  { track_api: 'SA', track_name: 'Santa Anita', race_number: 12, product: 'SA Race Day', favorite: 'KING STEPHEN', win_pick: 'PRIVATE GEM', box: ['SHAMROCK GLITTER', 'PRIVATE GEM', 'THE OLD NINE', 'GOLDEN ALE', 'KING STEPHEN'] },
];

async function apiFetch(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Authorization': 'Basic ' + Buffer.from(`${API_USER}:${API_PASS}`).toString('base64') }
  });
  return res.json();
}

async function sendEmailToAll(subject: string, html: string) {
  const users = await query(`SELECT email FROM users WHERE email IS NOT NULL`);
  const emails = users.rows.map((r: any) => r.email);

  for (const email of emails) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Fade the Chalk <noreply@org64.com>',
        to: [email],
        subject,
        html
      })
    });
  }
}

export default async function handler(req: any, res: any) {
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const now = new Date();
  const etHour = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' })).getHours();

  if (etHour < 11 || etHour >= 22) {
    return res.status(200).json({ message: 'Outside operating hours (11AM-10PM ET)' });
  }

  const alerts: string[] = [];

  for (const race of WATCHED_RACES) {
    const meetId = MEET_IDS[race.track_api];
    if (!meetId) continue;

    let data: any;
    try {
      data = await apiFetch(`/meets/${meetId}/entries`);
    } catch {
      continue;
    }

    const races = data.races || [];
    const apiRace = races.find((r: any) => parseInt(r.race_key?.race_number) === race.race_number);
    if (!apiRace) continue;

    const scratched = (apiRace.runners || [])
      .filter((r: any) => r.scratch_indicator === 'Y')
      .map((r: any) => (r.horse_name || '').toUpperCase());

    if (scratched.length === 0) continue;

    // Check if any scratched horse is in our box or is the favorite
    for (const scratchName of scratched) {
      const isFave = scratchName === race.favorite;
      const isWinPick = scratchName === race.win_pick;
      const isInBox = race.box.includes(scratchName);

      if (!isFave && !isInBox) continue;

      // Check if we already alerted on this scratch
      const existing = await query(
        `SELECT 1 FROM scratch_alerts WHERE track = $1 AND race_number = $2 AND horse_name = $3 AND date = CURRENT_DATE`,
        [race.track_name, race.race_number, scratchName]
      );
      if (existing.rows.length > 0) continue;

      // Record the alert
      await query(
        `INSERT INTO scratch_alerts (track, race_number, horse_name, date, is_favorite, is_win_pick, is_in_box)
         VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6)`,
        [race.track_name, race.race_number, scratchName, isFave, isWinPick, isInBox]
      );

      let impact = '';
      if (isWinPick) {
        impact = '🚨 OUR WIN PICK IS SCRATCHED — NO WIN BET THIS RACE';
      } else if (isFave) {
        impact = '⚠️ FAVORITE SCRATCHED — vulnerability thesis changes, pace map shifts';
      } else if (isInBox) {
        impact = '⚠️ BOX HORSE SCRATCHED — exotic box reduced, consider adjustment';
      }

      alerts.push(
        `<div style="border: 2px solid #c00; padding: 12px; margin-bottom: 12px; font-family: monospace;">
          <h3 style="margin:0; color: #c00;">❌ SCRATCH: ${scratchName}</h3>
          <p style="margin:4px 0;"><strong>${race.track_name} R${race.race_number}</strong> — ${race.product}</p>
          <p style="margin:4px 0;">${impact}</p>
          <p style="margin:4px 0; font-size: 12px; color: #666;">Win pick: ${race.win_pick} | Fave: ${race.favorite}</p>
          <p style="margin:4px 0; font-size: 12px; color: #666;">Box: ${race.box.join(', ')}</p>
        </div>`
      );
    }
  }

  // Pre-race alerts — 45 min before Commission races (only)
  const etNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const currentMinutes = etNow.getHours() * 60 + etNow.getMinutes();

  const commissionRaces = WATCHED_RACES.filter(r => r.product.startsWith('Commission'));
  for (const race of commissionRaces) {
    if (!race.post_time_et) continue;
    const [h, m] = race.post_time_et.split(':').map(Number);
    const postMinutes = h * 60 + m;
    const minutesUntilPost = postMinutes - currentMinutes;

    if (minutesUntilPost >= 35 && minutesUntilPost <= 45) {
      const existing = await query(
        `SELECT 1 FROM scratch_alerts WHERE track = $1 AND race_number = $2 AND horse_name = 'PRE_RACE_ALERT' AND date = CURRENT_DATE`,
        [race.track_name, race.race_number]
      );
      if (existing.rows.length === 0) {
        await query(
          `INSERT INTO scratch_alerts (track, race_number, horse_name, date, is_favorite, is_win_pick, is_in_box)
           VALUES ($1, $2, 'PRE_RACE_ALERT', CURRENT_DATE, false, false, false)`,
          [race.track_name, race.race_number]
        );

        const postFormatted = `${h > 12 ? h - 12 : h}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'} ET`;
        await sendEmailToAll(
          `⏰ ${race.track_name} R${race.race_number} posts in ~45 min — ${race.product}`,
          `<div style="font-family: monospace; padding: 16px; max-width: 600px;">
            <h2 style="color: #000080; margin-bottom: 4px;">⏰ PRE-RACE ALERT</h2>
            <p style="font-size: 18px; font-weight: bold;">${race.track_name} R${race.race_number} — ${race.product}</p>
            <p>Estimated post: <strong>${postFormatted}</strong></p>
            <div style="background: #ffffcc; border: 2px solid #000; padding: 12px; margin: 12px 0;">
              <p style="margin: 0;"><strong>Win pick:</strong> ${race.win_pick}</p>
              <p style="margin: 4px 0;"><strong>Fave:</strong> ${race.favorite}</p>
              <p style="margin: 4px 0;"><strong>Box:</strong> ${race.box.join(', ')}</p>
            </div>
            <p style="color: #666; font-size: 12px;">Check live odds now. Log in to review and adjust if needed.</p>
          </div>`
        );
      }
    }
  }

  if (alerts.length > 0) {
    const timeStr = now.toLocaleTimeString('en-US', { timeZone: 'America/New_York' });
    await sendEmailToAll(
      `🚨 FTC SCRATCH ALERT — ${alerts.length} horse${alerts.length > 1 ? 's' : ''} scratched from today's card`,
      `<div style="font-family: monospace; padding: 16px; max-width: 600px;">
        <h2 style="color: #c00; margin-bottom: 4px;">SCRATCH ALERT</h2>
        <p style="color: #666; margin-top: 0;">${timeStr} ET</p>
        ${alerts.join('')}
        <p style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #ccc; font-size: 12px; color: #666;">
          The Commission is monitoring all plays for scratches. Alerts fire only when the favorite or a horse in our exotic box is scratched.
        </p>
      </div>`
    );
  }

  // === RESULTS COLLECTION ===
  // Check each watched race for has_finished, pull results if new
  let resultsCollected = 0;

  // Group watched races by track to minimize API calls
  const trackGroups: Record<string, WatchedRace[]> = {};
  for (const race of WATCHED_RACES) {
    if (!trackGroups[race.track_api]) trackGroups[race.track_api] = [];
    trackGroups[race.track_api].push(race);
  }

  for (const [trackApi, trackRaces] of Object.entries(trackGroups)) {
    const meetId = MEET_IDS[trackApi];
    if (!meetId) continue;

    // Check entries endpoint for has_finished flags
    let entriesData: any;
    try {
      entriesData = await apiFetch(`/meets/${meetId}/entries`);
    } catch { continue; }

    const finishedRaceNumbers: number[] = [];
    for (const apiRace of (entriesData.races || [])) {
      if (apiRace.has_finished) {
        const rn = parseInt(apiRace.race_key?.race_number);
        if (rn) finishedRaceNumbers.push(rn);
      }
    }

    // Filter to only our watched races that have finished
    const finishedWatched = trackRaces.filter(r => finishedRaceNumbers.includes(r.race_number));
    if (finishedWatched.length === 0) continue;

    // Check which ones we already have results for
    const raceIds = await query(
      `SELECT id, race_number FROM races WHERE track = $1 AND date = CURRENT_DATE AND race_number = ANY($2)`,
      [finishedWatched[0].track_name, finishedWatched.map(r => r.race_number)]
    );

    const raceIdMap: Record<number, number> = {};
    for (const row of raceIds.rows) {
      raceIdMap[row.race_number] = row.id;
    }

    // Check which race_ids already have results
    const existingResults = await query(
      `SELECT race_id FROM results WHERE race_id = ANY($1)`,
      [Object.values(raceIdMap)]
    );
    const settledRaceIds = new Set(existingResults.rows.map((r: any) => r.race_id));

    // Find races that need results
    const needResults = finishedWatched.filter(r => {
      const dbId = raceIdMap[r.race_number];
      return dbId && !settledRaceIds.has(dbId);
    });

    if (needResults.length === 0) continue;

    // Pull results from API
    let resultsData: any;
    try {
      resultsData = await apiFetch(`/meets/${meetId}/results`);
    } catch { continue; }

    for (const race of needResults) {
      const apiResult = (resultsData.races || []).find(
        (r: any) => r.race_key?.race_number === String(race.race_number)
      );
      if (!apiResult || !apiResult.runners || apiResult.runners.length < 3) continue;

      const dbRaceId = raceIdMap[race.race_number];
      const runners = apiResult.runners;

      // Get post positions from program_number
      const winPP = parseInt(runners[0]?.program_number);
      const placePP = parseInt(runners[1]?.program_number);
      const showPP = parseInt(runners[2]?.program_number);
      const fourthPP = runners[3] ? parseInt(runners[3]?.program_number) : null;

      // Look up entry IDs
      const lookupEntry = async (pp: number) => {
        const { rows } = await query(
          'SELECT id FROM entries WHERE race_id = $1 AND post_position = $2', [dbRaceId, pp]
        );
        return rows.length ? rows[0].id : null;
      };

      const winEntryId = await lookupEntry(winPP);
      const placeEntryId = await lookupEntry(placePP);
      const showEntryId = await lookupEntry(showPP);

      // Extract payouts — normalize to standard bases ($2 win, $1 exacta, $1 tri, $0.10 super)
      const payoffs = apiResult.payoffs || [];
      const findPayout = (name: string) => payoffs.find((p: any) =>
        p.wager_name?.toUpperCase().includes(name)
      );

      const winPayoff = runners[0]?.win_payoff || null;
      const exactaRaw = findPayout('EXACTA');
      const trifectaRaw = findPayout('TRIFECTA');
      const superfectaRaw = findPayout('SUPERFECTA');

      // Normalize to $1 base for exacta/tri (API may report at $2 or $0.50 base)
      const normalizeToBase = (raw: any, targetBase: number) => {
        if (!raw) return null;
        const amount = parseFloat(raw.payoff_amount);
        const base = parseFloat(raw.base_amount);
        if (!amount || !base) return null;
        return amount * (targetBase / base);
      };

      const exactaPayout = normalizeToBase(exactaRaw, 1);
      const trifectaPayout = normalizeToBase(trifectaRaw, 1);
      const superfectaPayout = superfectaRaw ? parseFloat(superfectaRaw.payoff_amount) : null;

      // Insert results
      await query(
        `INSERT INTO results (race_id, win_entry_id, place_entry_id, show_entry_id, win_payout, exacta_payout, trifecta_payout, superfecta_payout)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (race_id) DO NOTHING`,
        [dbRaceId, winEntryId, placeEntryId, showEntryId, winPayoff, exactaPayout, trifectaPayout, superfectaPayout]
      );

      resultsCollected++;

      // Email members about the result
      const winHorse = runners[0]?.horse_name || '?';
      const placeHorse = runners[1]?.horse_name || '?';
      const showHorse = runners[2]?.horse_name || '?';

      // Check if our bets hit
      const boxUpper = race.box.map(h => h.toUpperCase());
      const top3 = [winHorse, placeHorse, showHorse].map(h => h.toUpperCase());
      const winPickHit = race.win_pick.toUpperCase() === top3[0];
      const exactaHit = boxUpper.includes(top3[0]) && boxUpper.includes(top3[1]);
      const trifectaHit = exactaHit && boxUpper.includes(top3[2]);

      let performanceLine = '';
      if (winPickHit) {
        performanceLine = `✅ WIN BET HIT — ${race.win_pick} won!`;
      } else if (trifectaHit) {
        performanceLine = `✅ TRIFECTA HIT — all 3 finishers were in our box`;
      } else if (exactaHit) {
        performanceLine = `✅ EXACTA HIT — top 2 were in our box`;
      } else {
        const inBox = top3.filter(h => boxUpper.includes(h)).length;
        performanceLine = `❌ ${inBox}/3 finishers were in our box`;
      }

      await sendEmailToAll(
        `🏁 ${race.track_name} R${race.race_number} — ${winHorse} wins`,
        `<div style="font-family: monospace; padding: 16px; max-width: 600px;">
          <h2 style="color: #000080; margin-bottom: 4px;">🏁 RACE RESULT</h2>
          <p style="font-size: 16px; font-weight: bold; margin: 4px 0;">${race.track_name} R${race.race_number} — ${race.product}</p>
          <table style="border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 14px;">
            <tr style="border-bottom: 1px solid #ccc;">
              <td style="padding: 6px 8px; font-weight: bold; color: #d4af37;">1st</td>
              <td style="padding: 6px 8px; font-weight: bold;">#${winPP} ${winHorse}</td>
              <td style="padding: 6px 8px; color: green;">${winPayoff ? '$' + winPayoff.toFixed(2) : ''}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ccc;">
              <td style="padding: 6px 8px; font-weight: bold; color: #888;">2nd</td>
              <td style="padding: 6px 8px; font-weight: bold;">#${placePP} ${placeHorse}</td>
              <td style="padding: 6px 8px;"></td>
            </tr>
            <tr style="border-bottom: 1px solid #ccc;">
              <td style="padding: 6px 8px; font-weight: bold; color: #cd7f32;">3rd</td>
              <td style="padding: 6px 8px; font-weight: bold;">#${showPP} ${showHorse}</td>
              <td style="padding: 6px 8px;"></td>
            </tr>
          </table>
          ${exactaPayout ? `<p style="margin: 4px 0;">Exacta (${winPP}-${placePP}): <strong>$${exactaPayout.toFixed(2)}</strong></p>` : ''}
          ${trifectaPayout ? `<p style="margin: 4px 0;">Trifecta (${winPP}-${placePP}-${showPP}): <strong>$${trifectaPayout.toFixed(2)}</strong></p>` : ''}
          ${superfectaPayout ? `<p style="margin: 4px 0;">Superfecta: <strong>$${superfectaPayout.toFixed(2)}</strong></p>` : ''}
          <div style="background: ${winPickHit || trifectaHit || exactaHit ? '#e8f5e9' : '#fff3e0'}; border: 2px solid ${winPickHit || trifectaHit || exactaHit ? '#4caf50' : '#ff9800'}; padding: 12px; margin: 16px 0;">
            <p style="margin: 0; font-weight: bold; font-size: 14px;">${performanceLine}</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #666;">Our box: ${race.box.join(', ')}</p>
          </div>
          <p style="font-size: 12px; color: #666; margin-top: 12px;">
            <a href="https://fadethechalk.vercel.app/today/${dbRaceId}" style="color: #000080;">View full results →</a>
          </p>
        </div>`
      );
    }
  }

  return res.status(200).json({
    time: now.toISOString(),
    alerts_sent: alerts.length,
    results_collected: resultsCollected,
    races_checked: WATCHED_RACES.length
  });
}
