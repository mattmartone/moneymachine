import { query } from './db.js';

function parsePP(entry: string): string {
  return entry.replace(/^#/, '').split(' ')[0];
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default async function handler(req: any, res: any) {
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const today = `${et.getFullYear()}-${String(et.getMonth() + 1).padStart(2, '0')}-${String(et.getDate()).padStart(2, '0')}`;
  const currentTime = `${String(et.getHours()).padStart(2, '0')}:${String(et.getMinutes()).padStart(2, '0')}`;

  const { rows: bets } = await query(
    `SELECT b.race_id, b.bet_type, b.stake, b.doubled, b.entries_used, b.conviction,
            r.track, r.race_number, r.post_time
     FROM bets b JOIN races r ON r.id = b.race_id
     WHERE r.date = $1 ORDER BY r.post_time NULLS LAST, r.race_number`,
    [today]
  );

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

  const seen = new Set<number>();
  let cards = '';
  let totalNet = 0;
  let settled = 0;
  let total = 0;

  for (const bet of bets) {
    if (seen.has(bet.race_id)) continue;
    seen.add(bet.race_id);
    total++;

    const raceBets = bets.filter((b: any) => b.race_id === bet.race_id);
    const winBet = raceBets.find((b: any) => b.bet_type === 'win');
    const exBet = raceBets.find((b: any) => b.bet_type === 'exacta');
    const triBet = raceBets.find((b: any) => b.bet_type === 'trifecta');
    const superBet = raceBets.find((b: any) => b.bet_type === 'superfecta');
    const result = results[bet.race_id];
    const isPlan = raceBets.every((b: any) => b.conviction === 'plan');

    let status = 'UPCOMING';
    if (result) { status = 'SETTLED'; settled++; }
    else if (bet.post_time && bet.post_time.slice(0, 5) < currentTime) status = 'RUNNING';

    const postTimeStr = bet.post_time ? formatTime(bet.post_time) : '—';
    const winPickPP = winBet?.entries_used?.[0] ? parsePP(winBet.entries_used[0]) : '';
    const boxPPs = (exBet?.entries_used || []).map(parsePP);
    const n = boxPPs.length;
    const totalStake = raceBets.reduce((s: number, b: any) => s + b.stake, 0);

    let resultSection = '';
    let raceNet = -totalStake;

    if (result) {
      const wpp = String(result.win_pp), ppp = String(result.place_pp), spp = String(result.show_pp);
      const fpp = result.fourth_pp ? String(result.fourth_pp) : null;
      const winHit = winPickPP === wpp;
      const exHit = boxPPs.includes(wpp) && boxPPs.includes(ppp);
      const triHit = exHit && boxPPs.includes(spp);
      const superHit = triHit && !!fpp && boxPPs.includes(fpp);

      const winCollected = winHit && result.win_payout ? (parseFloat(result.win_payout) / 2) * (winBet?.stake || 0) : 0;
      const exCollected = exHit && result.exacta_payout && n > 1 ? parseFloat(result.exacta_payout) * ((exBet?.stake || 0) / (n * (n - 1))) : 0;
      const triCollected = triHit && result.trifecta_payout && n > 2 ? parseFloat(result.trifecta_payout) * ((triBet?.stake || 0) / (n * (n - 1) * (n - 2))) : 0;
      const superCollected = superHit && result.superfecta_payout && n > 3 ? parseFloat(result.superfecta_payout) * ((superBet?.stake || 0) / (n * (n - 1) * (n - 2) * (n - 3))) : 0;
      const collected = winCollected + exCollected + triCollected + superCollected;
      raceNet = collected - totalStake;

      function row(name: string, hit: boolean, stake: number, col: number, raw: string | null) {
        const net = col - stake;
        return `<tr>
          <td class="bet-cell">${name}</td>
          <td class="bet-cell">$${stake}</td>
          <td class="bet-cell">${raw || '—'}</td>
          <td class="bet-cell ${hit ? 'hit' : 'miss'}">${hit ? 'HIT' : 'miss'}</td>
          <td class="bet-cell ${hit ? 'hit' : 'miss'}">${col > 0 ? '$' + col.toFixed(2) : '—'}</td>
          <td class="bet-cell ${net >= 0 ? 'net-pos' : 'net-neg'}">${net >= 0 ? '+' : ''}$${net.toFixed(2)}</td>
        </tr>`;
      }

      resultSection = `
        <div class="result-section">
          <div class="result-label">FINISH</div>
          <div class="finish-order">#${result.win_pp} ${result.win_horse} — #${result.place_pp} ${result.place_horse} — #${result.show_pp} ${result.show_horse}${result.fourth_pp ? ' — #' + result.fourth_pp + ' ' + (result.fourth_horse || '') : ''}</div>
          <table class="bet-table">
            <thead>
              <tr>
                <th>Bet</th><th>Wagered</th><th>Track Pays</th><th>Result</th><th>Collected</th><th>Net</th>
              </tr>
            </thead>
            <tbody>
              ${row('Win', winHit, winBet?.stake || 0, winCollected, result.win_payout ? '$' + parseFloat(result.win_payout).toFixed(2) + ' on $2' : null)}
              ${row('Exacta', exHit, exBet?.stake || 0, exCollected, result.exacta_payout ? '$' + parseFloat(result.exacta_payout).toFixed(2) + ' on $1' : null)}
              ${row('Trifecta', triHit, triBet?.stake || 0, triCollected, result.trifecta_payout ? '$' + parseFloat(result.trifecta_payout).toFixed(2) + ' on $1' : null)}
              ${row('Super', superHit, superBet?.stake || 0, superCollected, result.superfecta_payout ? '$' + parseFloat(result.superfecta_payout).toFixed(2) + ' on $0.10' : null)}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="4">Total</td>
                <td class="${raceNet >= 0 ? 'net-pos' : 'net-neg'}">$${collected.toFixed(2)}</td>
                <td class="${raceNet >= 0 ? 'net-pos' : 'net-neg'}">${raceNet >= 0 ? '+' : ''}$${raceNet.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>`;
    }

    if (status === 'SETTLED') totalNet += raceNet;

    // Top-right area: net P/L for settled, post time for upcoming
    let topRight = '';
    if (status === 'SETTLED') {
      const netColor = raceNet >= 0 ? 'net-pos' : 'net-neg';
      topRight = `<span class="race-net ${netColor}">${raceNet >= 0 ? '+' : '-'}$${Math.abs(raceNet).toFixed(2)}</span>`;
    } else {
      topRight = `<span class="race-status">${postTimeStr}${isPlan ? ' · plan' : ''}</span>`;
    }

    // Status badge for non-settled
    let statusBadge = '';
    if (status === 'RUNNING') {
      statusBadge = `<span class="badge badge-running">RUNNING</span>`;
    }

    cards += `
      <div class="race-card">
        <div class="card-header">
          <div class="card-left">
            <div class="track-name">${bet.track}</div>
            <div class="race-number">R${bet.race_number}</div>
            <div class="post-time">${postTimeStr}</div>
          </div>
          <div class="card-right">
            ${topRight}
            ${statusBadge}
          </div>
        </div>
        <div class="wagering-plan">
          <div class="wagering-label">WAGERING PLAN</div>
          <div class="wagering-detail">Win: ${winBet?.entries_used?.[0] || '—'} ($${winBet?.stake || 0}${winBet?.doubled ? ' DOUBLED' : ''}) · Box: ${boxPPs.join('-')}</div>
        </div>
        ${resultSection}
      </div>`;
  }

  const netBannerColor = totalNet >= 0 ? 'net-pos' : 'net-neg';
  const formattedCurrentTime = formatTime(currentTime);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FTC Race Day</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
      background: rgb(250, 249, 246);
      padding: 16px;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      color: #111827;
    }

    .container {
      max-width: 500px;
      margin: 0 auto;
    }

    /* Header / Net P/L Banner */
    .header {
      text-align: center;
      padding: 20px 0 24px;
    }

    .header-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #6b7280;
      font-weight: 600;
    }

    .header-net {
      font-size: 40px;
      font-weight: 800;
      margin-top: 6px;
      line-height: 1;
    }

    .header-meta {
      font-size: 12px;
      color: #6b7280;
      margin-top: 8px;
    }

    /* Race Cards */
    .race-card {
      background: #fff;
      border: 1px solid rgb(229, 231, 235);
      border-radius: 1rem;
      padding: 1rem;
      margin-bottom: 0.75rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .card-left {}

    .card-right {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .track-name {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
      color: #6b7280;
    }

    .race-number {
      font-size: 1.875rem;
      font-weight: 700;
      color: #111827;
      line-height: 1.1;
    }

    .post-time {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 2px;
    }

    .race-net {
      font-size: 20px;
      font-weight: 800;
    }

    .race-status {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    }

    .badge {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 2px 8px;
      border-radius: 9999px;
    }

    .badge-running {
      background: rgba(234, 179, 8, 0.1);
      color: #a16207;
      border: 1px solid rgba(234, 179, 8, 0.3);
    }

    /* Wagering Plan */
    .wagering-plan {
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid rgb(229, 231, 235);
    }

    .wagering-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 4px;
    }

    .wagering-detail {
      font-size: 13px;
      color: #374151;
      font-weight: 500;
      line-height: 1.4;
    }

    /* Result Section */
    .result-section {
      margin-top: 12px;
      padding: 12px;
      background: rgb(249, 250, 251);
      border: 1px solid rgb(229, 231, 235);
      border-radius: 0.75rem;
    }

    .result-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #6b7280;
      font-weight: 600;
      margin-bottom: 6px;
    }

    .finish-order {
      font-weight: 700;
      font-size: 13px;
      color: #111827;
      margin-bottom: 12px;
      line-height: 1.3;
    }

    /* Bet Table */
    .bet-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }

    .bet-table thead th {
      text-align: left;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      font-weight: 600;
      padding: 4px 5px;
      border-bottom: 1px solid rgb(229, 231, 235);
    }

    .bet-table tbody td.bet-cell {
      padding: 5px 5px;
      border-bottom: 1px solid rgba(229, 231, 235, 0.5);
      color: #374151;
      font-size: 11px;
    }

    .bet-table tbody td.hit {
      color: #16a34a;
      font-weight: 600;
    }

    .bet-table tbody td.miss {
      color: #9ca3af;
      font-weight: 400;
    }

    .bet-table tbody td.net-pos {
      color: #16a34a;
      font-weight: 600;
    }

    .bet-table tbody td.net-neg {
      color: #ef4444;
      font-weight: 600;
    }

    .bet-table tfoot .total-row td {
      padding: 8px 5px 4px;
      font-weight: 700;
      font-size: 12px;
      border-top: 2px solid rgb(229, 231, 235);
      border-bottom: none;
    }

    .bet-table tfoot .total-row td.net-pos {
      color: #16a34a;
    }

    .bet-table tfoot .total-row td.net-neg {
      color: #ef4444;
    }

    /* Global color utilities */
    .net-pos { color: #16a34a; }
    .net-neg { color: #ef4444; }

    /* Footer */
    .footer {
      text-align: center;
      padding: 20px 0 8px;
      font-size: 13px;
      color: #6b7280;
      font-style: italic;
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 48px 16px;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-label">NET P/L TODAY</div>
      <div class="header-net ${netBannerColor}">${totalNet >= 0 ? '+' : '-'}$${Math.abs(totalNet).toFixed(2)}</div>
      <div class="header-meta">${settled} of ${total} settled · ${formattedCurrentTime} ET</div>
    </div>
    ${cards || '<div class="empty-state">No bets loaded for today.</div>'}
    <div class="footer">Never bet the favorite.</div>
  </div>
</body>
</html>`);
}
