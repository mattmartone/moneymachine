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
      FROM races r WHERE r.date = $1 AND r.track = 'Saratoga' AND r.surface = 'Dirt'
      ${race ? 'AND r.race_number = ' + race : ''}
      ORDER BY r.race_number
    `, [date]);

    const { rows: entries } = await query(`
      SELECT r.race_number, e.post_position, h.name, e.morning_line_odds, e.best_beyer, e.last_beyer, e.running_style, e.scratched, e.jockey
      FROM entries e JOIN horses h ON h.id = e.horse_id JOIN races r ON r.id = e.race_id
      WHERE r.date = $1 AND r.track = 'Saratoga' AND r.surface = 'Dirt'
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
            <span class="proj-pos">${e.pos}${getOrdinal(e.pos)}</span>
            <span class="proj-name">${e.name}</span>
            <span class="proj-pp">PP${e.pp}</span>
            <span class="proj-ml">${e.ml}</span>
          </div>
        `).join('');
      }

      const html = buildSingleRaceHtml(race, raceData, sc, postTime, fieldRows, prevRace, nextRace, totalRaces, date, projectedHtml);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    } else {
      let raceCards = '';
      for (const r of races) {
        const sc = scoredMap[r.race_number];
        const postTime = r.post_time ? formatTime(r.post_time) : '—';
        const isCommission = sc && sc.conviction === 'HIGH';
        const purseK = (r.purse / 1000).toFixed(0);

        raceCards += `
          <a href="/saratoga?date=${date}&race=${r.race_number}" class="race-card-link">
          <div class="race-card ${isCommission ? 'commission-race' : ''}">
            <div class="race-header">
              <div class="race-id">
                <span class="race-num">R${r.race_number}</span>
                <span class="race-time">${postTime} ET</span>
              </div>
              <div class="race-info">${r.distance} Dirt • ${r.conditions} • $${purseK}K</div>
              ${sc ? '<span class="composite-badge">' + sc.composite_score.toFixed(1) + '</span>' : ''}
              ${isCommission ? '<span class="commission-badge">COMMISSION</span>' : ''}
            </div>
            ${r.race_theory ? '<div class="race-theory-preview">' + r.race_theory.substring(0, 120) + '...</div>' : ''}
          </div>
          </a>`;
      }

      const html = buildOverviewHtml(raceCards, date, totalRaces);
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

function buildSingleRaceHtml(raceNum: number, race: any, sc: any, postTime: string, fieldRows: string, prevRace: string | null, nextRace: string | null, totalRaces: number, date: string, projectedHtml: string = ''): string {
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
    .projected-card { background: #1a1a1a; border-radius: 12px; padding: 16px; margin-bottom: 16px; color: #fff; }
    .projected-title { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 700; margin-bottom: 12px; }
    .proj-horse { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .proj-horse:last-child { border-bottom: none; }
    .proj-pos { font-size: 14px; font-weight: 800; min-width: 36px; }
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
      ${nextRace ? `<a href="${nextRace}" class="nav-btn">Next &rarr;</a>` : '<span></span>'}
    </div>
    <div class="race-hero">
      <div class="race-hero-num">R${raceNum}</div>
      <div class="race-hero-time">${postTime} ET</div>
      <div class="race-hero-info">${race.distance} Dirt • ${race.conditions} • ${race.field_size} runners • $${(race.purse/1000).toFixed(0)}K</div>
      ${sc ? `<div class="race-hero-composite">${sc.composite_score.toFixed(1)}</div>` : ''}
      ${isCommission ? '<div class="commission-tag">Commission Play</div>' : ''}
    </div>
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

function buildOverviewHtml(raceCards: string, date: string, totalRaces: number): string {
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
    .race-card-link { text-decoration: none; color: inherit; }
    .race-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 12px; overflow: hidden; }
    .commission-race { border: 2px solid #16a34a; }
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
    <div class="page-header">
      <div class="page-title">Saratoga</div>
      <div class="page-subtitle">${date} — ${totalRaces} dirt races • Full card analysis</div>
      <div class="page-note">Analysis only — no wagering plan. Use these theories to build your own bets.</div>
    </div>
    ${raceCards}
  </div>
</body>
</html>`;
}
