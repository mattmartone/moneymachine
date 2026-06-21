import { query } from '../db.js';

const API_USER = 'DPoVaGs2XRopMmiHUcJDkHtC';
const API_PASS = 'YQJDPUITg7LCEP0Ascpu5t1S';
const BASE_URL = 'https://api.theracingapi.com/v1/north-america';
const RESEND_KEY = 're_L3cnNm7K_6Fu7rVh8Num5gULJemTdoK9y';

const MEET_IDS: Record<string, string> = {
  ALB: 'ALB_1782000000000',
  ARP: 'ARP_1782000000000',
  BAQ: 'BAQ_1782000000000',
  CD: 'CD_1782000000000',
  EMD: 'EMD_1782000000000',
  GP: 'GP_1782000000000',
  MTH: 'MTH_1782000000000',
  PRM: 'PRM_1782000000000',
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
  // Commission Card — June 21, 2026
  { track_api: 'CD', track_name: 'Churchill', race_number: 2, product: 'Commission Pick', favorite: 'GARDINER', win_pick: 'UPTURNED BRIM', box: ['GARDINER', 'SLIDER', 'UPTURNED BRIM', 'MIACOMET'], post_time_et: '13:15' },
  { track_api: 'GP', track_name: 'Gulfstream', race_number: 4, product: 'Commission Pick', favorite: "MULLY'S MOON", win_pick: 'LAST SHALL B FIRST', box: ["MULLY'S MOON", "SURFER'S JOY", 'OPERA HOUSE A. D.', 'NOBLE PRINCE', 'TAPARINO'], post_time_et: '13:47' },
  { track_api: 'ALB', track_name: 'Albuquerque', race_number: 2, product: 'Commission Pick', favorite: 'CROSSRIGHTHANDS', win_pick: 'SCORPION SHOT', box: ['ROAD TO ELDORADO', 'CROSSRIGHTHANDS', 'MOHAY PLEASE', 'SINAI', 'SCORPION SHOT'], post_time_et: '15:55' },
  { track_api: 'MTH', track_name: 'Monmouth', race_number: 7, product: 'Commission Pick', favorite: 'COUCHES BURNING', win_pick: 'MUSIC ON THE RUN', box: ['BONSAI WARRIOR', 'FOLLOW THE FELLOW', 'TOUGH GUY TONY', 'COUCHES BURNING', 'MUSIC ON THE RUN'], post_time_et: '15:58' },
  { track_api: 'ARP', track_name: 'Arapahoe', race_number: 4, product: 'Commission Pick', favorite: 'INDIA INK', win_pick: 'GYPSY MISCHIEF', box: ['GYPSY MISCHIEF', 'SUPERSONIC BLUE', 'PALS WILD LIBERTY', 'INDIA INK'], post_time_et: '16:30' },
  { track_api: 'ALB', track_name: 'Albuquerque', race_number: 6, product: 'Commission Pick', favorite: 'BYE', win_pick: 'TIME TRAVELIN', box: ['BYE', 'LITE RANCHIN KID', "JAIME'S COMMITMENT", 'TIME TRAVELIN'], post_time_et: '17:35' },
  { track_api: 'EMD', track_name: 'Emerald Downs', race_number: 2, product: 'Commission Pick', favorite: 'CALMCOOLNCOLLECTED', win_pick: 'SIR ARGENTO', box: ['CREATIVE UNION', 'YETI LUTE', 'CALMCOOLNCOLLECTED', 'WHISKEYTHENWINE', 'SIR ARGENTO'], post_time_et: '17:19' },
  { track_api: 'EMD', track_name: 'Emerald Downs', race_number: 5, product: 'Commission Pick', favorite: 'CREATIVE OM', win_pick: 'JIMMY B', box: ['SEAS OF NORMANDY', 'CREATIVE OM', 'ADIOS JOJO', 'JIMMY B'], post_time_et: '18:50' },
  { track_api: 'EMD', track_name: 'Emerald Downs', race_number: 7, product: 'Commission Pick', favorite: 'ALOHA BREEZE', win_pick: 'STAY SASSY', box: ['ALOHA BREEZE', 'IMA MARGARITA GIRL', 'SHARP RIDE', 'YOUNG LIFE LAURA', 'STAY SASSY'], post_time_et: '19:50' },
  { track_api: 'PRM', track_name: 'Prairie Meadows', race_number: 11, product: 'Commission Pick', favorite: 'OUTMATCH', win_pick: 'MACHO FORTY FIVE', box: ["VIRTUE'S REWARD", 'MACHO FORTY FIVE', 'MC COUGAR', 'KIND SOUL', 'OUTMATCH'], post_time_et: '21:15' },
  // Capo Picks (HIGH conviction, not Commission)
  { track_api: 'CD', track_name: 'Churchill', race_number: 10, product: 'Capo Pick', favorite: 'CLOE', win_pick: 'DANGHERECOMESSHANG', box: ['CLOE', 'DANGHERECOMESSHANG', 'CABERNEIGH', 'SANCTIFY'], post_time_et: '17:28' },
  { track_api: 'CD', track_name: 'Churchill', race_number: 7, product: 'Capo Pick', favorite: 'BACK RING BUZZ', win_pick: 'COOL AMERICAN', box: ['BACK RING BUZZ', 'NEENAH', 'GOT GONE', 'RACONTEUSE', 'COOL AMERICAN'], post_time_et: '15:53' },
  { track_api: 'ALB', track_name: 'Albuquerque', race_number: 7, product: 'Capo Pick', favorite: "DORA'S STORM", win_pick: "DORA'S STORM", box: ["DORA'S STORM", 'THRUTHESTORM', 'THREE MARTINIS', 'VALENTINO WHO', "I'MAGAMBLER"], post_time_et: '12:00' },
  { track_api: 'ALB', track_name: 'Albuquerque', race_number: 9, product: 'Capo Pick', favorite: 'BLINGO', win_pick: 'AZTEC SUN', box: ['MARKSALOT', 'DOUBLE RIDE', 'NABERS', 'MAGICAL MARK', 'DISTANT FLEET'], post_time_et: '05:20' },
  { track_api: 'ALB', track_name: 'Albuquerque', race_number: 10, product: 'Capo Pick', favorite: 'EQUITY SEARCH', win_pick: 'BYE BYE VICKI', box: ['EQUITY SEARCH', 'AWESOME GLORY', 'BYE BYE VICKI', 'PASS THE TEST'], post_time_et: '14:00' },
  { track_api: 'ALB', track_name: 'Albuquerque', race_number: 4, product: 'Capo Pick', favorite: 'STACKERS', win_pick: 'STACKERS', box: ['STACKERS', 'AMERICAN RED', 'CITIZEN BARRETT', 'MENDELSSOHNS MUSIC', 'DASHING AMERICAN'], post_time_et: '10:00' },
  { track_api: 'BAQ', track_name: 'Belmont', race_number: 8, product: 'Capo Pick', favorite: "MOMMY'S TURN", win_pick: 'SAIL WITH THE WIND', box: ["MOMMY'S TURN", 'DOWNTOWN CHANNEL', 'SARATOGA SNOW', 'SAIL WITH THE WIND'], post_time_et: '16:43' },
  { track_api: 'BAQ', track_name: 'Belmont', race_number: 3, product: 'Capo Pick', favorite: 'MISS LAO', win_pick: 'MISS LAO', box: ['MISS LAO', 'MY FIRST LOVE', 'SANTAGATA', 'LUNA MOTH'], post_time_et: '14:06' },
];

async function apiFetch(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Authorization': 'Basic ' + Buffer.from(`${API_USER}:${API_PASS}`).toString('base64') }
  });
  return res.json();
}

async function postToSlack(text: string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
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
      let verdict = '';
      if (isWinPick) {
        impact = '🚨 OUR WIN PICK IS SCRATCHED — NO WIN BET THIS RACE';
        verdict = '🛑 DROP RACE — win pick scratched';
      } else if (isFave) {
        impact = '⚠️ FAVORITE SCRATCHED — vulnerability thesis changes, pace map shifts';
        verdict = '⚠️ REVIEW — favorite scratched, thesis may change';
      } else if (isInBox) {
        impact = '⚠️ BOX HORSE SCRATCHED — exotic box reduced, consider adjustment';
        verdict = '🔄 REBUILD BOX — box horse scratched';
      }

      await postToSlack(
        `❌ *SCRATCH: ${scratchName}*\n` +
        `${race.track_name} R${race.race_number} — ${race.product}\n` +
        `*Verdict: ${verdict}*\n` +
        `Win pick: ${race.win_pick} | Fave: ${race.favorite}\n` +
        `Box: ${race.box.join(', ')}`
      );

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
      const fourthHorse = runners[3]?.horse_name || '';

      // Pull our bets for this race to calculate net
      const { rows: raceBets } = await query(
        `SELECT bet_type, stake, doubled, entries_used FROM bets WHERE race_id = $1 AND conviction = 'COMMISSION' ORDER BY bet_type`,
        [dbRaceId]
      );

      const parseBetPP = (entry: string) => entry.replace(/^#/, '').split(' ')[0];

      // Calculate per-bet results
      const betResults: { type: string; stake: number; collected: number; hit: boolean }[] = [];
      let totalCollected = 0;
      let totalWagered = 0;

      for (const bet of raceBets) {
        const pps = (bet.entries_used || []).map(parseBetPP);
        const n = pps.length;
        let collected = 0;
        let hit = false;

        if (bet.bet_type === 'win') {
          hit = pps.includes(String(winPP));
          if (hit && winPayoff) collected = (winPayoff / 2) * bet.stake;
        } else if (bet.bet_type === 'exacta') {
          hit = pps.includes(String(winPP)) && pps.includes(String(placePP));
          if (hit && exactaPayout) collected = exactaPayout * (bet.stake / (n * (n - 1)));
        } else if (bet.bet_type === 'trifecta') {
          hit = pps.includes(String(winPP)) && pps.includes(String(placePP)) && pps.includes(String(showPP));
          if (hit && trifectaPayout) collected = trifectaPayout * (bet.stake / (n * (n - 1) * (n - 2)));
        } else if (bet.bet_type === 'superfecta') {
          hit = pps.includes(String(winPP)) && pps.includes(String(placePP)) && pps.includes(String(showPP)) && fourthPP != null && pps.includes(String(fourthPP));
          if (hit && superfectaPayout) collected = superfectaPayout * (bet.stake / (n * (n - 1) * (n - 2) * (n - 3)));
        }

        betResults.push({ type: bet.bet_type, stake: bet.stake, collected, hit });
        totalCollected += collected;
        totalWagered += bet.stake;
      }

      const raceNet = totalCollected - totalWagered;
      const netColor = raceNet >= 0 ? 'green' : 'red';

      // Build bet breakdown rows
      const betRows = betResults.map(b => {
        const net = b.collected - b.stake;
        const netStr = net >= 0 ? `+$${net.toFixed(2)}` : `-$${Math.abs(net).toFixed(2)}`;
        const color = net >= 0 ? 'green' : 'red';
        const hitStr = b.hit ? '✅ HIT' : '❌ miss';
        return `<tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 4px 8px; text-transform: capitalize;">${b.type}</td>
          <td style="padding: 4px 8px;">$${b.stake}</td>
          <td style="padding: 4px 8px;">${b.hit ? '$' + b.collected.toFixed(2) : '—'}</td>
          <td style="padding: 4px 8px; color: ${color}; font-weight: bold;">${netStr}</td>
          <td style="padding: 4px 8px;">${hitStr}</td>
        </tr>`;
      }).join('');

      await sendEmailToAll(
        `🏁 ${race.track_name} R${race.race_number} — ${winHorse} wins | ${raceNet >= 0 ? '+' : '-'}$${Math.abs(raceNet).toFixed(2)}`,
        `<div style="font-family: monospace; padding: 16px; max-width: 600px;">
          <h2 style="color: #000080; margin-bottom: 4px;">🏁 RACE RESULT</h2>
          <p style="font-size: 16px; font-weight: bold; margin: 4px 0;">${race.track_name} R${race.race_number} — ${race.product}</p>
          <table style="border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 14px;">
            <tr style="border-bottom: 1px solid #ccc;">
              <td style="padding: 6px 8px; font-weight: bold; color: #d4af37;">1st</td>
              <td style="padding: 6px 8px; font-weight: bold;">#${winPP} ${winHorse}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ccc;">
              <td style="padding: 6px 8px; font-weight: bold; color: #888;">2nd</td>
              <td style="padding: 6px 8px; font-weight: bold;">#${placePP} ${placeHorse}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ccc;">
              <td style="padding: 6px 8px; font-weight: bold; color: #cd7f32;">3rd</td>
              <td style="padding: 6px 8px; font-weight: bold;">#${showPP} ${showHorse}</td>
            </tr>
            ${fourthHorse ? `<tr style="border-bottom: 1px solid #ccc;"><td style="padding: 6px 8px; color: #aaa;">4th</td><td style="padding: 6px 8px;">#${fourthPP} ${fourthHorse}</td></tr>` : ''}
          </table>
          <h3 style="margin: 16px 0 8px; font-size: 13px; text-transform: uppercase; color: #666;">Bet Breakdown</h3>
          <table style="border-collapse: collapse; width: 100%; font-size: 13px;">
            <tr style="border-bottom: 2px solid #ccc;">
              <th style="padding: 4px 8px; text-align: left;">Bet</th>
              <th style="padding: 4px 8px; text-align: left;">Wagered</th>
              <th style="padding: 4px 8px; text-align: left;">Collected</th>
              <th style="padding: 4px 8px; text-align: left;">Net</th>
              <th style="padding: 4px 8px; text-align: left;">Result</th>
            </tr>
            ${betRows}
            <tr style="border-top: 2px solid #000;">
              <td style="padding: 6px 8px; font-weight: bold;">TOTAL</td>
              <td style="padding: 6px 8px; font-weight: bold;">$${totalWagered.toFixed(2)}</td>
              <td style="padding: 6px 8px; font-weight: bold;">$${totalCollected.toFixed(2)}</td>
              <td style="padding: 6px 8px; font-weight: bold; color: ${netColor};">${raceNet >= 0 ? '+' : '-'}$${Math.abs(raceNet).toFixed(2)}</td>
              <td></td>
            </tr>
          </table>
          <p style="font-size: 12px; color: #666; margin-top: 12px;">
            <a href="https://fadethechalk.vercel.app/mobile" style="color: #000080;">View on site →</a>
          </p>
        </div>`
      );

      // Post to Slack
      const slackBetLines = betResults.map(b => {
        const net = b.collected - b.stake;
        const emoji = b.hit ? '✅' : '❌';
        return `${emoji} ${b.type}: $${b.stake} → ${b.hit ? '$' + b.collected.toFixed(2) : '—'} (${net >= 0 ? '+' : '-'}$${Math.abs(net).toFixed(2)})`;
      }).join('\n');

      await postToSlack(
        `🏁 *${race.track_name} R${race.race_number} — ${race.product}*\n` +
        `Finish: #${winPP} ${winHorse} — #${placePP} ${placeHorse} — #${showPP} ${showHorse}${fourthPP ? ' — #' + fourthPP + ' ' + fourthHorse : ''}\n` +
        `Our pick: ${race.win_pick} ${betResults.find(b => b.type === 'win')?.hit ? '✅ WON' : '❌ missed'}\n\n` +
        `${slackBetLines}\n` +
        `─────────────\n` +
        `*Net: ${raceNet >= 0 ? '+' : '-'}$${Math.abs(raceNet).toFixed(2)}*`
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
