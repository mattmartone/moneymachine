import { query } from './db.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const date = req.query?.date || '2026-07-24';
  const race = req.query?.race ? parseInt(req.query.race) : null;

  const theories: Record<number, any> = {
    1: { pick: 'AUSPLEXITY', pickPP: 2, ml: '5-2', composite: 12.7, favePP: 9, theory: "Turf sprint — AUSPLEXITY (5-2, Beyer 99) has the BEST figure in the field and S11 fires (inside turf speed from PP2). NATURES FURY (2-1) is the chalk but ran a 77 last out — massive regression from 97 best. At 2-1 that's terrible price for declining form. MUNCHKIN (10-1, Beyer 96) is the value bomb if her 77 last was a trip fluke.", bets: [{amount: '$10', type: 'Win', horse: '#2 AUSPLEXITY'}, {amount: '$5', type: 'Win', horse: '#5 MUNCHKIN'}, {amount: '$6', type: 'Exacta Box', horse: '2-9-5'}], total: '$21', box: [2,9,5] },
    2: { pick: 'FINAL JOKE', pickPP: 3, ml: '6-1', composite: 17.1, favePP: 6, theory: "BONSAI WARRIOR (9-5, Beyer 102) is a monster figure but has 76-DAY LAYOFF and faces pace pressure from CAPTAIN OATS (E) and FRATELLONE (E/P). Too short for that risk. FINAL JOKE (6-1, Beyer 96) had a 70 last — classic troubled trip with 26-point drop. Stalks the duel from PP3. BLISS STREET (8-1, Beyer 96) is the same thesis, even bigger price. FRATELLONE (5-2, Beyer 87) is massively overbet — 4th best figure at 2nd shortest price.", bets: [{amount: '$10', type: 'Win', horse: '#3 FINAL JOKE'}, {amount: '$5', type: 'Win', horse: '#4 BLISS STREET'}, {amount: '$6', type: 'Exacta Box', horse: '3-4-6'}], total: '$21', box: [3,4,6] },
    3: { pick: 'CONFABULATION', pickPP: 5, ml: '7-2', composite: 15.4, favePP: 4, theory: "CHALK IS WRONG. STREET GLIDE (9-5, Beyer 82) and KNOX (5-2, Beyer 77) are the two favorites with the WORST figures in a 6-horse field. The public is asleep. CONFABULATION (7-2, Beyer 94) has the best figure by 3 points. SYNTACTIC (8-1, Beyer 91) is 2nd best and razor sharp at 5 days off. This is a two-horse race between our picks — everyone else is 7+ points below.", bets: [{amount: '$30', type: 'Win', horse: '#5 CONFABULATION'}, {amount: '$30', type: 'Place', horse: '#5 CONFABULATION'}, {amount: '$15', type: 'Win', horse: '#2 SYNTACTIC'}, {amount: '$4', type: 'Exacta Box', horse: '5-2'}], total: '$79', box: [5,2] },
    4: { pick: 'BELLA BELLO BANKER', pickPP: 1, ml: '5-2', composite: 13.9, favePP: 1, theory: "Bet the best horse. BELLA BELLO BANKER (5-2, Beyer 99) is field-best with S11 firing (inside turf draw, E/P style). Pace is hot — MYA PAPAYA (E), LADY HATHOR (E), PRECIOUS CAT (E/P) all want the front. BELLA BELLO saves ground on the rail and inherits. EMILY REWARD (12-1, Beyer 93) is the value underneath if she fires off 75 days.", bets: [{amount: '$10', type: 'Win', horse: '#1 BELLA BELLO BANKER'}, {amount: '$5', type: 'Win', horse: '#2 EMILY REWARD'}, {amount: '$6', type: 'Exacta Box', horse: '1-4-2'}], total: '$21', box: [1,4,2] },
    5: { pick: 'RED HEAD ITALIAN', pickPP: 5, ml: '5-2', composite: 18.7, favePP: 2, theory: "RED HEAD ITALIAN (5-2, Beyer 98, LAST 96) is the only horse in peak form — nobody else within 10 points of that last-race figure. Lone E-type who will dictate pace at 6F on dirt. LA RESOLANA (3-2) is the fade — 81 last, presser with no pace to press into. SHE'S A BOMBSHELL (8-1, Beyer 97) is the insurance play if RED HEAD tires — same ceiling as the fave at triple the price.", bets: [{amount: '$20', type: 'Win', horse: '#5 RED HEAD ITALIAN'}, {amount: '$20', type: 'Place', horse: '#5 RED HEAD ITALIAN'}, {amount: '$10', type: 'Win', horse: "#7 SHE'S A BOMBSHELL"}, {amount: '$12', type: 'Exacta Box', horse: '5-7-6'}], total: '$62', box: [5,7,6] },
    6: { pick: 'SHADYSIDE', pickPP: 7, ml: '6-1', composite: 14.5, favePP: 3, theory: "Turf route with slow pace — only TACO CAT BACKWARDS wants the front. LINARITE (4-1, Beyer 95) has the best figure by 5 points but ran 77 last and NEEDS pace to close into (won't get it). SHADYSIDE (6-1, Beyer 90, last 87) is a presser who makes his own trip — doesn't depend on pace setup. Running near peak, 12 days sharp. HAUNTRESS (3-1, Beyer 88) is the overbet chalk. EL MA'ANY (7-2) is 112 days off — terrible bet.", bets: [{amount: '$15', type: 'Win', horse: '#7 SHADYSIDE'}, {amount: '$10', type: 'Win', horse: '#2 LINARITE'}, {amount: '$6', type: 'Exacta Box', horse: '7-2-3'}], total: '$31', box: [7,2,3] }
  };

  try {
    const { rows: races } = await query(`
      SELECT r.id, r.race_number, r.distance, r.surface, r.conditions, r.post_time, r.purse, r.field_size
      FROM races r WHERE r.date = $1 AND r.track = 'Monmouth Park'
      ${race ? 'AND r.race_number = ' + race : ''}
      ORDER BY r.race_number
    `, [date]);

    const { rows: entries } = await query(`
      SELECT r.race_number, e.post_position, h.name, e.morning_line_odds, e.best_beyer, e.running_style, e.scratched
      FROM entries e JOIN horses h ON h.id = e.horse_id JOIN races r ON r.id = e.race_id
      WHERE r.date = $1 AND r.track = 'Monmouth Park'
      ${race ? 'AND r.race_number = ' + race : ''}
      ORDER BY r.race_number, e.post_position
    `, [date]);

    if (race) {
      // Single race view
      const raceData = races[0];
      if (!raceData) return res.status(404).json({ error: 'Race not found' });
      const t = theories[race];
      const raceEntries = entries.filter((e: any) => e.race_number === race);
      const postTime = raceData.post_time ? formatTime(raceData.post_time) : '—';
      const prevRace = race > 1 ? race - 1 : null;
      const nextRace = race < 6 ? race + 1 : null;

      let fieldRows = '';
      for (const e of raceEntries) {
        const isPick = t && e.post_position === t.pickPP;
        const inBox = t && t.box.includes(e.post_position);
        const isFave = t && e.post_position === t.favePP;
        fieldRows += `
          <tr class="${isPick ? 'pick-row' : inBox ? 'box-row' : isFave ? 'fave-row' : ''} ${e.scratched ? 'scratched-row' : ''}">
            <td class="pp">${e.post_position}</td>
            <td class="horse">${e.name}${isPick ? ' <span class="pick-badge">PICK</span>' : inBox ? ' <span class="box-badge">BOX</span>' : ''}${isFave && !isPick && !inBox ? ' <span class="fave-badge">FAVE</span>' : ''}${e.scratched ? ' <span class="scr-badge">SCR</span>' : ''}</td>
            <td class="ml">${e.morning_line_odds || '—'}</td>
            <td class="beyer">${e.best_beyer || '—'}</td>
          </tr>`;
      }

      const isBestRace = race === 5;
      const html = buildSingleRaceHtml(race, raceData, t, postTime, fieldRows, prevRace, nextRace, isBestRace, date);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    } else {
      // Overview
      let raceCards = '';
      for (const r of races) {
        const raceEntries = entries.filter((e: any) => e.race_number === r.race_number);
        const t = theories[r.race_number];
        const postTime = r.post_time ? formatTime(r.post_time) : '—';
        const isBestRace = r.race_number === 5;

        let fieldRows = '';
        for (const e of raceEntries) {
          const isPick = t && e.post_position === t.pickPP;
          const inBox = t && t.box.includes(e.post_position);
          const isFave = t && e.post_position === t.favePP;
          fieldRows += `
            <tr class="${isPick ? 'pick-row' : inBox ? 'box-row' : isFave ? 'fave-row' : ''} ${e.scratched ? 'scratched-row' : ''}">
              <td class="pp">${e.post_position}</td>
              <td class="horse">${e.name}${isPick ? ' <span class="pick-badge">PICK</span>' : inBox ? ' <span class="box-badge">BOX</span>' : ''}${isFave && !isPick && !inBox ? ' <span class="fave-badge">FAVE</span>' : ''}</td>
              <td class="ml">${e.morning_line_odds || '—'}</td>
              <td class="beyer">${e.best_beyer || '—'}</td>
            </tr>`;
        }

        raceCards += `
          <a href="/monmouth?date=${date}&race=${r.race_number}" class="race-card-link">
          <div class="race-card ${isBestRace ? 'best-race' : ''}">
            <div class="race-header">
              <div class="race-id">
                <span class="race-num">R${r.race_number}</span>
                <span class="race-time">${postTime} ET</span>
              </div>
              <div class="race-info">${r.distance} ${r.surface} • ${r.conditions}</div>
              ${t ? '<span class="composite-badge">' + t.composite.toFixed(1) + '</span>' : ''}
              ${isBestRace ? '<span class="best-badge">BEST BET</span>' : ''}
            </div>
            ${t ? '<div class="race-pick-summary"><strong>' + t.pick + '</strong> (' + t.ml + ') — ' + t.total + '</div>' : ''}
          </div>
          </a>`;
      }

      const html = buildOverviewHtml(raceCards, date);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    }
  } catch (err: any) {
    console.error('monmouth error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hours = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hours}:${String(m).padStart(2, '0')} ${period}`;
}

function buildSingleRaceHtml(raceNum: number, race: any, t: any, postTime: string, fieldRows: string, prevRace: number | null, nextRace: number | null, isBestRace: boolean, date: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MTH R${raceNum}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, -apple-system, sans-serif; background: #f8f8f6; padding: 16px; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; }
    .nav-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .nav-btn { font-size: 12px; font-weight: 600; color: #6b7280; text-decoration: none; padding: 6px 12px; border: 1px solid #e5e7eb; border-radius: 6px; }
    .nav-btn:hover { background: #fff; color: #1a1a1a; }
    .nav-dots { display: flex; gap: 6px; }
    .nav-dot { width: 8px; height: 8px; border-radius: 50%; background: #e5e7eb; }
    .nav-dot.active { background: #1a1a1a; }
    .race-hero { text-align: center; margin-bottom: 24px; }
    .race-hero-num { font-size: 48px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; ${isBestRace ? 'color: #16a34a;' : ''} }
    .race-hero-time { font-size: 14px; color: #6b7280; margin-top: 4px; }
    .race-hero-info { font-size: 12px; color: #9ca3af; margin-top: 4px; }
    .race-hero-composite { font-size: 24px; font-weight: 800; margin-top: 12px; }
    .pick-hero { background: #fff; border: 2px solid ${isBestRace ? '#16a34a' : '#1a1a1a'}; border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: center; }
    .pick-hero-name { font-size: 20px; font-weight: 800; }
    .pick-hero-meta { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .wager-card { background: #1a1a1a; border-radius: 12px; padding: 16px; margin-bottom: 16px; color: #fff; }
    .wager-title { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 700; margin-bottom: 10px; }
    .wager-list { list-style: none; padding: 0; margin: 0 0 12px; }
    .wager-list li { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 14px; font-weight: 500; }
    .wager-list li:last-child { border-bottom: none; }
    .wager-check { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.4); border-radius: 4px; flex-shrink: 0; }
    .wager-amount { color: #4ade80; font-weight: 700; min-width: 40px; }
    .wager-type { color: rgba(255,255,255,0.7); }
    .wager-total { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; }
    .wager-total-amount { font-size: 18px; color: #fff; }
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
    .pick-row { background: #f0fdf4; }
    .pick-row .horse { font-weight: 700; }
    .box-row { background: #fefce8; }
    .fave-row { background: #fef2f2; }
    .fave-badge { font-size: 8px; font-weight: 700; background: #fee2e2; color: #dc2626; padding: 2px 5px; border-radius: 3px; vertical-align: middle; margin-left: 4px; }
    .scratched-row { opacity: 0.35; text-decoration: line-through; }
    .pick-badge { font-size: 8px; font-weight: 800; background: #1a1a1a; color: #fff; padding: 2px 6px; border-radius: 3px; vertical-align: middle; margin-left: 4px; }
    .box-badge { font-size: 8px; font-weight: 700; background: #fef3c7; color: #92400e; padding: 2px 5px; border-radius: 3px; vertical-align: middle; margin-left: 4px; }
    .scr-badge { font-size: 8px; font-weight: 700; background: #fee2e2; color: #991b1b; padding: 1px 4px; border-radius: 3px; vertical-align: middle; margin-left: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="nav-bar">
      ${prevRace ? `<a href="/monmouth?date=${date}&race=${prevRace}" class="nav-btn">&larr; R${prevRace}</a>` : '<span></span>'}
      <div class="nav-dots">${[1,2,3,4,5,6].map(n => `<div class="nav-dot ${n === raceNum ? 'active' : ''}"></div>`).join('')}</div>
      ${nextRace ? `<a href="/monmouth?date=${date}&race=${nextRace}" class="nav-btn">R${nextRace} &rarr;</a>` : '<span></span>'}
    </div>
    <div class="race-hero">
      <div class="race-hero-num">R${raceNum}</div>
      <div class="race-hero-time">${postTime} ET</div>
      <div class="race-hero-info">${race.distance} ${race.surface} • ${race.conditions} • ${race.field_size} runners</div>
      ${t ? `<div class="race-hero-composite">${t.composite.toFixed(1)}</div>` : ''}
    </div>
    ${t ? `
    <div class="pick-hero">
      <div class="pick-hero-name">${t.pick}</div>
      <div class="pick-hero-meta">PP${t.pickPP} • ML ${t.ml}</div>
    </div>
    <div class="wager-card">
      <div class="wager-title">WAGER</div>
      <ul class="wager-list">
        ${t.bets.map((b: any) => `<li><div class="wager-check"></div><span class="wager-amount">${b.amount}</span><span class="wager-type">${b.type}</span><span>${b.horse}</span></li>`).join('')}
      </ul>
      <div class="wager-total"><span>TOTAL</span><span class="wager-total-amount">${t.total}</span></div>
    </div>
    <div class="theory-card">
      <div class="theory-title">THEORY</div>
      <div class="theory-text">${t.theory}</div>
    </div>
    ` : ''}
    <div class="field-card">
      <div class="field-title">FIELD</div>
      <table class="field-table">
        <thead><tr><th>PP</th><th>Horse</th><th>ML</th><th>Beyer</th></tr></thead>
        <tbody>${fieldRows}</tbody>
      </table>
    </div>
    <div class="nav-bar">
      ${prevRace ? `<a href="/monmouth?date=${date}&race=${prevRace}" class="nav-btn">&larr; R${prevRace}</a>` : '<span></span>'}
      <a href="/monmouth?date=${date}" class="nav-btn">All Races</a>
      ${nextRace ? `<a href="/monmouth?date=${date}&race=${nextRace}" class="nav-btn">R${nextRace} &rarr;</a>` : '<span></span>'}
    </div>
  </div>
  <script>
    let startX = 0;
    let startY = 0;
    document.addEventListener('touchstart', e => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; });
    document.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;
      const current = ${raceNum};
      if (dx < 0 && current < 6) window.location.href = '/monmouth?date=${date}&race=' + (current + 1);
      if (dx > 0 && current > 1) window.location.href = '/monmouth?date=${date}&race=' + (current - 1);
    });
  </script>
</body>
</html>`;
}

function buildOverviewHtml(raceCards: string, date: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FTC — Monmouth Park</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, -apple-system, sans-serif; background: #f8f8f6; padding: 16px; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; }
    .page-header { text-align: center; margin-bottom: 24px; }
    .page-title { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
    .page-subtitle { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .page-budget { font-size: 13px; font-weight: 700; color: #1a1a1a; margin-top: 8px; background: #fff; border: 1px solid #e5e7eb; display: inline-block; padding: 4px 12px; border-radius: 6px; }
    .race-card-link { text-decoration: none; color: inherit; }
    .race-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 12px; overflow: hidden; }
    .best-race { border: 2px solid #16a34a; }
    .race-header { padding: 12px 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .race-id { display: flex; flex-direction: column; }
    .race-num { font-size: 18px; font-weight: 800; }
    .race-time { font-size: 11px; color: #6b7280; }
    .race-info { font-size: 11px; color: #6b7280; flex: 1; }
    .composite-badge { font-size: 14px; font-weight: 800; color: #1a1a1a; background: #f3f4f6; border: 1px solid #e5e7eb; padding: 2px 10px; border-radius: 6px; }
    .best-badge { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; background: #16a34a; color: #fff; padding: 3px 8px; border-radius: 4px; }
    .race-pick-summary { padding: 8px 16px 12px; font-size: 13px; color: #374151; border-top: 1px solid #f3f4f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="page-header">
      <div class="page-title">Monmouth Park</div>
      <div class="page-subtitle">${date} — 6 races • First post 2:00 PM ET</div>
      <div class="page-budget">Day budget: $235</div>
    </div>
    ${raceCards}
  </div>
</body>
</html>`;
}
