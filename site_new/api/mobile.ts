import { query } from './db.js';

function formatTime(t: string | null): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
}

function parsePP(entry: string): string {
  return entry.replace(/^#/, '').split(' ')[0];
}

export default async function handler(req: any, res: any) {
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const today = `${et.getFullYear()}-${String(et.getMonth() + 1).padStart(2, '0')}-${String(et.getDate()).padStart(2, '0')}`;
  const currentTime = `${String(et.getHours()).padStart(2, '0')}:${String(et.getMinutes()).padStart(2, '0')}`;

  // Get today's bets
  const { rows: bets } = await query(
    `SELECT b.id, b.race_id, b.bet_type, b.stake, b.doubled, b.conviction, b.entries_used,
            r.track, r.race_number, r.conditions, r.distance, r.surface, r.field_size, r.post_time
     FROM bets b JOIN races r ON r.id = b.race_id
     WHERE r.date = $1
     ORDER BY r.post_time NULLS LAST, r.track, r.race_number, b.id`,
    [today]
  );

  // Get results
  const raceIds = [...new Set(bets.map((b: any) => b.race_id))];
  let results: Record<number, any> = {};
  if (raceIds.length > 0) {
    const { rows: resultRows } = await query(
      `SELECT r.race_id, r.win_payout, r.exacta_payout, r.trifecta_payout, r.superfecta_payout,
              ew.post_position AS win_pp, hw.name AS win_horse,
              ep.post_position AS place_pp, hp.name AS place_horse,
              es.post_position AS show_pp, hs.name AS show_horse,
              ef.post_position AS fourth_pp, hf.name AS fourth_horse
       FROM results r
       LEFT JOIN entries ew ON ew.id = r.win_entry_id LEFT JOIN horses hw ON hw.id = ew.horse_id
       LEFT JOIN entries ep ON ep.id = r.place_entry_id LEFT JOIN horses hp ON hp.id = ep.horse_id
       LEFT JOIN entries es ON es.id = r.show_entry_id LEFT JOIN horses hs ON hs.id = es.horse_id
       LEFT JOIN entries ef ON ef.id = r.fourth_entry_id LEFT JOIN horses hf ON hf.id = ef.horse_id
       WHERE r.race_id = ANY($1)`,
      [raceIds]
    );
    for (const r of resultRows) results[r.race_id] = r;
  }

  // Group bets by race
  interface Race { race_id: number; track: string; race_number: number; post_time: string | null; bets: any[]; total_stake: number; }
  const raceMap = new Map<number, Race>();
  for (const bet of bets) {
    if (!raceMap.has(bet.race_id)) {
      raceMap.set(bet.race_id, { race_id: bet.race_id, track: bet.track, race_number: bet.race_number, post_time: bet.post_time, bets: [], total_stake: 0 });
    }
    const r = raceMap.get(bet.race_id)!;
    r.bets.push(bet);
    r.total_stake += bet.stake;
  }
  const races = [...raceMap.values()].sort((a, b) => {
    if (!a.post_time && !b.post_time) return 0;
    if (!a.post_time) return 1;
    if (!b.post_time) return -1;
    return a.post_time.localeCompare(b.post_time);
  });

  // Categorize
  const upcoming: Race[] = [], pending: Race[] = [], settled: (Race & { result: any })[] = [];
  for (const race of races) {
    const result = results[race.race_id];
    if (result) settled.push({ ...race, result });
    else if (race.post_time && race.post_time.slice(0, 5) < currentTime) pending.push(race);
    else upcoming.push(race);
  }

  // Performance
  let totalWagered = 0, totalCollected = 0;
  for (const race of settled) {
    const result = race.result;
    for (const bet of race.bets) {
      totalWagered += bet.stake;
      const boxPPs = (bet.entries_used || []).map(parsePP);
      const wpp = String(result.win_pp), ppp = String(result.place_pp), spp = String(result.show_pp);
      const fpp = result.fourth_pp ? String(result.fourth_pp) : null;
      if (bet.bet_type === 'win') {
        const pickPP = parsePP(bet.entries_used[0]);
        if (pickPP === wpp && result.win_payout) totalCollected += (result.win_payout / 2) * bet.stake;
      } else if (bet.bet_type === 'exacta') {
        if (boxPPs.includes(wpp) && boxPPs.includes(ppp) && result.exacta_payout) {
          const n = boxPPs.length; totalCollected += result.exacta_payout * (bet.stake / (n * (n - 1)));
        }
      } else if (bet.bet_type === 'trifecta') {
        if (boxPPs.includes(wpp) && boxPPs.includes(ppp) && boxPPs.includes(spp) && result.trifecta_payout) {
          const n = boxPPs.length; totalCollected += result.trifecta_payout * (bet.stake / (n * (n - 1) * (n - 2)));
        }
      } else if (bet.bet_type === 'superfecta') {
        if (boxPPs.includes(wpp) && boxPPs.includes(ppp) && boxPPs.includes(spp) && fpp && boxPPs.includes(fpp) && result.superfecta_payout) {
          const n = boxPPs.length; totalCollected += result.superfecta_payout * (bet.stake / (n * (n - 1) * (n - 2) * (n - 3)));
        }
      }
    }
  }
  for (const race of [...pending, ...upcoming]) {
    for (const bet of race.bets) totalWagered += bet.stake;
  }
  const net = totalCollected - totalWagered;

  // Build cards HTML
  function renderCard(race: Race, result: any, status: string): string {
    const winBet = race.bets.find(b => b.bet_type === 'win');
    const exBet = race.bets.find(b => b.bet_type === 'exacta');
    const boxPPs = (exBet?.entries_used || []).map(parsePP);
    let cardClass = 'race-card', badgeHtml = '', stakeHtml = `<span class="race-stake">$${race.total_stake.toFixed(0)}</span>`, detailHtml = '';

    if (result) {
      const wpp = String(result.win_pp), ppp = String(result.place_pp), spp = String(result.show_pp);
      const winHit = winBet ? parsePP(winBet.entries_used[0]) === wpp : false;
      const exHit = boxPPs.includes(wpp) && boxPPs.includes(ppp);
      const triHit = exHit && boxPPs.includes(spp);
      const anyHit = winHit || exHit || triHit;
      cardClass += anyHit ? ' hit' : ' miss';
      const bestHit = winHit ? 'WIN' : triHit ? 'TRI' : exHit ? 'EX' : 'MISS';
      badgeHtml = `<span class="badge ${anyHit ? 'badge-hit' : 'badge-miss'}">${bestHit}</span>`;

      let collected = 0;
      if (winHit && result.win_payout) collected += (result.win_payout / 2) * (winBet?.stake || 25);
      if (exHit && result.exacta_payout) { const n = boxPPs.length; collected += result.exacta_payout * ((exBet?.stake || 50) / (n * (n - 1))); }
      if (triHit && result.trifecta_payout) { const n = boxPPs.length; const triBet = race.bets.find(b => b.bet_type === 'trifecta'); collected += result.trifecta_payout * ((triBet?.stake || 24) / (n * (n - 1) * (n - 2))); }
      const raceNet = collected - race.total_stake;
      stakeHtml = `<span class="race-stake ${raceNet >= 0 ? 'positive' : 'negative'}">${raceNet >= 0 ? '+' : '-'}$${Math.abs(raceNet).toFixed(0)}</span>`;
      detailHtml = `<div class="race-detail"><div class="finish-row"><strong>#${result.win_pp} ${result.win_horse}</strong> &mdash; #${result.place_pp} ${result.place_horse} &mdash; #${result.show_pp} ${result.show_horse}${result.fourth_pp ? ` &mdash; #${result.fourth_pp} ${result.fourth_horse || ''}` : ''}</div><div class="bets-row"><span class="bet-chip ${winHit ? 'hit' : 'miss'}">WIN</span><span class="bet-chip ${exHit ? 'hit' : 'miss'}">EX${exHit ? ' HIT' : ''}</span><span class="bet-chip ${triHit ? 'hit' : 'miss'}">TRI</span></div></div>`;
    } else if (status === 'pending') {
      cardClass += ' live';
      badgeHtml = '<span class="badge badge-pending">PENDING</span>';
      detailHtml = `<div class="race-detail"><div class="finish-row">Win pick: <strong>${winBet?.entries_used?.[0] || ''}</strong></div></div>`;
    } else {
      if (status === 'next') badgeHtml = '<span class="badge badge-next">NEXT</span>';
      detailHtml = `<div class="race-detail"><div class="finish-row">Win pick: <strong>${winBet?.entries_used?.[0] || ''}</strong>${winBet?.doubled ? ' <span class="badge badge-hit">2x</span>' : ''}</div></div>`;
    }

    return `<div class="${cardClass}"><div class="race-top"><div class="race-left"><div class="race-track">${race.track}</div><div class="race-num-row"><span class="race-prefix">R</span><span class="race-number">${race.race_number}</span></div><div class="race-time">${formatTime(race.post_time)} ${badgeHtml}</div></div><div class="race-right">${stakeHtml}</div></div>${detailHtml}</div>`;
  }

  let cardsHtml = '';
  if (pending.length > 0) {
    cardsHtml += '<div class="section-label"><span class="dot"></span> Awaiting Results</div>';
    for (const race of pending) cardsHtml += renderCard(race, null, 'pending');
  }
  if (upcoming.length > 0) {
    cardsHtml += '<div class="section-label">Upcoming</div>';
    upcoming.forEach((race, i) => { cardsHtml += renderCard(race, null, i === 0 ? 'next' : 'upcoming'); });
  }
  if (settled.length > 0) {
    cardsHtml += '<div class="section-label">Results</div>';
    for (const race of settled) cardsHtml += renderCard(race, race.result, 'settled');
  }

  const dateStr = et.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <title>FTC Race Day</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, sans-serif; background: #faf9f6; color: #111827; -webkit-font-smoothing: antialiased; }
    .container { max-width: 28rem; margin: 0 auto; padding: 1rem; padding-bottom: 4rem; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .header h1 { font-size: 1.125rem; font-weight: 700; }
    .header .meta { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600; }
    .perf-bar { background: #fff; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 0.875rem; margin-bottom: 1rem; }
    .perf-row { display: flex; justify-content: space-between; align-items: baseline; }
    .perf-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; font-weight: 600; }
    .perf-value { font-size: 1.875rem; font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1; }
    .perf-value.positive { color: #16a34a; }
    .perf-value.negative { color: #ef4444; }
    .perf-sub { font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem; }
    .section-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; font-weight: 600; padding: 0 0.25rem; margin-bottom: 0.5rem; margin-top: 1.25rem; }
    .race-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 1rem; margin-bottom: 0.5rem; }
    .race-card.hit { border-color: rgba(22,163,74,0.4); background: rgba(22,163,74,0.04); }
    .race-card.miss { border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.03); }
    .race-card.live { border-color: rgba(22,163,74,0.4); }
    .race-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; }
    .race-left { display: flex; flex-direction: column; min-width: 0; }
    .race-track { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; font-weight: 600; }
    .race-num-row { display: flex; align-items: baseline; gap: 2px; line-height: 1; }
    .race-prefix { font-size: 0.875rem; font-weight: 700; color: #6b7280; }
    .race-number { font-size: 1.875rem; font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1; }
    .race-time { font-size: 0.75rem; color: #6b7280; font-variant-numeric: tabular-nums; margin-top: 0.25rem; }
    .race-right { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
    .race-stake { font-size: 1.125rem; font-weight: 700; font-variant-numeric: tabular-nums; color: #111827; }
    .race-stake.positive { color: #16a34a; }
    .race-stake.negative { color: #ef4444; }
    .badge { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; padding: 2px 6px; border-radius: 4px; }
    .badge-pending { background: rgba(17,24,39,0.1); color: #111827; }
    .badge-hit { background: rgba(22,163,74,0.15); color: #16a34a; }
    .badge-miss { background: rgba(239,68,68,0.1); color: #ef4444; }
    .badge-next { background: #111827; color: #fff; }
    .race-detail { margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e5e7eb; }
    .finish-row { font-size: 0.6875rem; color: #6b7280; margin-bottom: 0.375rem; }
    .finish-row strong { color: #111827; }
    .bets-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .bet-chip { font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; }
    .bet-chip.hit { background: rgba(22,163,74,0.15); color: #16a34a; }
    .bet-chip.miss { color: rgba(107,114,128,0.5); text-decoration: line-through; }
    .dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #16a34a; animation: pulse 2s infinite; margin-right: 4px; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .refresh { text-align: center; margin-top: 1.5rem; }
    .refresh a { font-size: 0.75rem; color: #6b7280; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Race Day</h1>
      <div class="meta">${dateStr}</div>
    </div>
    <div class="perf-bar">
      <div class="perf-row">
        <div>
          <div class="perf-label">P/L</div>
          <div class="perf-value ${net >= 0 ? 'positive' : 'negative'}">${net >= 0 ? '+' : ''}$${net.toFixed(2)}</div>
        </div>
        <div style="text-align:right">
          <div class="perf-label">Settled</div>
          <div style="font-size:1.25rem;font-weight:700;">${settled.length}/${races.length}</div>
        </div>
      </div>
      <div class="perf-sub">Wagered $${totalWagered.toFixed(0)} &middot; Collected $${totalCollected.toFixed(2)}</div>
    </div>
    ${cardsHtml}
    <div class="refresh"><a href="/mobile">Refresh</a></div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.status(200).send(html);
}
