import { query } from '../db.js';

const RACING_API_USER = process.env.RACING_API_USER || 'DPoVaGs2XRopMmiHUcJDkHtC';
const RACING_API_PASS = process.env.RACING_API_PASS || 'YQJDPUITg7LCEP0Ascpu5t1S';
const RESEND_KEY = process.env.RESEND_API_KEY || 'dummy';
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || '';
const CRON_SECRET = process.env.CRON_SECRET || '';
const BASE_URL = 'https://api.theracingapi.com/v1/north-america';

const TRACK_IDS: Record<string, string> = {
  'Santa Anita': 'SA', 'Laurel Park': 'LRL', 'Saratoga': 'SAR', 'Churchill Downs': 'CD',
  'Del Mar': 'DMR', 'Gulfstream Park': 'GP', 'Aqueduct': 'AQU', 'Belmont': 'BEL',
  'Belmont at the Big A': 'BAQ', 'Keeneland': 'KEE', 'Pimlico': 'PIM', 'Monmouth Park': 'MTH',
  'Woodbine': 'WO', 'Oaklawn Park': 'OP', 'Tampa Bay': 'TAM', 'Fair Grounds': 'FG',
  'Parx Racing': 'PRX', 'Canterbury Park': 'CBY', 'Prairie Meadows': 'PRM',
  'Lone Star Park': 'LS', 'Hawthorne': 'HAW', 'Delaware Park': 'DEL',
};

interface CommissionRace {
  id: number;
  track: string;
  race_number: number;
  post_time: string | null;
  win_pick: string;
  box: string[];
  total_stake: number;
  doubled: boolean;
}

async function apiFetch(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Authorization': 'Basic ' + Buffer.from(`${RACING_API_USER}:${RACING_API_PASS}`).toString('base64') }
  });
  if (!res.ok) return null;
  return res.json();
}

async function postSlack(text: string) {
  if (!SLACK_WEBHOOK_URL) return;
  await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  }).catch(() => {});
}

async function logEvent(raceId: number | null, eventType: string, message: string, details?: any) {
  try {
    await query(
      `INSERT INTO pipeline_events (date, race_id, event_type, message, details)
       VALUES (CURRENT_DATE, $1, $2, $3, $4)
       ON CONFLICT (date, COALESCE(race_id, 0), event_type) DO NOTHING`,
      [raceId, eventType, message, details ? JSON.stringify(details) : null]
    );
    return true;
  } catch {
    return false;
  }
}

async function eventExists(raceId: number | null, eventType: string): Promise<boolean> {
  const { rows } = await query(
    `SELECT 1 FROM pipeline_events WHERE date = CURRENT_DATE AND COALESCE(race_id, 0) = COALESCE($1, 0) AND event_type = $2`,
    [raceId, eventType]
  );
  return rows.length > 0;
}

function getETNow(): { hours: number; minutes: number; totalMinutes: number } {
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  return { hours: et.getHours(), minutes: et.getMinutes(), totalMinutes: et.getHours() * 60 + et.getMinutes() };
}

function parsePostTime(postTime: string): number {
  const [h, m] = postTime.split(':').map(Number);
  return h * 60 + m;
}

function parsePP(entry: string): string {
  return entry.replace(/^#/, '').split(' ')[0];
}

async function resolveMeetIds(dateStr: string): Promise<Record<string, string>> {
  const data = await apiFetch(`/meets?start_date=${dateStr}&end_date=${dateStr}`);
  const map: Record<string, string> = {};
  for (const meet of (data?.meets || [])) {
    map[meet.track_id] = meet.meet_id;
  }
  return map;
}

async function sendEmail(subject: string, html: string) {
  const { rows: users } = await query(`SELECT email FROM users WHERE email IS NOT NULL`);
  for (const user of users) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Fade the Chalk <noreply@org64.com>',
        to: [user.email],
        subject,
        html
      })
    }).catch(() => {});
  }
}

// --- PIPELINE ACTIONS ---

async function pullLiveOdds(race: CommissionRace, meetIds: Record<string, string>) {
  if (await eventExists(race.id, 'odds_pulled')) return;

  const trackApi = TRACK_IDS[race.track];
  if (!trackApi || !meetIds[trackApi]) return;

  const data = await apiFetch(`/meets/${meetIds[trackApi]}/entries`);
  if (!data?.races) return;

  const apiRace = data.races.find((r: any) => parseInt(r.race_key?.race_number) === race.race_number);
  if (!apiRace?.runners) return;

  const changes: string[] = [];
  for (const runner of apiRace.runners) {
    if (runner.scratch_indicator === 'Y') continue;
    const pp = parseInt(runner.program_number);
    const liveOdds = runner.live_odds || null;
    if (liveOdds) {
      const { rows: existing } = await query(
        `SELECT live_odds FROM entries WHERE race_id = $1 AND post_position = $2`, [race.id, pp]
      );
      const prev = existing[0]?.live_odds;
      if (prev && prev !== String(liveOdds)) {
        changes.push(`PP${pp}: ${prev} → ${liveOdds}`);
      }
      await query(
        `UPDATE entries SET live_odds = $1 WHERE race_id = $2 AND post_position = $3`,
        [String(liveOdds), race.id, pp]
      );
    }
  }

  const msg = changes.length > 0
    ? `Live odds updated. ${changes.slice(0, 5).join(', ')}${changes.length > 5 ? ` +${changes.length - 5} more` : ''}`
    : `Live odds pulled. No significant changes.`;

  await logEvent(race.id, 'odds_pulled', msg, { changes });
}

async function checkScratches(race: CommissionRace, meetIds: Record<string, string>) {
  if (await eventExists(race.id, 'scratches_checked')) return;

  const trackApi = TRACK_IDS[race.track];
  if (!trackApi || !meetIds[trackApi]) return;

  const data = await apiFetch(`/meets/${meetIds[trackApi]}/entries`);
  if (!data?.races) return;

  const apiRace = data.races.find((r: any) => parseInt(r.race_key?.race_number) === race.race_number);
  if (!apiRace?.runners) return;

  const scratchedRunners = apiRace.runners.filter((r: any) => r.scratch_indicator === 'Y');
  const newScratches: string[] = [];

  for (const runner of scratchedRunners) {
    const pp = parseInt(runner.program_number);
    const { rows } = await query(
      `SELECT scratched FROM entries WHERE race_id = $1 AND post_position = $2`, [race.id, pp]
    );
    if (rows[0] && !rows[0].scratched) {
      await query(`UPDATE entries SET scratched = true WHERE race_id = $1 AND post_position = $2`, [race.id, pp]);
      newScratches.push(`PP${pp} ${runner.horse_name?.toUpperCase() || ''}`);
    }
  }

  if (newScratches.length === 0) {
    await logEvent(race.id, 'scratches_checked', 'No new scratches detected.');
    return;
  }

  const winPickPP = parsePP(race.win_pick);
  const winPickScratched = newScratches.some(s => s.startsWith(`PP${winPickPP} `));

  if (winPickScratched) {
    const msg = `RACE DROPPED. Win pick ${race.win_pick} scratched. CONSEQUENTIAL — thesis dead.`;
    await logEvent(race.id, 'race_dropped', msg, { scratched: newScratches });
    await postSlack(`🚫 ${race.track} R${race.race_number}: ${msg}`);
  } else {
    // Check if scratch changes the race shape enough to reconsider
    const reconsiderReasons: string[] = [];

    // Was a box horse scratched?
    const boxPPs = race.box.map(parsePP);
    const scratchedPPs = newScratches.map(s => s.match(/PP(\d+)/)?.[1] || '');
    const boxScratch = scratchedPPs.filter(pp => boxPPs.includes(pp));
    if (boxScratch.length > 0) {
      reconsiderReasons.push(`Box horse scratched (PP${boxScratch.join(', PP')})`);
    }

    // Did field size drop below 6? (exotics less meaningful)
    const { rows: liveEntries } = await query(
      `SELECT COUNT(*) as cnt FROM entries WHERE race_id = $1 AND (scratched IS NULL OR scratched = false)`,
      [race.id]
    );
    const liveCount = parseInt(liveEntries[0]?.cnt || '0');
    if (liveCount < 6) {
      reconsiderReasons.push(`Field now only ${liveCount} horses — thin for exotics`);
    }

    // Did the scratch change the pace scenario?
    // Check if a speed horse (E) was scratched
    const { rows: scratchedEntries } = await query(
      `SELECT e.post_position, e.running_style, h.name
       FROM entries e JOIN horses h ON h.id = e.horse_id
       WHERE e.race_id = $1 AND e.scratched = true AND e.running_style = 'E'
       AND e.post_position = ANY($2::int[])`,
      [race.id, scratchedPPs.map(Number).filter(n => n > 0)]
    );
    if (scratchedEntries.length > 0) {
      reconsiderReasons.push(`Speed horse scratched (${scratchedEntries.map((e: any) => e.name).join(', ')}) — pace shape changed`);
    }

    if (reconsiderReasons.length > 0) {
      const msg = `RECONSIDER. Scratch: ${newScratches.join(', ')}. ${reconsiderReasons.join('. ')}. Win pick ${race.win_pick} still live but thesis may be weakened.`;
      await logEvent(race.id, 'scratch_reconsider', msg, { scratched: newScratches, reasons: reconsiderReasons });
      await postSlack(`🔄 ${race.track} R${race.race_number}: ${msg}`);
    } else {
      const msg = `Scratch: ${newScratches.join(', ')}. Win pick ${race.win_pick} unaffected. Race shape intact.`;
      await logEvent(race.id, 'scratch_detected', msg, { scratched: newScratches });
      await postSlack(`⚠️ ${race.track} R${race.race_number}: ${msg}`);
    }

    await rebuildBox(race);
  }

  await logEvent(race.id, 'scratches_checked', `Scratches checked. ${newScratches.length} new.`);
}

async function rebuildBox(race: CommissionRace) {
  const { rows: entries } = await query(
    `SELECT e.id, e.post_position, e.best_beyer, e.live_odds, h.name
     FROM entries e JOIN horses h ON h.id = e.horse_id
     WHERE e.race_id = $1 AND (e.scratched IS NULL OR e.scratched = false)
     ORDER BY e.best_beyer DESC NULLS LAST`,
    [race.id]
  );

  const { rows: exBet } = await query(
    `SELECT entries_used FROM bets WHERE race_id = $1 AND bet_type = 'exacta'`, [race.id]
  );
  const boxSize = exBet[0]?.entries_used?.length || 4;

  let box = entries.slice(0, boxSize);

  // Ensure fave (lowest live odds)
  const sorted = [...entries].filter(e => e.live_odds).sort((a, b) => {
    const aOdds = parseFloat(a.live_odds) || 99;
    const bOdds = parseFloat(b.live_odds) || 99;
    return aOdds - bOdds;
  });
  const fave = sorted[0];
  if (fave && !box.find((e: any) => e.id === fave.id)) {
    box[box.length - 1] = fave;
  }

  // Ensure win pick
  const winPickPP = parsePP(race.win_pick);
  const winEntry = entries.find((e: any) => String(e.post_position) === winPickPP);
  if (winEntry && !box.find((e: any) => e.id === winEntry.id)) {
    if (box.length > 1) box[box.length - 1] = winEntry;
  }

  const newEntriesUsed = box.map((e: any) => `#${e.post_position} ${e.name}`);

  for (const betType of ['exacta', 'trifecta', 'superfecta']) {
    await query(
      `UPDATE bets SET entries_used = $1 WHERE race_id = $2 AND bet_type = $3`,
      [newEntriesUsed, race.id, betType]
    );
  }

  const msg = `Box rebuilt: ${newEntriesUsed.join(', ')}`;
  await logEvent(race.id, 'box_rebuilt', msg, { new_box: newEntriesUsed });
}

async function sendPreRaceEmail(race: CommissionRace) {
  if (await eventExists(race.id, 'pre_race_email')) return;
  if (await eventExists(race.id, 'race_dropped')) return;

  const { rows: entries } = await query(
    `SELECT e.post_position, e.live_odds, e.morning_line_odds, e.best_beyer, e.scratched, h.name
     FROM entries e JOIN horses h ON h.id = e.horse_id
     WHERE e.race_id = $1 ORDER BY e.post_position`,
    [race.id]
  );

  const { rows: bets } = await query(
    `SELECT bet_type, stake, entries_used, doubled FROM bets WHERE race_id = $1 ORDER BY bet_type`, [race.id]
  );

  const winBet = bets.find((b: any) => b.bet_type === 'win');
  const exBet = bets.find((b: any) => b.bet_type === 'exacta');

  // Check for earlier settled races today
  const { rows: settled } = await query(
    `SELECT r.track, r.race_number, res.win_payout, ew.post_position as win_pp, hw.name as win_horse
     FROM results res
     JOIN races r ON r.id = res.race_id
     LEFT JOIN entries ew ON ew.id = res.win_entry_id
     LEFT JOIN horses hw ON hw.id = ew.horse_id
     WHERE r.date = CURRENT_DATE AND res.race_id != $1
     ORDER BY res.settled_at DESC LIMIT 5`,
    [race.id]
  );

  const formatTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const oddsRows = entries
    .filter((e: any) => !e.scratched)
    .map((e: any) => {
      const inBox = (exBet?.entries_used || []).some((u: string) => parsePP(u) === String(e.post_position));
      const isWin = winBet?.entries_used?.[0] && parsePP(winBet.entries_used[0]) === String(e.post_position);
      const highlight = isWin ? 'background:#ffffcc;font-weight:bold;' : inBox ? 'background:#f0f0ff;' : '';
      return `<tr style="${highlight}"><td style="padding:4px 8px;text-align:center;">${e.post_position}</td><td style="padding:4px 8px;">${e.name}</td><td style="padding:4px 8px;text-align:center;">${e.morning_line_odds || '—'}</td><td style="padding:4px 8px;text-align:center;font-weight:bold;">${e.live_odds || '—'}</td><td style="padding:4px 8px;text-align:center;">${e.best_beyer || '—'}</td><td style="padding:4px 8px;text-align:center;">${inBox ? '✓' : ''}</td></tr>`;
    }).join('');

  const scratchedList = entries.filter((e: any) => e.scratched);
  const scratchNote = scratchedList.length > 0
    ? `<div style="background:#fff3e0;border:2px solid #ff9800;padding:8px;margin-bottom:12px;font-family:monospace;font-size:12px;">SCRATCHED: ${scratchedList.map((e: any) => `#${e.post_position} ${e.name}`).join(', ')}</div>`
    : '';

  const earlierResults = settled.length > 0
    ? `<div style="border-top:2px solid #000;margin-top:16px;padding-top:12px;"><h3 style="font-family:Georgia;font-size:14px;margin:0 0 8px;">Earlier Results</h3>${settled.map((r: any) => `<div style="font-family:monospace;font-size:12px;">${r.track} R${r.race_number}: PP${r.win_pp} ${r.win_horse} ($${r.win_payout?.toFixed(2) || '?'})</div>`).join('')}</div>`
    : '';

  const totalStake = bets.reduce((s: number, b: any) => s + b.stake, 0);

  const html = `
<div style="font-family:'Courier New',monospace;max-width:600px;margin:0 auto;padding:20px;background:#fffff0;border:3px solid black;">
  <h1 style="font-family:Georgia,serif;font-size:20px;margin:0;border-bottom:2px solid black;padding-bottom:8px;">FADE THE CHALK</h1>
  <p style="font-size:12px;color:#666;margin:4px 0 16px;">PRE-RACE BRIEFING — ${race.track} R${race.race_number} • Posts ${formatTime(race.post_time!)} ET</p>
  ${scratchNote}
  <div style="background:#f5f5f5;border:2px solid #000;padding:12px;margin-bottom:16px;">
    <h3 style="font-family:Georgia;font-size:14px;margin:0 0 8px;">YOUR BET CARD</h3>
    <div style="font-size:13px;">
      <div><strong>WIN:</strong> $${winBet?.stake || 0} on ${winBet?.entries_used?.[0] || '—'}${winBet?.doubled ? ' (DOUBLED)' : ''}</div>
      <div><strong>BOX:</strong> ${exBet?.entries_used?.join(', ') || '—'}</div>
      <div><strong>Total outlay:</strong> $${totalStake.toFixed(2)}</div>
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;font-family:monospace;font-size:11px;margin-bottom:16px;">
    <tr style="border-bottom:2px solid black;"><th style="padding:4px 8px;">PP</th><th style="padding:4px 8px;text-align:left;">Horse</th><th style="padding:4px 8px;">ML</th><th style="padding:4px 8px;">Live</th><th style="padding:4px 8px;">Beyer</th><th style="padding:4px 8px;">Box</th></tr>
    ${oddsRows}
  </table>
  ${earlierResults}
  <div style="border-top:2px solid black;margin-top:20px;padding-top:12px;text-align:center;">
    <p style="font-family:Georgia;font-style:italic;font-size:12px;">Never bet the favorite.</p>
  </div>
</div>`;

  const subject = `${race.track} R${race.race_number} — Posts ${formatTime(race.post_time!)} ET | Commission Pick`;
  await sendEmail(subject, html);

  const msg = `Pre-race email sent. ${formatTime(race.post_time!)} post. ${entries.filter((e: any) => !e.scratched).length} runners.`;
  await logEvent(race.id, 'pre_race_email', msg, { subject });
  await postSlack(`📬 ${race.track} R${race.race_number}: Pre-race email sent to members.`);
}

async function settleRace(race: CommissionRace, meetIds: Record<string, string>) {
  if (await eventExists(race.id, 'results_settled')) return;
  if (await eventExists(race.id, 'race_dropped')) return;

  const { rows: existing } = await query(`SELECT id FROM results WHERE race_id = $1`, [race.id]);
  if (existing.length > 0) {
    await logEvent(race.id, 'results_settled', 'Results already in DB (settled externally).');
    return;
  }

  const trackApi = TRACK_IDS[race.track];
  if (!trackApi || !meetIds[trackApi]) return;

  const data = await apiFetch(`/meets/${meetIds[trackApi]}/results`);
  if (!data?.races) return;

  const apiRace = data.races.find((r: any) => parseInt(r.race_key?.race_number) === race.race_number);
  if (!apiRace?.runners || apiRace.runners.length < 3) return;

  const runners = apiRace.runners;
  const winPP = parseInt(runners[0].program_number);
  const placePP = parseInt(runners[1].program_number);
  const showPP = parseInt(runners[2].program_number);
  const fourthPP = runners[3] ? parseInt(runners[3].program_number) : null;

  const lookupEntry = async (pp: number) => {
    const { rows } = await query(`SELECT id FROM entries WHERE race_id = $1 AND post_position = $2`, [race.id, pp]);
    return rows[0]?.id || null;
  };

  const winEntryId = await lookupEntry(winPP);
  const placeEntryId = await lookupEntry(placePP);
  const showEntryId = await lookupEntry(showPP);
  const fourthEntryId = fourthPP ? await lookupEntry(fourthPP) : null;

  if (!winEntryId || !placeEntryId || !showEntryId) return;

  // Store RAW track payouts per base unit — NOT pre-multiplied by stake
  // Win: per $2 (as reported by track)
  const winPayout = runners[0].win_payoff ? parseFloat(runners[0].win_payoff) : null;

  // Our win pick's PLACE/SHOW payoff (per $2) — for the place bet on the win pick.
  // Meaningful only when the pick finished 1st/2nd (place) or top 3 (show); null otherwise.
  const winPickPayoffPP = parsePP(race.win_pick);
  const winPickRunner = runners.find((r: any) => String(parseInt(r.program_number)) === winPickPayoffPP);
  const placePayout = winPickRunner?.place_payoff ? parseFloat(winPickRunner.place_payoff) : null;
  const showPayout = winPickRunner?.show_payoff ? parseFloat(winPickRunner.show_payoff) : null;

  const payoffs = apiRace.payoffs || [];
  let exactaPayout = null, trifectaPayout = null, superfectaPayout = null;
  for (const p of payoffs) {
    const wager = (p.wager_name || '').toLowerCase();
    const amount = parseFloat(p.payoff_amount);
    const tickets = parseInt(p.number_of_tickets_bet) || 0;
    if (!amount) continue;
    // Normalize all exotics to per-$1 base using tickets_bet field
    // tickets_bet: 200=$2, 100=$1, 50=$0.50, 10=$0.10
    const baseDollars = tickets > 0 ? tickets / 100 : 1;
    if (wager.includes('superfecta')) superfectaPayout = amount / baseDollars;
    else if (wager.includes('trifecta')) trifectaPayout = amount / baseDollars;
    else if (wager.includes('exacta')) exactaPayout = amount / baseDollars;
  }

  await query(
    `INSERT INTO results (race_id, win_entry_id, place_entry_id, show_entry_id, fourth_entry_id, win_payout, place_payout, show_payout, exacta_payout, trifecta_payout, superfecta_payout, settled_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
     ON CONFLICT (race_id) DO UPDATE SET
       win_entry_id = EXCLUDED.win_entry_id, place_entry_id = EXCLUDED.place_entry_id,
       show_entry_id = EXCLUDED.show_entry_id, fourth_entry_id = EXCLUDED.fourth_entry_id,
       win_payout = EXCLUDED.win_payout, place_payout = EXCLUDED.place_payout, show_payout = EXCLUDED.show_payout,
       exacta_payout = EXCLUDED.exacta_payout,
       trifecta_payout = EXCLUDED.trifecta_payout, superfecta_payout = EXCLUDED.superfecta_payout,
       settled_at = NOW()`,
    [race.id, winEntryId, placeEntryId, showEntryId, fourthEntryId, winPayout, placePayout, showPayout, exactaPayout, trifectaPayout, superfectaPayout]
  );

  // Check our bets and settle each one
  const boxPPs = race.box.map(parsePP);
  const winPickPP = parsePP(race.win_pick);
  const wpp = String(winPP), ppp = String(placePP), spp = String(showPP);
  const fourthStr = fourthPP ? String(fourthPP) : null;

  const winHit = winPickPP === wpp;
  const placeHit = winPickPP === wpp || winPickPP === ppp; // win pick ran 1st or 2nd
  const exHit = boxPPs.includes(wpp) && boxPPs.includes(ppp);
  const triHit = exHit && boxPPs.includes(spp);
  const superHit = triHit && fourthStr && boxPPs.includes(fourthStr);

  // Settle individual bets in the bets table
  const betSettlements = [
    { type: 'win', hit: winHit, collected: winHit ? winPayout : 0 },
    { type: 'place', hit: placeHit, collected: placeHit ? placePayout : 0 },
    { type: 'exacta', hit: exHit, collected: exHit ? exactaPayout : 0 },
    { type: 'trifecta', hit: triHit, collected: triHit ? trifectaPayout : 0 },
    { type: 'superfecta', hit: superHit, collected: superHit ? superfectaPayout : 0 },
  ];

  for (const bet of betSettlements) {
    await query(
      `UPDATE bets SET hit = $1, collected = $2, net = $3, settled_at = NOW()
       WHERE race_id = $4 AND bet_type = $5`,
      [bet.hit, bet.collected || 0, (bet.collected || 0) - (await query(`SELECT stake FROM bets WHERE race_id = $1 AND bet_type = $2`, [race.id, bet.type])).rows[0]?.stake || 0, race.id, bet.type]
    );
  }

  // Get horse names for the finish
  const { rows: finishHorses } = await query(
    `SELECT e.post_position, h.name FROM entries e JOIN horses h ON h.id = e.horse_id
     WHERE e.race_id = $1 AND e.post_position = ANY($2::int[])`,
    [race.id, [winPP, placePP, showPP, ...(fourthPP ? [fourthPP] : [])]]
  );
  const ppToName: Record<number, string> = {};
  for (const h of finishHorses) ppToName[h.post_position] = h.name;

  const finishLine = `${ppToName[winPP] || `PP${winPP}`} / ${ppToName[placePP] || `PP${placePP}`} / ${ppToName[showPP] || `PP${showPP}`}`;

  // Build per-bet results
  const betLines: string[] = [];
  const raceWagered = race.total_stake;
  let raceCollected = 0;
  if (winHit) { betLines.push(`Win: +$${winPayout?.toFixed(0)}`); raceCollected += winPayout || 0; }
  else betLines.push(`Win: miss`);
  if (placeHit) { betLines.push(`Place: +$${placePayout?.toFixed(0)}`); raceCollected += placePayout || 0; }
  else betLines.push(`Place: miss`);
  if (exHit) { betLines.push(`Exacta: +$${exactaPayout?.toFixed(0)}`); raceCollected += exactaPayout || 0; }
  else betLines.push(`Exacta: miss`);
  if (triHit) { betLines.push(`Tri: +$${trifectaPayout?.toFixed(0)}`); raceCollected += trifectaPayout || 0; }
  if (superHit) { betLines.push(`Super: +$${superfectaPayout?.toFixed(0)}`); raceCollected += superfectaPayout || 0; }

  const raceNet = raceCollected - raceWagered;

  // Calculate day net so far
  const { rows: dayBets } = await query(
    `SELECT COALESCE(SUM(b.stake), 0) as wagered, COALESCE(SUM(b.collected), 0) as collected
     FROM bets b JOIN races r ON r.id = b.race_id
     WHERE r.date = CURRENT_DATE AND b.conviction IS NOT NULL AND b.settled_at IS NOT NULL`,
  );
  const dayWagered = parseFloat(dayBets[0]?.wagered || '0') + raceWagered;
  const dayCollected = parseFloat(dayBets[0]?.collected || '0') + raceCollected;
  const dayNet = dayCollected - dayWagered;

  const icon = raceNet > 0 ? '✅' : '❌';
  const slackMsg = [
    `${icon} *${race.track} R${race.race_number}* finished`,
    `Finish: ${finishLine}`,
    betLines.join(' | '),
    `Race: ${raceNet >= 0 ? '+' : '-'}$${Math.abs(Math.round(raceNet))} | Day: ${dayNet >= 0 ? '+' : '-'}$${Math.abs(Math.round(dayNet))}`,
  ].join('\n');

  const logMsg = `Results: ${finishLine}. ${betLines.join('. ')}. Race net: $${raceNet.toFixed(0)}. Day net: $${dayNet.toFixed(0)}.`;
  await logEvent(race.id, 'results_settled', logMsg, { finish: [winPP, placePP, showPP, fourthPP], race_net: raceNet, day_net: dayNet });
  await postSlack(slackMsg);

  // Send winner alert email to members — only when we hit
  if (winHit || exHit || triHit || superHit) {
    const hitTypes: string[] = [];
    if (winHit) hitTypes.push('WIN');
    if (exHit) hitTypes.push('EXACTA');
    if (triHit) hitTypes.push('TRIFECTA');

    const winnerHtml = `
<div style="font-family:'Courier New',monospace;max-width:600px;margin:0 auto;padding:20px;background:#fffff0;border:3px solid black;">
  <h1 style="font-family:Georgia,serif;font-size:24px;margin:0;text-align:center;color:#1a5c1a;">💰 WINNER</h1>
  <p style="font-family:Georgia;font-size:16px;text-align:center;margin:8px 0 16px;">${race.track} Race ${race.race_number}</p>
  <div style="background:#e8f5e9;border:2px solid #1a5c1a;padding:12px;text-align:center;margin-bottom:16px;">
    <div style="font-size:18px;font-weight:bold;">${hitTypes.join(' + ')} HIT</div>
    <div style="font-size:13px;margin-top:4px;">Finish: PP${winPP} – PP${placePP} – PP${showPP}</div>
  </div>
  <div style="text-align:center;margin:20px 0;">
    <a href="https://www.fadethechalk.bet/mobile" style="background:#000;color:#fffff0;padding:12px 24px;text-decoration:none;font-family:Georgia;font-size:14px;border:2px solid #000;">View Full Results →</a>
  </div>
  <div style="border-top:2px solid black;margin-top:20px;padding-top:12px;text-align:center;">
    <p style="font-family:Georgia;font-style:italic;font-size:12px;">Never bet the favorite.</p>
  </div>
</div>`;

    await sendEmail(`💰 ${hitTypes.join(' + ')} HIT — ${race.track} R${race.race_number}`, winnerHtml);
    await logEvent(race.id, 'winner_alert_sent', `Winner email sent: ${hitTypes.join(' + ')}`);
  }
}

async function ensureStrategyTags() {
  // Find all actionable bets today that have NO strategy_activations
  const { rows: untaggedBets } = await query(`
    SELECT b.id as bet_id, b.race_id, b.entries_used, b.doubled, b.bet_type,
           r.track, r.race_number, r.field_size, r.distance, r.surface
    FROM bets b
    JOIN races r ON r.id = b.race_id
    WHERE r.date = CURRENT_DATE
      AND UPPER(b.conviction) IN ('COMMISSION', 'HIGH', 'MEDIUM', 'CAPO')
      AND b.bet_type IN ('win', 'place')
      AND NOT EXISTS (SELECT 1 FROM strategy_activations sa WHERE sa.bet_id = b.id)
  `);

  if (untaggedBets.length === 0) return;

  for (const bet of untaggedBets) {
    if (!bet.entries_used?.length) continue;

    const winPickPP = parseInt(bet.entries_used[0].replace(/^#/, '').split(' ')[0], 10);

    // Load entries for signal evaluation
    const { rows: entries } = await query(`
      SELECT e.*, h.name as horse_name
      FROM entries e JOIN horses h ON h.id = e.horse_id
      WHERE e.race_id = $1 AND (e.scratched IS NULL OR e.scratched = false)
      ORDER BY e.post_position
    `, [bet.race_id]);

    if (entries.length === 0) continue;

    const winPick = entries.find((e: any) => e.post_position === winPickPP);
    if (!winPick) continue;

    // Identify favorite
    let fave: any = null, lowestOdds = Infinity;
    for (const e of entries) {
      const odds = parseOddsForStrat(e.morning_line_odds);
      if (odds !== null && odds < lowestOdds) { lowestOdds = odds; fave = e; }
    }

    // Vulnerability check
    const eHorses = entries.filter((e: any) => e.running_style === 'E');
    const paceScenario = eHorses.length === 0 ? 'no_speed' : eHorses.length === 1 ? 'lone_speed' : 'pace_duel';
    let vulnerable = false, vulnReason = '';
    if (fave) {
      if (fave.post_position <= 3 && ['P', 'S', 'E/P'].includes(fave.running_style) && entries.length >= 8) {
        vulnerable = true;
        vulnReason = `${fave.running_style} fave drawn PP${fave.post_position} inside in ${entries.length}-horse field`;
      }
      if (fave.running_style === 'E' && paceScenario === 'pace_duel') {
        vulnerable = true;
        vulnReason = `E fave in pace duel`;
      }
      if (['S', 'P'].includes(fave.running_style) && paceScenario === 'lone_speed') {
        vulnerable = true;
        vulnReason = `${fave.running_style} fave in lone-speed race`;
      }
    }

    // Tag strategies
    const activations: string[] = [];

    if (bet.doubled && vulnerable) {
      await query(`INSERT INTO strategy_activations (bet_id, strategy_id, rationale) VALUES ($1, 38, $2) ON CONFLICT (bet_id, strategy_id) DO NOTHING`,
        [bet.bet_id, `Vulnerable fave (${vulnReason}) + ${entries.length} horses`]);
      activations.push('Doubled');
    }

    if (vulnerable) {
      await query(`INSERT INTO strategy_activations (bet_id, strategy_id, rationale) VALUES ($1, 1, $2) ON CONFLICT (bet_id, strategy_id) DO NOTHING`,
        [bet.bet_id, vulnReason]);
      activations.push('Vulnerable Fave');
    }

    // S1: Elite jockey on bomb
    const ml = parseOddsForStrat(winPick.morning_line_odds);
    if (ml && ml >= 12) {
      const jockey = winPick.jockey || '';
      const topJockeys = ['Prat', 'Ortiz', 'Saez', 'Velazquez', 'Gaffalione', 'Rosario', 'Castellano', 'Franco'];
      if (topJockeys.some((j: string) => jockey.includes(j))) {
        await query(`INSERT INTO strategy_activations (bet_id, strategy_id, rationale) VALUES ($1, 6, $2) ON CONFLICT (bet_id, strategy_id) DO NOTHING`,
          [bet.bet_id, `Elite jockey ${jockey} on ${ml.toFixed(1)}/1 shot`]);
        activations.push('S1');
      }
    }

    // S4: Hot barn at a price (trainer angle)
    if (ml && ml >= 6 && winPick.trainer) {
      const stats = typeof winPick.stats === 'string' ? JSON.parse(winPick.stats) : winPick.stats;
      const trainerStats = stats?.trainer;
      if (trainerStats && trainerStats.starts >= 5 && (trainerStats.wins / trainerStats.starts) >= 0.15) {
        await query(`INSERT INTO strategy_activations (bet_id, strategy_id, rationale) VALUES ($1, 3, $2) ON CONFLICT (bet_id, strategy_id) DO NOTHING`,
          [bet.bet_id, `${winPick.trainer} ${trainerStats.wins}/${trainerStats.starts} (${Math.round(trainerStats.wins/trainerStats.starts*100)}%) at ${ml.toFixed(1)}/1`]);
        activations.push('S4');
      }
    }

    // S5: Distance stretch-out
    const pps = typeof winPick.past_performances === 'string' ? JSON.parse(winPick.past_performances) : (winPick.past_performances || []);
    const raceDistance = winPick.race_distance || bet.distance;
    if (pps.length > 0 && raceDistance) {
      const maxPPDist = Math.max(...pps.map((p: any) => p.distance_yards || 0));
      if (maxPPDist > 0 && raceDistance > maxPPDist) {
        await query(`INSERT INTO strategy_activations (bet_id, strategy_id, rationale) VALUES ($1, 10, $2) ON CONFLICT (bet_id, strategy_id) DO NOTHING`,
          [bet.bet_id, 'First time at this distance']);
        activations.push('S5');
      }
    }

    // S6: Best last Beyer in field
    const lastBeyers = entries.filter((e: any) => e.last_beyer).map((e: any) => e.last_beyer);
    if (winPick.last_beyer && lastBeyers.length > 0 && winPick.last_beyer === Math.max(...lastBeyers)) {
      await query(`INSERT INTO strategy_activations (bet_id, strategy_id, rationale) VALUES ($1, 7, $2) ON CONFLICT (bet_id, strategy_id) DO NOTHING`,
        [bet.bet_id, `Best last Beyer in field: ${winPick.last_beyer}`]);
      activations.push('S6');
    }

    // S9: Distance ceiling leader
    if (winPick.best_beyer && entries.length > 0) {
      const fieldBeyers = entries.filter((e: any) => e.best_beyer).map((e: any) => e.best_beyer);
      if (fieldBeyers.length > 0 && winPick.best_beyer === Math.max(...fieldBeyers)) {
        await query(`INSERT INTO strategy_activations (bet_id, strategy_id, rationale) VALUES ($1, 4, $2) ON CONFLICT (bet_id, strategy_id) DO NOTHING`,
          [bet.bet_id, `Distance ceiling leader: ${winPick.best_beyer}`]);
        activations.push('S9');
      }
    }

    // Always tag Beyer Ceiling Box (default construction method)
    await query(`INSERT INTO strategy_activations (bet_id, strategy_id, rationale) VALUES ($1, 33, $2) ON CONFLICT (bet_id, strategy_id) DO NOTHING`,
      [bet.bet_id, `Box built by distance-Beyer sort (${entries.length} field)`]);
    activations.push('Beyer Ceiling Box');

    if (activations.length > 0) {
      await logEvent(bet.race_id, 'strategies_tagged', `Auto-tagged: ${activations.join(', ')}`);
    }
  }

  if (untaggedBets.length > 0) {
    await logEvent(null, 'strategy_tagging', `Tagged ${untaggedBets.length} untagged Commission bets with strategies.`);
  }
}

function parseOddsForStrat(ml: any): number | null {
  if (!ml) return null;
  const s = String(ml);
  if (s.includes('/')) { const [n, d] = s.split('/').map(Number); return d ? n / d : null; }
  if (s.includes('-')) { const [n, d] = s.split('-').map(Number); return d ? n / d : parseFloat(s); }
  return parseFloat(s);
}

// --- MAIN HANDLER ---

export default async function handler(req: any, res: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const et = getETNow();
  if (et.hours < 10 || et.hours >= 22) {
    return res.status(200).json({ status: 'outside operating hours', et: `${et.hours}:${et.minutes}` });
  }

  const now = new Date();
  const etDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const today = `${etDate.getFullYear()}-${String(etDate.getMonth() + 1).padStart(2, '0')}-${String(etDate.getDate()).padStart(2, '0')}`;

  // Load today's Commission races
  const { rows: raceRows } = await query(
    `SELECT DISTINCT r.id, r.track, r.race_number, r.post_time
     FROM races r JOIN bets b ON b.race_id = r.id
     WHERE r.date = $1 AND b.conviction IS NOT NULL
     ORDER BY r.post_time NULLS LAST, r.race_number`,
    [today]
  );

  if (raceRows.length === 0) {
    return res.status(200).json({ status: 'no commission races today' });
  }

  // Morning plan notification
  if (!(await eventExists(null, 'morning_plan'))) {
    const tracks = [...new Set(raceRows.map((r: any) => r.track))];
    const firstPost = raceRows.find((r: any) => r.post_time)?.post_time;
    const msg = `Today's card: ${raceRows.length} Commission picks across ${tracks.length} track${tracks.length > 1 ? 's' : ''} (${tracks.join(', ')}). ${firstPost ? `First post: ${firstPost} ET.` : ''}`;
    await logEvent(null, 'morning_plan', msg, { races: raceRows.length, tracks });
    await postSlack(`🏇 ${msg}`);
  }

  // Check for missing post times (gate)
  const missingPostTime = raceRows.filter((r: any) => !r.post_time);
  if (missingPostTime.length > 0 && !(await eventExists(null, 'post_time_missing'))) {
    const missing = missingPostTime.map((r: any) => `${r.track} R${r.race_number}`).join(', ');
    const msg = `BLOCKED: ${missingPostTime.length} race(s) missing post times: ${missing}. Pipeline cannot fire until confirmed.`;
    await logEvent(null, 'post_time_missing', msg, { races: missing });
    await postSlack(`🚨 ${msg}`);
  }

  // Resolve meet IDs from Racing API
  const meetIds = await resolveMeetIds(today);

  // Load full bet info per race
  const commissionRaces: CommissionRace[] = [];
  for (const row of raceRows) {
    if (!row.post_time) continue;
    const { rows: betRows } = await query(
      `SELECT bet_type, stake, entries_used, doubled FROM bets WHERE race_id = $1`, [row.id]
    );
    const winBet = betRows.find((b: any) => b.bet_type === 'win');
    const exBet = betRows.find((b: any) => b.bet_type === 'exacta');
    if (!winBet?.entries_used?.length) continue;

    commissionRaces.push({
      id: row.id,
      track: row.track,
      race_number: row.race_number,
      post_time: row.post_time,
      win_pick: winBet.entries_used[0],
      box: exBet?.entries_used || [],
      total_stake: betRows.reduce((s: number, b: any) => s + b.stake, 0),
      doubled: winBet.doubled,
    });
  }

  // Ensure all Commission bets have strategy tags (runs every cycle, idempotent)
  await ensureStrategyTags();

  // Per-race pipeline
  const actions: string[] = [];
  for (const race of commissionRaces) {
    const postMinutes = parsePostTime(race.post_time!);
    const minutesUntilPost = postMinutes - et.totalMinutes;

    if (minutesUntilPost <= 60 && minutesUntilPost > 50) {
      await pullLiveOdds(race, meetIds);
      actions.push(`${race.track} R${race.race_number}: odds`);
    } else if (minutesUntilPost <= 50 && minutesUntilPost > 35) {
      await checkScratches(race, meetIds);
      actions.push(`${race.track} R${race.race_number}: scratches`);
    } else if (minutesUntilPost <= 35 && minutesUntilPost > 20) {
      await sendPreRaceEmail(race);
      actions.push(`${race.track} R${race.race_number}: email`);
    } else if (minutesUntilPost <= -15) {
      await settleRace(race, meetIds);
      actions.push(`${race.track} R${race.race_number}: settle`);
    }
  }

  // End-of-day summary
  if (!(await eventExists(null, 'eod_summary'))) {
    const allSettledOrDropped = commissionRaces.every(async (race) => {
      return await eventExists(race.id, 'results_settled') || await eventExists(race.id, 'race_dropped');
    });
    // Simple check: count settled + dropped vs total
    const { rows: settledCount } = await query(
      `SELECT COUNT(*) as cnt FROM pipeline_events WHERE date = CURRENT_DATE AND event_type IN ('results_settled', 'race_dropped')`,
    );
    if (parseInt(settledCount[0]?.cnt || '0') >= commissionRaces.length && commissionRaces.length > 0) {
      const { rows: perfRows } = await query(
        `SELECT SUM(b.stake) as wagered FROM bets b JOIN races r ON r.id = b.race_id
         WHERE r.date = CURRENT_DATE AND b.conviction IS NOT NULL`
      );
      const wagered = parseFloat(perfRows[0]?.wagered || '0');
      const msg = `Day complete. ${commissionRaces.length} Commission races settled. Total wagered: $${wagered.toFixed(2)}.`;
      await logEvent(null, 'eod_summary', msg);
      await postSlack(`🏁 ${msg}`);
    }
  }

  return res.status(200).json({
    status: 'ok',
    et: `${et.hours}:${String(et.minutes).padStart(2, '0')}`,
    commission_races: commissionRaces.length,
    actions
  });
}
