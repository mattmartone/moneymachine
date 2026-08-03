import { query } from './db.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const date = req.query?.date || '2026-08-01';
  const race = req.query?.race ? parseInt(req.query.race) : null;

  try {
    const { rows: races } = await query(`
      SELECT r.id, r.race_number, r.distance, r.surface, r.conditions, r.post_time, r.purse, r.field_size, r.race_theory, r.projected_finish
      FROM races r WHERE r.date = $1 AND r.track = 'Saratoga'
      ${race ? 'AND r.race_number = ' + race : ''}
      ORDER BY r.race_number
    `, [date]);

    const { rows: entries } = await query(`
      SELECT r.race_number, e.post_position, h.name, e.morning_line_odds, e.best_beyer, e.last_beyer, e.running_style, e.scratched, e.jockey
      FROM entries e JOIN horses h ON h.id = e.horse_id JOIN races r ON r.id = e.race_id
      WHERE r.date = $1 AND r.track = 'Saratoga'
      ${race ? 'AND r.race_number = ' + race : ''}
      ORDER BY r.race_number, e.post_position
    `, [date]);

    const { rows: scored } = await query(`
      SELECT r.race_number, sc.win_pick_pp, sc.win_pick_name, sc.composite_score, sc.fave_pp, sc.box_pps, sc.conviction
      FROM scored_candidates sc JOIN races r ON r.id = sc.race_id
      WHERE sc.date = $1 AND r.track = 'Saratoga' AND sc.status = 'scored'
      ORDER BY r.race_number
    `, [date]);

    const scoredMap: Record<number, any> = {};
    for (const s of scored) scoredMap[s.race_number] = s;

    const totalRaces = races.length;

    if (race) {
      const raceData = races[0];
      if (!raceData) return res.status(404).json({ error: 'Race not found' });
      const sc = scoredMap[race];
      const raceEntries = entries.filter((e: any) => e.race_number === race);
      const postTime = raceData.post_time ? formatTime(raceData.post_time) : '—';
      const prevRace = findAdjacentRace(races, race, -1, date);
      const nextRace = findAdjacentRace(races, race, 1, date);
      const projFinish: string[] = raceData.projected_finish || [];

      let fieldRows = '';
      for (const e of raceEntries) {
        const finishPos = projFinish.indexOf(String(e.post_position));
        const posLabel = finishPos >= 0 ? finishPos + 1 : null;
        const rowClass = posLabel === 1 ? 'first-row' : posLabel === 2 ? 'second-row' : posLabel === 3 ? 'third-row' : posLabel === 4 ? 'fourth-row' : '';
        fieldRows += `
          <tr class="${rowClass} ${e.scratched ? 'scratched-row' : ''}">
            <td class="pp">${e.post_position}</td>
            <td class="horse">${e.name}${posLabel ? ' <span class="pos-badge pos-' + posLabel + '">' + posLabel + getOrdinal(posLabel) + '</span>' : ''}${e.scratched ? ' <span class="scr-badge">SCR</span>' : ''}</td>
            <td class="ml">${e.morning_line_odds || '—'}</td>
            <td class="beyer">${e.best_beyer || '—'}${e.last_beyer && e.best_beyer !== e.last_beyer ? '/' + e.last_beyer : ''}</td>
            <td class="style">${e.running_style || '—'}</td>
          </tr>`;
      }

      // Build projected outcome section
      let projectedHtml = '';
      if (projFinish.length >= 2) {
        const finishEntries = projFinish.slice(0, 4).map((pp, i) => {
          const entry = raceEntries.find((e: any) => String(e.post_position) === pp);
          return entry ? { pos: i + 1, name: entry.name, pp: entry.post_position, ml: entry.morning_line_odds } : null;
        }).filter(Boolean);
        projectedHtml = finishEntries.map((e: any) => `
          <div class="proj-horse proj-${e.pos}">
            <span class="proj-pos">#${e.pp}</span>
            <span class="proj-name">${e.name}</span>
            <span class="proj-ml">${e.ml}</span>
          </div>
        `).join('');
      }

      // Build actual results section
      let resultsHtml = '';
      const { rows: resRows } = await query(`
        SELECT res.win_payout, res.exacta_payout, res.place_payout,
               ew.post_position as win_pp, hw.name as win_name,
               ep.post_position as place_pp, hp.name as place_name,
               es.post_position as show_pp, hs.name as show_name
        FROM results res
        LEFT JOIN entries ew ON ew.id = res.win_entry_id LEFT JOIN horses hw ON hw.id = ew.horse_id
        LEFT JOIN entries ep ON ep.id = res.place_entry_id LEFT JOIN horses hp ON hp.id = ep.horse_id
        LEFT JOIN entries es ON es.id = res.show_entry_id LEFT JOIN horses hs ON hs.id = es.horse_id
        WHERE res.race_id = $1
      `, [raceData.id]);

      if (resRows.length > 0) {
        const r = resRows[0];
        const placeOnPP = projFinish[0] ? Number(projFinish[0]) : null;
        const boxPPs = projFinish.slice(0, 4).map(Number);
        const placeHit = placeOnPP && (placeOnPP === r.win_pp || placeOnPP === r.place_pp);
        const exactaHit = boxPPs.includes(r.win_pp) && boxPPs.includes(r.place_pp);

        const placeStake = 50;
        const exactaStake = 100;
        const combos = boxPPs.length * (boxPPs.length - 1);
        const placeCollected = placeHit && r.place_payout ? ((r.place_payout / 2) * placeStake) : (placeHit && r.win_payout ? ((r.win_payout / 2) * placeStake * 0.7) : 0);
        const exactaCollected = exactaHit && r.exacta_payout ? (r.exacta_payout * (exactaStake / combos)) : 0;
        const totalWagered = placeStake + exactaStake;
        const totalCollected = placeCollected + exactaCollected;
        const net = totalCollected - totalWagered;

        const placeNet = placeCollected - placeStake;
        const exactaNet = exactaCollected - exactaStake;

        const placePays = placeHit && r.place_payout ? '$' + r.place_payout + '/$2' : '—';
        const exactaPays = exactaHit && r.exacta_payout ? '$' + r.exacta_payout + '/$1' : '—';

        resultsHtml = `
          <div class="results-card ${net >= 0 ? 'results-hit' : 'results-miss'}">
            <div class="results-title">RESULT</div>
            <div class="results-finish-line">#${r.win_pp} ${r.win_name} → #${r.place_pp} ${r.place_name} → #${r.show_pp} ${r.show_name}</div>
            <table class="results-table">
              <thead>
                <tr><th>Bet</th><th>Wagered</th><th>Pays</th><th>Collected</th><th>Net</th></tr>
              </thead>
              <tbody>
                <tr class="${placeHit ? 'row-hit' : 'row-miss'}">
                  <td>Place #${placeOnPP}</td>
                  <td>$${placeStake}</td>
                  <td>${placePays}</td>
                  <td>$${placeCollected.toFixed(2)}</td>
                  <td class="${placeNet >= 0 ? 'total-positive' : 'total-negative'}">${placeNet >= 0 ? '+' : ''}$${placeNet.toFixed(2)}</td>
                </tr>
                <tr class="${exactaHit ? 'row-hit' : 'row-miss'}">
                  <td>Exacta ${boxPPs.join('-')}</td>
                  <td>$${exactaStake}</td>
                  <td>${exactaPays}</td>
                  <td>$${exactaCollected.toFixed(2)}</td>
                  <td class="${exactaNet >= 0 ? 'total-positive' : 'total-negative'}">${exactaNet >= 0 ? '+' : ''}$${exactaNet.toFixed(2)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td><strong>Total</strong></td>
                  <td><strong>$${totalWagered}</strong></td>
                  <td></td>
                  <td><strong>$${totalCollected.toFixed(2)}</strong></td>
                  <td class="${net >= 0 ? 'total-positive' : 'total-negative'}"><strong>${net >= 0 ? '+' : ''}$${net.toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>`;
      }

      const html = buildSingleRaceHtml(race, raceData, sc, postTime, fieldRows, prevRace, nextRace, totalRaces, date, projectedHtml, resultsHtml);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    } else {
      // Compute day summary across all races
      let dayWagered = 0, dayCollected = 0;
      const { rows: allResults } = await query(`
        SELECT r.race_number, r.projected_finish, r.surface, r.skip_reason, res.win_payout, res.exacta_payout, res.place_payout,
               ew.post_position as win_pp, ep.post_position as place_pp
        FROM races r
        LEFT JOIN results res ON res.race_id = r.id
        LEFT JOIN entries ew ON ew.id = res.win_entry_id
        LEFT JOIN entries ep ON ep.id = res.place_entry_id
        WHERE r.date = $1 AND r.track = 'Saratoga'
        ORDER BY r.race_number
      `, [date]);

      for (const ar of allResults) {
        const isTurfRace = ar.surface === 'Turf' || ar.surface === 't' || (ar.surface || '').toLowerCase().includes('turf');
        if (isTurfRace) continue;
        if (ar.skip_reason) continue;
        const proj = ar.projected_finish || [];
        if (proj.length < 2) continue;
        const placeStake = 50, exactaStake = 100;
        dayWagered += placeStake + exactaStake;
        if (ar.win_pp) {
          const placeOnPP = Number(proj[0]);
          const boxPPs = proj.slice(0, 4).map(Number);
          const placeHit = placeOnPP === ar.win_pp || placeOnPP === ar.place_pp;
          const exactaHit = boxPPs.includes(ar.win_pp) && boxPPs.includes(ar.place_pp);
          if (placeHit && ar.place_payout) dayCollected += (ar.place_payout / 2) * placeStake;
          else if (placeHit && ar.win_payout) dayCollected += (ar.win_payout / 2) * placeStake * 0.7;
          if (exactaHit && ar.exacta_payout) {
            const combos = boxPPs.length * (boxPPs.length - 1);
            dayCollected += ar.exacta_payout * (exactaStake / combos);
          }
        }
      }
      const dayNet = dayCollected - dayWagered;

      let raceCards = '';
      for (const r of races) {
        const sc = scoredMap[r.race_number];
        const postTime = r.post_time ? formatTime(r.post_time) : '—';
        const isCommission = sc && sc.conviction === 'HIGH';
        const purseK = (r.purse / 1000).toFixed(0);
        const isTurf = r.surface === 'Turf' || r.surface === 't' || (r.surface || '').toLowerCase().includes('turf');

        raceCards += `
          <a href="/saratoga?date=${date}&race=${r.race_number}" class="race-card-link">
          <div class="race-card ${isCommission ? 'commission-race' : ''} ${isTurf ? 'turf-race' : ''}">
            <div class="race-header">
              <div class="race-id">
                <span class="race-num">R${r.race_number}</span>
                <span class="race-time">${postTime} ET</span>
              </div>
              <div class="race-info">${r.distance} ${isTurf ? 'Turf' : 'Dirt'} • ${r.conditions} • $${purseK}K</div>
              ${isTurf ? '<span class="skip-badge">TURF — SKIPPED</span>' : ''}
              ${!isTurf && sc ? '<span class="composite-badge">' + sc.composite_score.toFixed(1) + '</span>' : ''}
              ${isCommission ? '<span class="commission-badge">COMMISSION</span>' : ''}
            </div>
            ${!isTurf && r.race_theory ? '<div class="race-theory-preview">' + r.race_theory.substring(0, 120) + '...</div>' : ''}
            ${isTurf ? '<div class="race-theory-preview">Turf race — model does not apply. Closers benefit from trips, Beyers less predictive on turf.</div>' : ''}
          </div>
          </a>`;
      }

      const html = buildOverviewHtml(raceCards, date, totalRaces, dayWagered, dayCollected, dayNet);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    }
  } catch (err: any) {
    console.error('saratoga error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}

function getOrdinal(n: number): string {
  return n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hours = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hours}:${String(m).padStart(2, '0')} ${period}`;
}

function findAdjacentRace(races: any[], current: number, direction: number, date: string): string | null {
  const raceNums = races.map((r: any) => r.race_number).sort((a: number, b: number) => a - b);
  const idx = raceNums.indexOf(current);
  const adjacent = raceNums[idx + direction];
  return adjacent ? `/saratoga?date=${date}&race=${adjacent}` : null;
}

function buildSingleRaceHtml(raceNum: number, race: any, sc: any, postTime: string, fieldRows: string, prevRace: string | null, nextRace: string | null, totalRaces: number, date: string, projectedHtml: string = '', resultsHtml: string = ''): string {
  const isCommission = sc && sc.conviction === 'HIGH';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SAR R${raceNum} — Fade the Chalk</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, -apple-system, sans-serif; background: #f8f8f6; padding: 16px; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; }
    .nav-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .nav-btn { font-size: 12px; font-weight: 600; color: #6b7280; text-decoration: none; padding: 6px 12px; border: 1px solid #e5e7eb; border-radius: 6px; }
    .nav-btn:hover { background: #fff; color: #1a1a1a; }
    .race-hero { text-align: center; margin-bottom: 24px; }
    .race-hero-num { font-size: 48px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; ${isCommission ? 'color: #16a34a;' : ''} }
    .race-hero-time { font-size: 14px; color: #6b7280; margin-top: 4px; }
    .race-hero-info { font-size: 12px; color: #9ca3af; margin-top: 4px; }
    .race-hero-composite { font-size: 24px; font-weight: 800; margin-top: 12px; }
    .commission-tag { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; background: #16a34a; color: #fff; padding: 3px 10px; border-radius: 4px; display: inline-block; margin-top: 8px; }
    .results-card { border-radius: 12px; padding: 16px; margin-bottom: 16px; }
    .results-hit { background: #f0fdf4; border: 2px solid #16a34a; }
    .results-miss { background: #fef2f2; border: 2px solid #ef4444; }
    .results-title { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; font-weight: 700; margin-bottom: 8px; }
    .results-finish-line { font-size: 14px; font-weight: 700; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid rgba(0,0,0,0.1); }
    .results-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 12px; }
    .results-table th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; font-weight: 600; padding: 6px 8px; border-bottom: 1px solid rgba(0,0,0,0.1); }
    .results-table td { padding: 8px 8px; border-bottom: 1px solid rgba(0,0,0,0.06); }
    .results-table tfoot td { border-bottom: none; padding-top: 10px; border-top: 1px solid rgba(0,0,0,0.15); }
    .row-hit { background: rgba(22,163,106,0.05); }
    .row-miss { }
    .total-row { font-weight: 700; }
    .total-positive { color: #16a34a; font-weight: 800; }
    .total-negative { color: #ef4444; font-weight: 800; }
    .projected-card { background: #1a1a1a; border-radius: 12px; padding: 16px; margin-bottom: 16px; color: #fff; }
    .projected-title { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 700; margin-bottom: 12px; }
    .proj-horse { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .proj-horse:last-child { border-bottom: none; }
    .proj-pos { font-size: 20px; font-weight: 800; min-width: 40px; }
    .proj-1 .proj-pos { color: #4ade80; }
    .proj-2 .proj-pos { color: #facc15; }
    .proj-3 .proj-pos { color: #fb923c; }
    .proj-4 .proj-pos { color: #94a3b8; }
    .proj-name { font-size: 14px; font-weight: 700; flex: 1; }
    .proj-pp { font-size: 11px; color: #9ca3af; }
    .proj-ml { font-size: 12px; color: #6b7280; font-weight: 600; }
    .theory-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
    .theory-title { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 700; margin-bottom: 8px; }
    .theory-text { font-size: 13px; color: #374151; line-height: 1.7; }
    .field-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 16px; }
    .field-title { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 700; padding: 12px 14px 0; }
    .field-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .field-table thead { background: #f9fafb; }
    .field-table th { padding: 8px 10px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
    .field-table td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; }
    .field-table .pp { font-weight: 700; width: 30px; }
    .field-table .horse { font-weight: 500; }
    .field-table .ml { color: #6b7280; }
    .field-table .beyer { font-weight: 700; }
    .field-table .style { color: #6b7280; font-size: 11px; }
    .first-row { background: #f0fdf4; }
    .first-row .horse { font-weight: 700; }
    .second-row { background: #fefce8; }
    .third-row { background: #fff7ed; }
    .fourth-row { background: #f8fafc; }
    .pos-badge { font-size: 8px; font-weight: 800; padding: 2px 6px; border-radius: 3px; vertical-align: middle; margin-left: 4px; }
    .pos-1 { background: #1a1a1a; color: #4ade80; }
    .pos-2 { background: #1a1a1a; color: #facc15; }
    .pos-3 { background: #1a1a1a; color: #fb923c; }
    .pos-4 { background: #1a1a1a; color: #94a3b8; }
    .scratched-row { opacity: 0.35; text-decoration: line-through; }
    .scr-badge { font-size: 8px; font-weight: 700; background: #fee2e2; color: #991b1b; padding: 1px 4px; border-radius: 3px; vertical-align: middle; margin-left: 4px; }
    .box-badge { font-size: 8px; font-weight: 700; background: #fef3c7; color: #92400e; padding: 2px 5px; border-radius: 3px; vertical-align: middle; margin-left: 4px; }
    .scr-badge { font-size: 8px; font-weight: 700; background: #fee2e2; color: #991b1b; padding: 1px 4px; border-radius: 3px; vertical-align: middle; margin-left: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="nav-bar">
      ${prevRace ? `<a href="${prevRace}" class="nav-btn">&larr; Prev</a>` : '<span></span>'}
      <a href="/saratoga?date=${date}" class="nav-btn">All Races</a>
      <a href="/mobile/" class="nav-btn">Commission</a>
      ${nextRace ? `<a href="${nextRace}" class="nav-btn">Next &rarr;</a>` : '<span></span>'}
    </div>
    <div class="race-hero">
      <div class="race-hero-num">R${raceNum}</div>
      <div class="race-hero-time">${postTime} ET</div>
      <div class="race-hero-info">${race.distance} Dirt • ${race.conditions} • ${race.field_size} runners • $${(race.purse/1000).toFixed(0)}K</div>
      ${sc ? `<div class="race-hero-composite">${sc.composite_score.toFixed(1)}</div>` : ''}
      ${isCommission ? '<div class="commission-tag">Commission Play</div>' : ''}
    </div>
    ${resultsHtml}
    ${projectedHtml ? `
    <div class="projected-card">
      <div class="projected-title">PREDICTED OUTCOME</div>
      ${projectedHtml}
    </div>
    ` : ''}
    ${race.race_theory ? `
    <div class="theory-card">
      <div class="theory-title">RACE THEORY</div>
      <div class="theory-text">${race.race_theory}</div>
    </div>
    ` : ''}
    <div class="field-card">
      <div class="field-title">FIELD</div>
      <table class="field-table">
        <thead><tr><th>PP</th><th>Horse</th><th>ML</th><th>Beyer</th><th>Style</th></tr></thead>
        <tbody>${fieldRows}</tbody>
      </table>
    </div>
    <div class="nav-bar">
      ${prevRace ? `<a href="${prevRace}" class="nav-btn">&larr; Prev</a>` : '<span></span>'}
      <a href="/saratoga?date=${date}" class="nav-btn">All Races</a>
      <a href="/mobile/" class="nav-btn">Commission</a>
      ${nextRace ? `<a href="${nextRace}" class="nav-btn">Next &rarr;</a>` : '<span></span>'}
    </div>
  </div>
  <script>
    let startX = 0, startY = 0;
    document.addEventListener('touchstart', e => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; });
    document.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;
      ${nextRace ? `if (dx < 0) window.location.href = '${nextRace}';` : ''}
      ${prevRace ? `if (dx > 0) window.location.href = '${prevRace}';` : ''}
    });
  </script>
</body>
</html>`;
}

function buildOverviewHtml(raceCards: string, date: string, totalRaces: number, dayWagered: number = 0, dayCollected: number = 0, dayNet: number = 0): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Saratoga — Fade the Chalk</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, -apple-system, sans-serif; background: #f8f8f6; padding: 16px; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; }
    .page-header { text-align: center; margin-bottom: 24px; }
    .page-title { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
    .page-subtitle { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .page-note { font-size: 11px; color: #9ca3af; margin-top: 8px; font-style: italic; }
    .day-summary { display: flex; justify-content: center; gap: 16px; margin: 16px 0; }
    .day-stat { text-align: center; padding: 8px 16px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; }
    .day-stat-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; font-weight: 600; }
    .day-stat-value { font-size: 18px; font-weight: 800; margin-top: 2px; }
    .day-stat-positive { color: #16a34a; }
    .day-stat-negative { color: #ef4444; }
    .race-card-link { text-decoration: none; color: inherit; }
    .race-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 12px; overflow: hidden; }
    .commission-race { border: 2px solid #16a34a; }
    .turf-race { opacity: 0.6; }
    .skip-badge { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; background: #6b7280; color: #fff; padding: 3px 8px; border-radius: 4px; }
    .race-header { padding: 12px 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .race-id { display: flex; flex-direction: column; }
    .race-num { font-size: 18px; font-weight: 800; }
    .race-time { font-size: 11px; color: #6b7280; }
    .race-info { font-size: 11px; color: #6b7280; flex: 1; }
    .composite-badge { font-size: 14px; font-weight: 800; color: #1a1a1a; background: #f3f4f6; border: 1px solid #e5e7eb; padding: 2px 10px; border-radius: 6px; }
    .commission-badge { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; background: #16a34a; color: #fff; padding: 3px 8px; border-radius: 4px; }
    .race-theory-preview { padding: 8px 16px 12px; font-size: 12px; color: #6b7280; border-top: 1px solid #f3f4f6; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div style="margin-bottom: 16px;"><a href="/mobile/" style="font-size: 12px; font-weight: 600; color: #6b7280; text-decoration: none; padding: 6px 12px; border: 1px solid #e5e7eb; border-radius: 6px;">&larr; Commission Bets</a></div>
    <div class="page-header">
      <div class="page-title">Saratoga</div>
      <div class="page-subtitle">${date} — ${totalRaces} dirt races • Full card analysis</div>
      <div class="page-note">Analysis only — no wagering plan. Use these theories to build your own bets.</div>
    </div>
    ${dayWagered > 0 ? `
    <div class="day-summary">
      <div class="day-stat"><div class="day-stat-label">Wagered</div><div class="day-stat-value">$${dayWagered}</div></div>
      <div class="day-stat"><div class="day-stat-label">Collected</div><div class="day-stat-value">$${dayCollected.toFixed(0)}</div></div>
      <div class="day-stat"><div class="day-stat-label">Net</div><div class="day-stat-value ${dayNet >= 0 ? 'day-stat-positive' : 'day-stat-negative'}">${dayNet >= 0 ? '+' : ''}$${dayNet.toFixed(0)}</div></div>
    </div>
    ` : ''}
    ${raceCards}
  </div>
</body>
</html>`;
}
