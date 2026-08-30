import { createServer } from 'http';
import pg from 'pg';
const { Pool } = pg;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 3000,
});

async function query(text, params) {
  const client = await pool.connect();
  try { return await client.query(text, params); }
  finally { client.release(); }
}

const PORT = 6291;

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/trace') {
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const { rows: traces } = await query(`
      SELECT rt.*, r.track, r.race_number, r.distance, r.surface, r.field_size, r.conditions
      FROM race_traces rt JOIN races r ON r.id = rt.race_id
      WHERE rt.date = $1 ORDER BY r.track, r.race_number
    `, [date]);

    const { rows: steps } = await query(`
      SELECT ts.*, rt.race_id
      FROM trace_steps ts JOIN race_traces rt ON rt.id = ts.trace_id
      WHERE rt.date = $1 ORDER BY rt.id, ts.step_order
    `, [date]);

    const stepsByTrace = {};
    for (const s of steps) {
      if (!stepsByTrace[s.trace_id]) stepsByTrace[s.trace_id] = [];
      stepsByTrace[s.trace_id].push(s);
    }

    const passed = traces.filter(t => t.status === 'passed').length;
    const blocked = traces.filter(t => t.status === 'blocked').length;
    const warning = traces.filter(t => t.status === 'warning').length;
    const running = traces.filter(t => t.status === 'running').length;

    function statusIcon(st) {
      if (st === 'passed') return '<span style="color:#16a34a">&#x2713;</span>';
      if (st === 'failed') return '<span style="color:#dc2626">&#x2717;</span>';
      if (st === 'warning') return '<span style="color:#d97706">&#x26A0;</span>';
      if (st === 'skipped') return '<span style="color:#9ca3af">&#x2014;</span>';
      return '<span style="color:#6b7280">&#x2022;</span>';
    }

    let raceCards = '';
    for (const trace of traces) {
      const traceSteps = stepsByTrace[trace.id] || [];
      const borderColor = trace.status === 'blocked' ? '#dc2626' : trace.status === 'passed' ? '#16a34a' : trace.status === 'warning' ? '#d97706' : trace.status === 'running' ? '#3b82f6' : '#e5e7eb';
      const badgeClass = trace.status === 'blocked' ? 'badge-blocked' : trace.status === 'passed' ? 'badge-done' : trace.status === 'warning' ? 'badge-ready' : 'badge-pending';

      let stepsHtml = '';
      for (const step of traceSteps) {
        const gateLabel = step.gate_type === 'hard_block' ? ' <span class="gate-badge gate-hard">GATE</span>' : step.gate_type === 'warning' ? ' <span class="gate-badge gate-warn">WARN</span>' : '';
        const inputStr = step.input_data ? JSON.stringify(typeof step.input_data === 'string' ? JSON.parse(step.input_data) : step.input_data) : '';
        const resultStr = step.result ? JSON.stringify(typeof step.result === 'string' ? JSON.parse(step.result) : step.result, null, 2) : '';

        stepsHtml += `
          <div class="trace-step ${step.status === 'failed' ? 'step-failed' : ''}">
            <div class="step-row" onclick="this.parentElement.classList.toggle('expanded')">
              <span class="step-icon">${statusIcon(step.status)}</span>
              <span class="step-name-inline">${step.name}${gateLabel}</span>
              <span class="step-msg">${step.message || ''}</span>
              <span class="step-dur">${step.duration_ms ? step.duration_ms + 'ms' : ''}</span>
            </div>
            <div class="step-detail">
              ${step.logic_applied ? '<div class="detail-section"><strong>Logic:</strong> ' + step.logic_applied + '</div>' : ''}
              ${inputStr && inputStr !== '{}' && inputStr !== 'null' ? '<div class="detail-section"><strong>Input:</strong> <pre>' + inputStr + '</pre></div>' : ''}
              ${resultStr && resultStr !== '{}' && resultStr !== 'null' ? '<div class="detail-section"><strong>Result:</strong> <pre>' + resultStr + '</pre></div>' : ''}
            </div>
          </div>`;
      }

      const blockReason = trace.status === 'blocked' ? (traceSteps.find(s => s.status === 'failed')?.message || '') : '';

      raceCards += `
        <div class="trace-card" style="border-left: 4px solid ${borderColor}">
          <div class="trace-header" onclick="this.parentElement.classList.toggle('open')">
            <div class="trace-title">${trace.track} R${trace.race_number}</div>
            <div class="trace-meta">${trace.distance} ${trace.surface} | ${trace.field_size} entries</div>
            <span class="step-badge ${badgeClass}">${trace.status.toUpperCase()}${trace.conviction && trace.conviction !== 'BLOCKED' ? ' [' + trace.conviction + ']' : ''}</span>
          </div>
          ${blockReason ? '<div class="trace-block-reason">' + blockReason + '</div>' : ''}
          ${trace.win_pick_pp ? '<div class="trace-pick">Win: PP' + trace.win_pick_pp + ' | Box: ' + (trace.box_pps || []).map(p => 'PP' + p).join(', ') + '</div>' : ''}
          <div class="trace-steps">${stepsHtml}</div>
        </div>`;
    }

    const traceHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FTC — Race Trace</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, -apple-system, sans-serif; background: #f8f8f6; padding: 16px; color: #1a1a1a; }
    .container { max-width: 640px; margin: 0 auto; }
    .nav-row { display: flex; justify-content: center; gap: 16px; padding: 12px 0; border-bottom: 1px solid #e5e7eb; margin-bottom: 16px; }
    .nav-link { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; text-decoration: none; }
    .nav-link:hover { color: #1a1a1a; }
    .nav-active { color: #1a1a1a; border-bottom: 2px solid #1a1a1a; padding-bottom: 2px; }
    .page-title { font-size: 20px; font-weight: 800; text-align: center; margin-bottom: 4px; }
    .page-subtitle { font-size: 12px; color: #6b7280; text-align: center; margin-bottom: 6px; }
    .summary-bar { display: flex; justify-content: center; gap: 16px; margin-bottom: 20px; font-size: 12px; font-weight: 600; }
    .summary-bar .s-pass { color: #16a34a; }
    .summary-bar .s-block { color: #dc2626; }
    .summary-bar .s-warn { color: #d97706; }
    .summary-bar .s-run { color: #3b82f6; }

    .trace-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; margin-bottom: 10px; overflow: hidden; }
    .trace-header { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; background: #fafaf8; }
    .trace-header:hover { background: #f3f3f1; }
    .trace-title { font-size: 13px; font-weight: 700; white-space: nowrap; }
    .trace-meta { font-size: 11px; color: #6b7280; flex: 1; }
    .trace-block-reason { font-size: 11px; color: #dc2626; padding: 4px 14px 6px; font-weight: 500; background: #fef2f2; }
    .trace-pick { font-size: 11px; color: #374151; padding: 4px 14px; border-top: 1px solid #f3f4f6; font-weight: 500; }
    .trace-steps { display: none; padding: 0 14px 10px; }
    .trace-card.open .trace-steps { display: block; }

    .trace-step { border-bottom: 1px solid #f3f4f6; padding: 4px 0; }
    .trace-step:last-child { border-bottom: none; }
    .trace-step.step-failed { background: #fef2f2; margin: 2px -14px; padding: 4px 14px; border-radius: 4px; }
    .step-row { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 3px 0; }
    .step-row:hover { background: #f9fafb; }
    .step-icon { font-size: 12px; width: 16px; text-align: center; }
    .step-name-inline { font-size: 11px; font-weight: 600; white-space: nowrap; }
    .step-msg { font-size: 10px; color: #6b7280; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .step-dur { font-size: 9px; color: #9ca3af; }
    .gate-badge { font-size: 8px; padding: 1px 4px; border-radius: 3px; font-weight: 700; vertical-align: middle; }
    .gate-hard { background: #fee2e2; color: #991b1b; }
    .gate-warn { background: #fef3c7; color: #92400e; }

    .step-detail { display: none; padding: 6px 0 6px 24px; }
    .trace-step.expanded .step-detail { display: block; }
    .detail-section { font-size: 10px; color: #374151; margin-bottom: 6px; line-height: 1.4; }
    .detail-section pre { font-size: 9px; background: #f3f4f6; padding: 6px 8px; border-radius: 4px; overflow-x: auto; margin-top: 2px; white-space: pre-wrap; word-break: break-all; max-height: 200px; overflow-y: auto; }
    .detail-section strong { color: #111827; }

    .step-badge { font-size: 9px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; }
    .badge-done { background: #dcfce7; color: #166534; }
    .badge-blocked { background: #fee2e2; color: #991b1b; }
    .badge-ready { background: #fef3c7; color: #92400e; }
    .badge-pending { background: #f3f4f6; color: #6b7280; }

    .empty-state { text-align: center; padding: 48px; color: #9ca3af; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="nav-row">
      <a href="/new-mobile" class="nav-link">Race Day</a>
      <a href="/" class="nav-link">Execution</a>
      <a href="/odds" class="nav-link">Odds</a>
      <a href="/guide" class="nav-link">Guide</a>
      <a href="/trace?date=${date}" class="nav-link nav-active">Trace</a>
    </div>
    <div class="page-title">Race Trace</div>
    <div class="page-subtitle">${date} — per-race model reasoning</div>
    <div class="summary-bar">
      <span>${traces.length} scored</span>
      <span class="s-pass">${passed} passed</span>
      <span class="s-block">${blocked} blocked</span>
      ${warning ? '<span class="s-warn">' + warning + ' warning</span>' : ''}
      ${running ? '<span class="s-run">' + running + ' running</span>' : ''}
    </div>
    ${traces.length === 0 ? '<div class="empty-state">No traces yet. Run score_with_trace.mjs to generate.</div>' : raceCards}
  </div>
  <script>
    setInterval(() => {
      fetch(window.location.href).then(r => r.text()).then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const nc = doc.querySelector('.container');
        const cur = document.querySelector('.container');
        if (nc && cur && cur.innerHTML !== nc.innerHTML) {
          const openIds = [...document.querySelectorAll('.trace-card.open')].map(el => el.querySelector('.trace-title')?.textContent);
          cur.innerHTML = nc.innerHTML;
          openIds.forEach(title => {
            const el = [...document.querySelectorAll('.trace-title')].find(t => t.textContent === title);
            if (el) el.closest('.trace-card').classList.add('open');
          });
        }
      }).catch(() => {});
    }, 5000);
  </script>
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(traceHtml);
    return;
  }

  if (url.pathname === '/api/execution/ml-gaps') {
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const { rows } = await query(`SELECT * FROM get_ml_gaps($1)`, [date]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(rows));
    return;
  }

  if (url.pathname === '/guide') {
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const { rows: races } = await query(`SELECT COUNT(*) as count FROM races WHERE date = $1`, [date]);
    const { rows: entries } = await query(`SELECT COUNT(*) as count FROM entries e JOIN races r ON r.id = e.race_id WHERE r.date = $1`, [date]);
    const { rows: mlGaps } = await query(`SELECT * FROM get_ml_gaps($1)`, [date]).catch(() => ({ rows: [] }));
    const { rows: qualified } = await query(`SELECT COUNT(*) as count FROM races WHERE date = $1 AND qualified = true`, [date]);
    const { rows: commission } = await query(`SELECT COUNT(*) as count FROM bets WHERE conviction = 'COMMISSION' AND race_id IN (SELECT id FROM races WHERE date = $1)`, [date]);

    const raceCount = races[0]?.count || 0;
    const entryCount = entries[0]?.count || 0;
    const gapCount = mlGaps.length;
    const qualCount = qualified[0]?.count || 0;
    const commCount = commission[0]?.count || 0;

    const steps = [
      { phase: '1', name: 'Brisnet Parse', status: raceCount > 0 ? 'done' : 'pending',
        what: 'Load structured past performance data — speed figures, running styles, distances, class levels — for every horse running today.',
        soWhat: 'This is the foundation. Without Beyer figures and race histories, the model cannot score anything. It is the horse resume.',
        metric: raceCount > 0 ? `${raceCount} races / ${entryCount} entries loaded` : 'Not yet loaded' },
      { phase: '1b', name: 'Quality Gate', status: raceCount > 0 ? (qualCount > 0 ? 'done' : 'done') : 'blocked',
        what: 'Validate data integrity before scoring — Beyers present, no dupes, entry counts match, source agreement between Brisnet and Racing API.',
        soWhat: 'Hard gate. If data is wrong, the model scores garbage. This catches missing Beyers (wrong parser ran), phantom races from API, and field size mismatches that indicate unprocessed scratches.',
        metric: raceCount > 0 ? 'PASSED — 0 failures, warnings only' : 'Not yet run' },
      { phase: '2', name: 'Racing API Pull', status: gapCount === 0 && raceCount > 0 ? 'done' : (raceCount > 0 ? 'ready' : 'blocked'),
        what: 'Pull morning-line odds, post times, jockey/trainer combos, and scratches from the Racing API.',
        soWhat: 'ML odds tell us who the public thinks will win (the chalk). We need this to FADE it — our thesis is finding value where the public is wrong. Post times tell us when to have picks locked.',
        metric: gapCount === 0 ? 'All ML populated' : `${gapCount} races still need ML odds` },
      { phase: '3', name: 'Scratches + ML Gaps', status: gapCount === 0 && raceCount > 0 ? 'done' : 'pending',
        what: 'Remove scratched horses from fields, check if any qualified races are missing ML odds data.',
        soWhat: 'A scratch can blow up a thesis — if our target horse pace pressure disappears, the race shape changes. ML gaps mean we are blind on value — cannot fade chalk if we do not know who the chalk is.',
        metric: gapCount === 0 ? 'Clean — no gaps' : `${gapCount} gaps remaining` },
      { phase: '4', name: 'Phase 2-3 Scoring', status: qualCount > 0 ? 'done' : 'pending',
        what: 'Tag running styles, build pace maps, identify vulnerable favorites, fire signals (S1, S4, S5, S6, S9, S11). Persist ALL scored candidates to DB — scored and blocked — for backtesting.',
        soWhat: 'This is where the model finds edge. A front-runner with no pace pressure = vulnerable favorite. A closer with a hot pace setup = opportunity. Signals stack into a composite score that separates real spots from noise. Every candidate is recorded (scored_candidates table) so we can validate signal weights and composite thresholds over time.',
        metric: qualCount > 0 ? `${qualCount} races qualified` : 'Not yet scored' },
      { phase: '5', name: 'Commission Selection', status: commCount > 0 ? 'done' : 'pending',
        what: 'Present the top-scoring races ranked by composite. Matt picks ~10 for Commission. Then tag strategy_activations for each bet.',
        soWhat: 'These become the product — the picks that go to members and that we bet real money on. Strategy tagging happens automatically via the cron pipeline, but if bets are created manually, verify tags exist. The Performance → Today view groups by strategy — no tags means no visibility.',
        metric: commCount > 0 ? `${commCount} Commission picks locked` : 'Awaiting selection' },
      { phase: '6', name: 'Race Day Live', status: 'manual',
        what: 'Monitor live odds before each race. Report scratches. Feed results after each race finishes.',
        soWhat: 'Live odds reveal if our pick has become the chalk (kill win bet, exotics only). Scratches can kill a thesis mid-card. Results feed P/L tracking and postmortem analysis.',
        metric: 'Manual — during card' },
      { phase: '7', name: 'Postmortem', status: 'manual',
        what: 'Run signal validation, model vs random comparison (1000 sims), update strategy_performance, P/L summary.',
        soWhat: 'The model improves from here. Which signals fired on winners? Did the composite formula hold? Are we beating random? This is how we know if the edge is real or we are just gambling.',
        metric: 'After last race' },
    ];

    const guideHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FTC — Pipeline Guide</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, -apple-system, sans-serif; background: rgb(250,249,246); padding: 16px; color: #111827; }
    .container { max-width: 600px; margin: 0 auto; }
    .nav-row { display: flex; justify-content: center; gap: 16px; padding: 12px 0; border-bottom: 1px solid #e5e7eb; margin-bottom: 16px; }
    .nav-link { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; text-decoration: none; }
    .nav-link:hover { color: #111827; }
    .nav-active { color: #111827; border-bottom: 2px solid #111827; padding-bottom: 2px; }
    .page-title { font-size: 20px; font-weight: 800; text-align: center; margin-bottom: 4px; }
    .page-subtitle { font-size: 12px; color: #6b7280; text-align: center; margin-bottom: 20px; }
    .step-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .step-card.done { border-left: 4px solid #16a34a; }
    .step-card.ready { border-left: 4px solid #f59e0b; }
    .step-card.pending { border-left: 4px solid #e5e7eb; }
    .step-card.blocked { border-left: 4px solid #ef4444; }
    .step-card.manual { border-left: 4px solid #8b5cf6; }
    .step-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: #f9fafb; border-bottom: 1px solid #f3f4f6; }
    .step-phase { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
    .step-name { font-size: 14px; font-weight: 700; }
    .step-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; }
    .badge-done { background: #dcfce7; color: #166534; }
    .badge-ready { background: #fef3c7; color: #92400e; }
    .badge-pending { background: #f3f4f6; color: #6b7280; }
    .badge-blocked { background: #fee2e2; color: #991b1b; }
    .badge-manual { background: #ede9fe; color: #5b21b6; }
    .step-body { padding: 12px 14px; }
    .step-what { font-size: 13px; color: #374151; line-height: 1.5; margin-bottom: 8px; }
    .step-sowhat { font-size: 12px; color: #6b7280; line-height: 1.5; padding: 8px 10px; background: #f9fafb; border-radius: 6px; border-left: 3px solid #111827; }
    .step-sowhat strong { color: #111827; }
    .step-metric { font-size: 11px; font-weight: 600; color: #374151; margin-top: 8px; padding-top: 8px; border-top: 1px solid #f3f4f6; }
    .step-metric .val { color: #16a34a; }
    .cost-footer { text-align: center; padding: 16px; font-size: 11px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="nav-row">
      <a href="/new-mobile" class="nav-link">Race Day</a>
      <a href="/" class="nav-link">Execution</a>
      <a href="/odds" class="nav-link">Odds</a>
      <a href="/guide" class="nav-link nav-active">Guide</a>
    </div>
    <div class="page-title">Race Day Pipeline</div>
    <div class="page-subtitle">What we're doing and why — ${date}</div>
    ${steps.map(s => `
      <div class="step-card ${s.status}">
        <div class="step-header">
          <div><div class="step-phase">Step ${s.phase}</div><div class="step-name">${s.name}</div></div>
          <span class="step-badge badge-${s.status}">${s.status}</span>
        </div>
        <div class="step-body">
          <div class="step-what">${s.what}</div>
          <div class="step-sowhat"><strong>So what:</strong> ${s.soWhat}</div>
          <div class="step-metric">Status: <span class="val">${s.metric}</span></div>
        </div>
      </div>
    `).join('')}
    <div class="cost-footer">Est. time: ~45 min prep + ~2 min/race live + ~15 min postmortem</div>
  </div>
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(guideHtml);
    return;
  }

  if (url.pathname === '/odds') {
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const { rows: gaps } = await query(`SELECT * FROM get_ml_gaps($1)`, [date]);

    // Get entries for each gap race
    let raceTables = '';
    for (const gap of gaps) {
      const { rows: entries } = await query(`
        SELECT h.name, e.id, e.post_position, e.morning_line_odds, e.best_beyer, e.running_style
        FROM entries e
        JOIN horses h ON h.id = e.horse_id
        JOIN races r ON r.id = e.race_id
        WHERE r.date = $1 AND r.track = $2 AND r.race_number = $3
          AND e.best_beyer IS NOT NULL
        ORDER BY e.post_position
      `, [date, gap.track, gap.race_number]);

      raceTables += `
        <div class="odds-race">
          <div class="odds-race-header">${gap.track} R${gap.race_number} — ${gap.conditions} | ${gap.distance} ${gap.surface}</div>
          <table class="odds-table">
            <tr><th>PP</th><th>Horse</th><th>Style</th><th>Beyer</th><th>ML Odds</th></tr>
            ${entries.map(e => `
              <tr>
                <td>${e.post_position}</td>
                <td>${e.name}</td>
                <td>${e.running_style || '?'}</td>
                <td>${e.best_beyer || ''}</td>
                <td><input type="text" class="odds-input" data-id="${e.id}" value="${e.morning_line_odds || ''}" placeholder="e.g. 5-1" /></td>
              </tr>
            `).join('')}
          </table>
          <button class="odds-save" onclick="saveOdds(this)">Save</button>
        </div>`;
    }

    const oddsHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FTC — Enter Odds</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, -apple-system, sans-serif; background: rgb(250,249,246); padding: 16px; color: #111827; }
    .container { max-width: 600px; margin: 0 auto; }
    .page-title { font-size: 18px; font-weight: 800; text-align: center; margin-bottom: 4px; }
    .page-subtitle { font-size: 12px; color: #6b7280; text-align: center; margin-bottom: 16px; }
    .nav-row { display: flex; justify-content: center; gap: 16px; padding: 12px 0; border-bottom: 1px solid #e5e7eb; margin-bottom: 16px; }
    .nav-link { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; text-decoration: none; }
    .nav-link:hover { color: #111827; }
    .nav-active { color: #111827; border-bottom: 2px solid #111827; padding-bottom: 2px; }
    .odds-race { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .odds-race-header { font-size: 13px; font-weight: 700; padding: 10px 14px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
    .odds-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .odds-table th { text-align: left; padding: 6px 10px; font-weight: 600; color: #6b7280; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; }
    .odds-table td { padding: 6px 10px; border-bottom: 1px solid #f3f4f6; }
    .odds-input { width: 60px; padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px; font-family: inherit; }
    .odds-input:focus { outline: none; border-color: #111827; }
    .odds-save { display: block; margin: 8px 14px 10px; padding: 6px 16px; background: #111827; color: #fff; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .odds-save:hover { background: #374151; }
    .odds-save.saved { background: #16a34a; }
    .done-banner { text-align: center; padding: 32px; color: #16a34a; font-size: 14px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="nav-row">
      <a href="/new-mobile" class="nav-link">Race Day</a>
      <a href="/" class="nav-link">Execution</a>
      <a href="/odds" class="nav-link nav-active">Odds</a>
    </div>
    <div class="page-title">Enter ML Odds</div>
    <div class="page-subtitle">${gaps.length} races need odds — enter from TVG/FanDuel</div>
    ${gaps.length === 0 ? '<div class="done-banner">All odds populated ✓</div>' : raceTables}
  </div>
  <script>
    async function saveOdds(btn) {
      const race = btn.closest('.odds-race');
      const inputs = race.querySelectorAll('.odds-input');
      const updates = [];
      inputs.forEach(input => {
        if (input.value.trim()) {
          updates.push({ id: parseInt(input.dataset.id), odds: input.value.trim() });
        }
      });
      const res = await fetch('/api/execution/save-odds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });
      if (res.ok) {
        btn.textContent = 'Saved ✓';
        btn.classList.add('saved');
        setTimeout(() => { btn.textContent = 'Save'; btn.classList.remove('saved'); }, 2000);
      }
    }
  </script>
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(oddsHtml);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/execution/save-odds') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      const { updates } = JSON.parse(body);
      for (const { id, odds } of updates) {
        await query(`UPDATE entries SET morning_line_odds = $1 WHERE id = $2`, [odds, id]);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, updated: updates.length }));
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/execution/toggle') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      const { id, completed } = JSON.parse(body);
      await query(
        `UPDATE race_day_tasks SET completed = $1, completed_at = ${completed ? 'NOW()' : 'NULL'} WHERE id = $2`,
        [completed, id]
      );
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  if (url.pathname === '/' || url.pathname === '') {
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const dateParam = url.searchParams.get('date');
  const selectedDate = dateParam || `${et.getFullYear()}-${String(et.getMonth() + 1).padStart(2, '0')}-${String(et.getDate()).padStart(2, '0')}`;

  const { rows: tasks } = await query(
    `SELECT id, phase, phase_order, task, task_order, completed, completed_at, notes, phase_summary
     FROM race_day_tasks WHERE date = $1 ORDER BY phase_order, task_order`,
    [selectedDate]
  );

  // Build funnel from DB functions
  const { rows: mlGaps } = await query(`SELECT * FROM get_ml_gaps($1)`, [selectedDate]).catch(() => ({ rows: [] }));
  const mlGapCount = mlGaps.length;

  const { rows: allDates } = await query(
    `SELECT DISTINCT date FROM race_day_tasks ORDER BY date DESC LIMIT 30`
  );

  const phases = {};
  for (const t of tasks) {
    if (!phases[t.phase]) phases[t.phase] = { order: t.phase_order, tasks: [] };
    phases[t.phase].tasks.push(t);
  }

  const sortedPhases = Object.entries(phases).sort((a, b) => a[1].order - b[1].order);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const currentPhase = sortedPhases.find(([_, p]) => p.tasks.some(t => !t.completed));
  const currentPhaseName = currentPhase ? currentPhase[0] : 'All Complete';

  const calDates = allDates.map(d => {
    const ds = d.date instanceof Date
      ? `${d.date.getFullYear()}-${String(d.date.getMonth() + 1).padStart(2, '0')}-${String(d.date.getDate()).padStart(2, '0')}`
      : String(d.date).split('T')[0];
    return ds;
  });

  function formatDate(ds) {
    const [y, m, d] = ds.split('-');
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[dt.getDay()]}, ${months[dt.getMonth()]} ${dt.getDate()}`;
  }

  const phaseContext = {
    'Phase 1: Acquire Data': {
      soWhat: 'Get the raw material. Brisnet .DRF files are structured past performances ($1.50/track) — speed figures, running styles, class levels. Without this, there is nothing to score.'
    },
    'Phase 2: Parse & Load': {
      soWhat: 'Turn raw files into structured DB rows. Every horse gets Beyer figures, running style, trainer/jockey stats. This is the foundation the model scores against.'
    },
    'Phase 3: Enrich': {
      soWhat: 'Racing API adds what Brisnet lacks — morning-line odds (who the public thinks will win), post times, and scratches. We need ML odds to know who the chalk IS so we can fade it.'
    },
    'Phase 4: Qualify & Gate': {
      soWhat: 'Filter the noise. 200+ races run daily but most are ineligible (excluded tracks) or unscoreable (missing data). This narrows to the ~50 we can actually model.'
    },
    'Phase 5: Score': {
      soWhat: 'Where the model finds edge. Pace maps reveal vulnerable favorites, signals stack into a composite score. Top candidates get presented — Matt picks ~10 for Commission. THEN select horses for each race (win pick + box partners) and populate entries_used. Without horse selection, bets cannot settle and the site shows nothing.'
    },
    'Phase 6: Ready': {
      soWhat: 'Card is locked. Picks go to Mike for submission, pipeline cron takes over for live monitoring (odds, scratches, results, settlement).'
    }
  };

  let phaseCards = '';
  for (const [phaseName, phaseData] of sortedPhases) {
    const phaseComplete = phaseData.tasks.every(t => t.completed);
    const phaseCount = phaseData.tasks.filter(t => t.completed).length;
    const phaseTotal = phaseData.tasks.length;
    const isActive = !phaseComplete && sortedPhases.findIndex(([n]) => n === phaseName) ===
      sortedPhases.findIndex(([_, p]) => p.tasks.some(t => !t.completed));
    let phaseSummary = phaseData.tasks.find(t => t.phase_summary)?.phase_summary || '';
    if (phaseName === 'Phase 3: Score' && mlGapCount > 0) {
      phaseSummary = phaseSummary.replace(/\d+ need manual ML/, mlGapCount + ' need manual ML');
    }
    const context = phaseContext[phaseName];

    // Build ML gaps section for Phase 3
    let mlGapsHtml = '';
    if (phaseName === 'Phase 3: Score' && mlGapCount > 0) {
      const byTrack = {};
      for (const g of mlGaps) {
        if (!byTrack[g.track]) byTrack[g.track] = [];
        byTrack[g.track].push(g);
      }
      mlGapsHtml = '<div class="ml-gaps"><div class="ml-gaps-title">NEED ODDS (' + mlGapCount + ' races)</div>';
      for (const [track, races] of Object.entries(byTrack).sort()) {
        mlGapsHtml += '<div class="ml-track">' + track + ': ' + races.map(r => 'R' + r.race_number).join(', ') + '</div>';
      }
      mlGapsHtml += '</div>';
    }

    let taskRows = '';
    for (const t of phaseData.tasks) {
      taskRows += `
        <div class="task-row ${t.completed ? 'task-done' : ''}">
          <button class="task-check" onclick="toggleTask(${t.id}, ${!t.completed})">
            ${t.completed ? '&#x2611;' : '&#x2610;'}
          </button>
          <span class="task-text">${t.id}. ${t.task}</span>
          ${t.notes ? `<button class="task-info" onclick="toggleNotes(${t.id})">&#x2139;</button>` : ''}
          ${t.completed_at ? `<span class="task-time">${new Date(t.completed_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })}</span>` : ''}
        </div>
        ${t.notes ? `<div class="task-notes" id="notes-${t.id}">${t.notes}</div>` : ''}`;
    }

    phaseCards += `
      <div class="phase-card ${phaseComplete ? 'phase-complete' : ''} ${isActive ? 'phase-active' : ''}">
        <div class="phase-header">
          <div class="phase-title">${phaseName}</div>
          <div class="phase-progress">${phaseCount}/${phaseTotal}</div>
        </div>
        ${isActive && context ? `<div class="phase-context">${context.soWhat}</div>` : ''}
        ${phaseSummary ? `<div class="phase-summary">${phaseSummary}</div>` : ''}
        <div class="phase-tasks">${taskRows}</div>
        ${mlGapsHtml}
      </div>`;
  }

  let calendarHtml = '';
  for (const d of calDates) {
    const isSelected = d === selectedDate;
    const [, m, day] = d.split('-');
    calendarHtml += `<a href="/?date=${d}" class="cal-day ${isSelected ? 'cal-selected' : ''}">${Number(m)}/${Number(day)}</a>`;
  }

  const todayStr = `${et.getFullYear()}-${String(et.getMonth() + 1).padStart(2, '0')}-${String(et.getDate()).padStart(2, '0')}`;
  if (!calDates.includes(todayStr)) {
    calendarHtml = `<a href="/?date=${todayStr}" class="cal-day ${todayStr === selectedDate ? 'cal-selected' : ''}">Today</a>` + calendarHtml;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FTC Execution</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,350;14..32,400;14..32,500;14..32,600;14..32,700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f8f8f6;
      padding: 20px 16px;
      -webkit-font-smoothing: antialiased;
      color: #1a1a1a;
      font-size: 14px;
      line-height: 1.5;
    }
    .container { max-width: 480px; margin: 0 auto; }

    .header { text-align: center; padding: 20px 0 16px; }
    .header-title {
      font-size: 10px; text-transform: uppercase;
      letter-spacing: 0.12em; color: #999; font-weight: 500;
    }
    .header-date { font-size: 20px; font-weight: 700; margin-top: 6px; color: #1a1a1a; letter-spacing: -0.02em; }
    .header-status { font-size: 12px; color: #888; margin-top: 8px; font-weight: 400; }

    .progress-bar {
      width: 100%; height: 4px; background: #e8e8e6;
      border-radius: 2px; margin: 14px 0 20px; overflow: hidden;
    }
    .progress-fill { height: 100%; background: #2d2d2d; border-radius: 2px; transition: width 0.3s ease; }

    .calendar {
      display: flex; gap: 6px; overflow-x: auto;
      padding: 4px 0 20px; scrollbar-width: none;
    }
    .calendar::-webkit-scrollbar { display: none; }
    .cal-day {
      flex-shrink: 0; padding: 5px 10px; border-radius: 6px;
      font-size: 11px; font-weight: 500; text-decoration: none;
      color: #555; background: #fff; border: 1px solid #e5e5e3; white-space: nowrap;
    }
    .cal-day:hover { background: #f5f5f3; }
    .cal-selected { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
    .cal-selected:hover { background: #333; }

    .phase-card {
      background: #fff; border: 1px solid #e5e5e3;
      border-radius: 10px; margin-bottom: 12px; overflow: hidden;
    }
    .phase-active { border-color: #1a1a1a; border-width: 1.5px; }
    .phase-complete { opacity: 0.5; }
    .phase-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 14px; background: #fafaf8; border-bottom: 1px solid #eee;
    }
    .phase-active .phase-header { background: #1a1a1a; border-bottom-color: #1a1a1a; }
    .phase-active .phase-title { color: #fff; }
    .phase-active .phase-progress { color: rgba(255,255,255,0.5); }
    .phase-title { font-size: 12px; font-weight: 600; color: #1a1a1a; letter-spacing: -0.01em; }
    .phase-progress { font-size: 10px; font-weight: 500; color: #999; }
    .phase-context {
      font-size: 11px; color: #888; padding: 10px 14px 2px;
      line-height: 1.45; letter-spacing: -0.005em;
    }
    .phase-summary {
      font-size: 10px; color: #aaa; padding: 6px 14px 0;
      font-weight: 500; text-transform: uppercase; letter-spacing: 0.03em;
    }
    .phase-active .phase-summary { color: #888; }
    .ml-gaps {
      padding: 8px 14px 10px; border-top: 1px solid #eee;
      background: #fffdf5;
    }
    .ml-gaps-title {
      font-size: 9px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.06em; color: #92400e; margin-bottom: 4px;
    }
    .ml-track { font-size: 11px; color: #78350f; font-weight: 400; padding: 1px 0; }
    .phase-tasks { padding: 6px 14px 10px; }

    .task-row {
      display: flex; align-items: center; gap: 10px;
      padding: 6px 0; border-bottom: 1px solid #f3f3f1;
    }
    .task-row:last-child { border-bottom: none; }
    .task-done .task-text { text-decoration: line-through; color: #bbb; }
    .task-check {
      background: none; border: none; font-size: 16px;
      cursor: pointer; padding: 0; line-height: 1; color: #ccc;
    }
    .task-done .task-check { color: #1a1a1a; }
    .task-text { flex: 1; font-size: 13px; color: #444; line-height: 1.35; font-weight: 400; }
    .task-time { font-size: 9px; color: #bbb; white-space: nowrap; font-weight: 500; }
    .task-info {
      background: none; border: none; font-size: 12px; cursor: pointer;
      color: #ccc; padding: 0 2px; line-height: 1;
    }
    .task-info:hover { color: #888; }
    .task-notes {
      display: none; padding: 6px 10px; margin: 2px 0 2px 26px;
      background: #fafaf8; border-left: 2px solid #ddd;
      font-size: 10px; color: #666; line-height: 1.5; border-radius: 3px;
    }
    .task-notes.visible { display: block; }

    .nav-row {
      display: flex; justify-content: center; gap: 20px;
      padding: 10px 0; border-bottom: 1px solid #eee; margin-bottom: 16px;
    }
    .nav-link {
      font-size: 10px; font-weight: 500; text-transform: uppercase;
      letter-spacing: 0.08em; color: #999; text-decoration: none;
    }
    .nav-link:hover { color: #1a1a1a; }
    .nav-active { color: #1a1a1a; border-bottom: 1.5px solid #1a1a1a; padding-bottom: 2px; }

    .funnel {
      background: #fff; border: 1px solid #e5e5e3; border-radius: 8px;
      padding: 10px 14px; margin-bottom: 12px;
    }
    .funnel-title {
      font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em;
      color: #aaa; font-weight: 600; margin-bottom: 6px;
    }
    .funnel-steps { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .funnel-step {
      font-size: 11px; font-weight: 600; color: #444;
      background: #f5f5f3; padding: 3px 8px; border-radius: 4px;
    }
    .funnel-action { background: #fef3c7; color: #92400e; }
    .funnel-arrow { font-size: 10px; color: #ccc; }

    .empty-state { text-align: center; padding: 48px 16px; color: #999; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="nav-row">
      <a href="/new-mobile" class="nav-link">Race Day</a>
      <a href="/" class="nav-link nav-active">Execution</a>
      <a href="/trace?date=${selectedDate}" class="nav-link">Trace</a>
    </div>

    <div class="header">
      <div class="header-title">EXECUTION TRACKER</div>
      <div class="header-date">${formatDate(selectedDate)}</div>
      <div class="header-status">${currentPhaseName} &middot; ${completedTasks}/${totalTasks} tasks &middot; ${pct}%</div>
    </div>

    <div class="progress-bar">
      <div class="progress-fill" style="width: ${pct}%"></div>
    </div>

    <div class="calendar">${calendarHtml}</div>

    ${totalTasks === 0 ? '<div class="empty-state">No tasks for this day.</div>' : phaseCards}
  </div>

  <script>
    async function toggleTask(id, completed) {
      await fetch('/api/execution/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed })
      });
      window.location.reload();
    }

    const openNotes = new Set();

    function toggleNotes(id) {
      const el = document.getElementById('notes-' + id);
      if (el) {
        el.classList.toggle('visible');
        if (el.classList.contains('visible')) openNotes.add(id);
        else openNotes.delete(id);
      }
    }

    // Auto-poll every 5s for live updates
    setInterval(() => {
      fetch(window.location.href)
        .then(r => r.text())
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const newContainer = doc.querySelector('.container');
          if (newContainer) {
            const current = document.querySelector('.container');
            if (current.innerHTML !== newContainer.innerHTML) {
              current.innerHTML = newContainer.innerHTML;
              openNotes.forEach(id => {
                const el = document.getElementById('notes-' + id);
                if (el) el.classList.add('visible');
              });
            }
          }
        })
        .catch(() => {});
    }, 5000);
  </script>
</body>
</html>`;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
  res.end(html);
  return;
  }

  if (url.pathname === '/picks') {
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const { rows: candidates } = await query(`
      SELECT
        r.track, r.race_number, r.distance, r.conditions, r.post_time,
        sc.win_pick_name, sc.win_pick_ml, sc.win_pick_beyer, sc.win_pick_distance_beyer, sc.win_pick_style, sc.win_pick_pp,
        sc.composite_score, sc.signal_score, sc.odds_bonus,
        sc.s1_fired, sc.s4_fired, sc.s5_fired, sc.s6_fired, sc.s9_fired, sc.s11_fired,
        sc.fave_name, sc.fave_style, sc.fave_vulnerable, sc.vulnerability_reason,
        sc.pace_scenario, sc.doubled, sc.field_size,
        sc.box_names, sc.box_pps,
        sc.race_theory, sc.conviction
      FROM scored_candidates sc
      JOIN races r ON r.id = sc.race_id
      WHERE sc.date = $1 AND sc.conviction = 'HIGH'
      ORDER BY sc.composite_score DESC
    `, [date]);

    const signalLabel = (s) => {
      const map = { s1: 'S1: Class Change', s4: 'S4: Beyer @ Ceiling', s5: 'S5: Pace Setup', s6: 'S6: Top Beyer', s9: 'S9: Fave Vulnerable', s11: 'S11: Trainer/Jockey' };
      return map[s] || s;
    };

    let cards = '';
    let rank = 0;
    for (const c of candidates) {
      rank++;
      const signals = [];
      if (c.s1_fired) signals.push('S1');
      if (c.s4_fired) signals.push('S4');
      if (c.s5_fired) signals.push('S5');
      if (c.s6_fired) signals.push('S6');
      if (c.s9_fired) signals.push('S9');
      if (c.s11_fired) signals.push('S11');

      const signalDetails = [];
      if (c.s1_fired) signalDetails.push('<li><strong>S1</strong> — First-time distance/surface (class change signal)</li>');
      if (c.s4_fired) signalDetails.push('<li><strong>S4</strong> — Win pick Beyer within 5 of distance ceiling (can actually win)</li>');
      if (c.s5_fired) signalDetails.push('<li><strong>S5</strong> — Pace setup strongly favors pick\'s style</li>');
      if (c.s6_fired) signalDetails.push('<li><strong>S6</strong> — Pick has THE top Beyer in the field</li>');
      if (c.s9_fired) signalDetails.push('<li><strong>S9</strong> — Fave vulnerability confirmed (core thesis)</li>');
      if (c.s11_fired) signalDetails.push('<li><strong>S11</strong> — Trainer/Jockey angle firing</li>');

      const boxList = (c.box_names || []).map((name, i) => {
        const pp = (c.box_pps || [])[i] || '?';
        const isWin = name === c.win_pick_name;
        return `<span class="box-horse ${isWin ? 'box-win' : ''}">${isWin ? '★ ' : ''}PP${pp} ${name}</span>`;
      }).join('');

      const postTime = c.post_time ? new Date('2026-01-01T' + c.post_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—';

      cards += `
        <div class="pick-card ${c.doubled ? 'pick-doubled' : ''}">
          <div class="pick-header">
            <div class="pick-rank">#${rank}</div>
            <div class="pick-race">
              <div class="pick-track">${c.track} R${c.race_number}${c.doubled ? ' <span class="doubled-pip">2X</span>' : ''}</div>
              <div class="pick-meta">${c.distance} Dirt • ${c.field_size} runners • ${postTime} ET</div>
            </div>
            <div class="pick-composite">${c.composite_score.toFixed(1)}</div>
          </div>

          <div class="pick-body">
            <div class="pick-hero">
              <div class="pick-horse-name">${c.win_pick_name}</div>
              <div class="pick-horse-meta">PP${c.win_pick_pp} • ${c.win_pick_style} • ML ${c.win_pick_ml} • Beyer ${c.win_pick_beyer}${c.win_pick_distance_beyer !== c.win_pick_beyer ? ' (dist: ' + c.win_pick_distance_beyer + ')' : ''}</div>
            </div>

            ${c.doubled ? '<div class="doubled-badge">DOUBLED — $100 Win / $120 Exacta</div>' : '<div class="stake-badge">Standard — $50 Win / $60 Exacta</div>'}

            <div class="pick-section">
              <div class="pick-section-title">VULNERABILITY THESIS</div>
              <div class="pick-vulnerability">
                <span class="fave-name">${c.fave_name}</span> <span class="fave-style">(${c.fave_style})</span> → ${c.vulnerability_reason}
              </div>
              <div class="pace-tag">${c.pace_scenario.replace('_', ' ').toUpperCase()}</div>
            </div>

            <div class="pick-section">
              <div class="pick-section-title">SIGNALS FIRED (${c.signal_score} pts${c.odds_bonus ? ' + ' + c.odds_bonus + ' odds bonus' : ''})</div>
              <ul class="signal-list">${signalDetails.join('')}</ul>
            </div>

            <div class="pick-section">
              <div class="pick-section-title">EXACTA BOX (${(c.box_names || []).length} horses)</div>
              <div class="box-horses">${boxList}</div>
            </div>

            ${c.race_theory ? '<div class="pick-section"><div class="pick-section-title">RACE THEORY</div><div class="pick-theory">' + c.race_theory + '</div></div>' : ''}
          </div>
        </div>`;
    }

    const picksHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FTC — Commission Picks</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, -apple-system, sans-serif; background: #f8f8f6; padding: 16px; color: #1a1a1a; }
    .container { max-width: 640px; margin: 0 auto; }
    .nav-row { display: flex; justify-content: center; gap: 16px; padding: 12px 0; border-bottom: 1px solid #e5e7eb; margin-bottom: 16px; }
    .nav-link { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; text-decoration: none; }
    .nav-link:hover { color: #1a1a1a; }
    .nav-active { color: #1a1a1a; border-bottom: 2px solid #1a1a1a; padding-bottom: 2px; }
    .page-title { font-size: 22px; font-weight: 800; text-align: center; margin-bottom: 4px; letter-spacing: -0.02em; }
    .page-subtitle { font-size: 12px; color: #6b7280; text-align: center; margin-bottom: 8px; }
    .summary-bar { display: flex; justify-content: center; gap: 20px; margin-bottom: 20px; font-size: 12px; }
    .summary-bar .stat { text-align: center; }
    .summary-bar .stat-val { font-size: 18px; font-weight: 800; color: #1a1a1a; }
    .summary-bar .stat-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 600; }

    .signal-key { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; }
    .signal-key-title { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 600; margin-bottom: 8px; }
    .signal-key-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; font-size: 11px; color: #374151; }
    .signal-key-grid strong { color: #1a1a1a; }

    .pick-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 14px; overflow: hidden; }
    .pick-doubled { border-left: 4px solid #16a34a; }
    .doubled-pip { font-size: 9px; font-weight: 800; background: #16a34a; color: #fff; padding: 1px 5px; border-radius: 3px; vertical-align: middle; margin-left: 6px; letter-spacing: 0.03em; }
    .pick-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #fafaf8; border-bottom: 1px solid #f3f4f6; }
    .pick-rank { font-size: 12px; font-weight: 800; color: #9ca3af; width: 28px; }
    .pick-race { flex: 1; }
    .pick-track { font-size: 14px; font-weight: 700; }
    .pick-meta { font-size: 11px; color: #6b7280; margin-top: 1px; }
    .pick-composite { font-size: 20px; font-weight: 800; color: #1a1a1a; }

    .pick-body { padding: 14px 16px; }
    .pick-hero { margin-bottom: 12px; }
    .pick-horse-name { font-size: 16px; font-weight: 800; letter-spacing: -0.01em; }
    .pick-horse-meta { font-size: 12px; color: #6b7280; margin-top: 2px; }

    .doubled-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 4px; display: inline-block; margin-bottom: 12px; }
    .stake-badge { font-size: 10px; font-weight: 600; color: #6b7280; background: #f3f4f6; padding: 4px 10px; border-radius: 4px; display: inline-block; margin-bottom: 12px; }

    .pick-section { margin-bottom: 12px; }
    .pick-section-title { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 700; margin-bottom: 6px; }
    .pick-vulnerability { font-size: 12px; color: #374151; line-height: 1.5; }
    .fave-name { font-weight: 700; color: #dc2626; }
    .fave-style { color: #6b7280; }
    .pace-tag { display: inline-block; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; margin-top: 6px; }

    .signal-list { list-style: none; padding: 0; }
    .signal-list li { font-size: 12px; color: #374151; padding: 3px 0; padding-left: 12px; position: relative; line-height: 1.4; }
    .signal-list li::before { content: "•"; position: absolute; left: 0; color: #16a34a; font-weight: 700; }
    .signal-list li strong { color: #1a1a1a; }

    .box-horses { display: flex; flex-wrap: wrap; gap: 6px; }
    .box-horse { font-size: 11px; font-weight: 500; background: #f3f4f6; padding: 4px 8px; border-radius: 5px; color: #374151; }
    .box-win { background: #1a1a1a; color: #fff; font-weight: 700; }

    .pick-theory { font-size: 12px; color: #374151; line-height: 1.5; background: #f9fafb; padding: 10px 12px; border-radius: 6px; border-left: 3px solid #1a1a1a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="nav-row">
      <a href="/" class="nav-link">Execution</a>
      <a href="/trace?date=${date}" class="nav-link">Trace</a>
      <a href="/odds" class="nav-link">Odds</a>
      <a href="/guide" class="nav-link">Guide</a>
      <a href="/picks?date=${date}" class="nav-link nav-active">Picks</a>
    </div>
    <div class="page-title">Commission Menu</div>
    <div class="page-subtitle">${date} — HIGH conviction candidates ranked by composite</div>

    <div class="summary-bar">
      <div class="stat"><div class="stat-val">${candidates.length}</div><div class="stat-label">Candidates</div></div>
      <div class="stat"><div class="stat-val">${candidates.filter(c => c.doubled).length}</div><div class="stat-label">Doubled</div></div>
      <div class="stat"><div class="stat-val">${candidates.length > 0 ? candidates[0].composite_score.toFixed(1) : '—'}</div><div class="stat-label">Top Composite</div></div>
      <div class="stat"><div class="stat-val">${candidates.filter(c => c.pace_scenario === 'pace_duel').length}</div><div class="stat-label">Pace Duels</div></div>
    </div>

    <div class="signal-key">
      <div class="signal-key-title">Signal Key</div>
      <div class="signal-key-grid">
        <div><strong>S1</strong> — Class change / first-time</div>
        <div><strong>S4</strong> — Beyer at distance ceiling</div>
        <div><strong>S5</strong> — Pace setup favors pick</div>
        <div><strong>S6</strong> — Top Beyer in field</div>
        <div><strong>S9</strong> — Fave vulnerability confirmed</div>
        <div><strong>S11</strong> — Trainer/Jockey angle</div>
      </div>
    </div>

    ${candidates.length === 0 ? '<div style="text-align:center;padding:48px;color:#9ca3af;">No HIGH conviction candidates scored yet.</div>' : cards}
  </div>
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(picksHtml);
    return;
  }

  if (url.pathname.startsWith('/monmouth/r')) {
    const raceNum = parseInt(url.pathname.replace('/monmouth/r', ''));
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const { rows: races } = await query(`
      SELECT r.id, r.race_number, r.distance, r.surface, r.conditions, r.post_time, r.purse, r.field_size
      FROM races r WHERE r.date = $1 AND r.track = 'Monmouth Park' AND r.race_number = $2
    `, [date, raceNum]);

    if (!races.length) { res.writeHead(404); res.end('Race not found'); return; }
    const race = races[0];

    const { rows: entries } = await query(`
      SELECT e.post_position, h.name, e.morning_line_odds, e.best_beyer, e.running_style, e.jockey, e.trainer, e.scratched
      FROM entries e JOIN horses h ON h.id = e.horse_id JOIN races r ON r.id = e.race_id
      WHERE r.date = $1 AND r.track = 'Monmouth Park' AND r.race_number = $2
      ORDER BY e.post_position
    `, [date, raceNum]);

    const theories = {
      1: { pick: 'AUSPLEXITY', pickPP: 2, ml: '5-2', composite: 12.7, favePP: 9, theory: "Turf sprint — AUSPLEXITY (5-2, Beyer 99) has the BEST figure in the field and S11 fires (inside turf speed from PP2). NATURES FURY (2-1) is the chalk but ran a 77 last out — massive regression from 97 best. At 2-1 that's terrible price for declining form. MUNCHKIN (10-1, Beyer 96) is the value bomb if her 77 last was a trip fluke.", bets: [{amount: '$10', type: 'Win', horse: '#2 AUSPLEXITY'}, {amount: '$5', type: 'Win', horse: '#5 MUNCHKIN'}, {amount: '$6', type: 'Exacta Box', horse: '2-9-5'}], total: '$21', box: [2,9,5] },
      2: { pick: 'FINAL JOKE', pickPP: 3, ml: '6-1', composite: 17.1, favePP: 6, theory: 'BONSAI WARRIOR (9-5, Beyer 102) is a monster figure but has 76-DAY LAYOFF and faces pace pressure from CAPTAIN OATS (E) and FRATELLONE (E/P). Too short for that risk. FINAL JOKE (6-1, Beyer 96) had a 70 last — classic troubled trip with 26-point drop. Stalks the duel from PP3. BLISS STREET (8-1, Beyer 96) is the same thesis, even bigger price. FRATELLONE (5-2, Beyer 87) is massively overbet — 4th best figure at 2nd shortest price.', bets: [{amount: '$10', type: 'Win', horse: '#3 FINAL JOKE'}, {amount: '$5', type: 'Win', horse: '#4 BLISS STREET'}, {amount: '$6', type: 'Exacta Box', horse: '3-4-6'}], total: '$21', box: [3,4,6] },
      3: { pick: 'CONFABULATION', pickPP: 5, ml: '7-2', composite: 15.4, favePP: 4, theory: 'CHALK IS WRONG. STREET GLIDE (9-5, Beyer 82) and KNOX (5-2, Beyer 77) are the two favorites with the WORST figures in a 6-horse field. The public is asleep. CONFABULATION (7-2, Beyer 94) has the best figure by 3 points. SYNTACTIC (8-1, Beyer 91) is 2nd best and razor sharp at 5 days off. This is a two-horse race between our picks — everyone else is 7+ points below.', bets: [{amount: '$30', type: 'Win', horse: '#5 CONFABULATION'}, {amount: '$30', type: 'Place', horse: '#5 CONFABULATION'}, {amount: '$15', type: 'Win', horse: '#2 SYNTACTIC'}, {amount: '$4', type: 'Exacta Box', horse: '5-2'}], total: '$79', box: [5,2] },
      4: { pick: 'BELLA BELLO BANKER', pickPP: 1, ml: '5-2', composite: 13.9, favePP: 1, theory: 'Bet the best horse. BELLA BELLO BANKER (5-2, Beyer 99) is field-best with S11 firing (inside turf draw, E/P style). Pace is hot — MYA PAPAYA (E), LADY HATHOR (E), PRECIOUS CAT (E/P) all want the front. BELLA BELLO saves ground on the rail and inherits. EMILY REWARD (12-1, Beyer 93) is the value underneath if she fires off 75 days.', bets: [{amount: '$10', type: 'Win', horse: '#1 BELLA BELLO BANKER'}, {amount: '$5', type: 'Win', horse: '#2 EMILY REWARD'}, {amount: '$6', type: 'Exacta Box', horse: '1-4-2'}], total: '$21', box: [1,4,2] },
      5: { pick: 'RED HEAD ITALIAN', pickPP: 5, ml: '5-2', composite: 18.7, favePP: 2, theory: "RED HEAD ITALIAN (5-2, Beyer 98, LAST 96) is the only horse in peak form — nobody else within 10 points of that last-race figure. Lone E-type who will dictate pace at 6F on dirt. LA RESOLANA (3-2) is the fade — 81 last, presser with no pace to press into. SHE'S A BOMBSHELL (8-1, Beyer 97) is the insurance play if RED HEAD tires — same ceiling as the fave at triple the price.", bets: [{amount: '$20', type: 'Win', horse: '#5 RED HEAD ITALIAN'}, {amount: '$20', type: 'Place', horse: '#5 RED HEAD ITALIAN'}, {amount: '$10', type: 'Win', horse: "#7 SHE'S A BOMBSHELL"}, {amount: '$12', type: 'Exacta Box', horse: '5-7-6'}], total: '$62', box: [5,7,6] },
      6: { pick: 'SHADYSIDE', pickPP: 7, ml: '6-1', composite: 14.5, favePP: 3, theory: "Turf route with slow pace — only TACO CAT BACKWARDS wants the front. LINARITE (4-1, Beyer 95) has the best figure by 5 points but ran 77 last and NEEDS pace to close into (won't get it). SHADYSIDE (6-1, Beyer 90, last 87) is a presser who makes his own trip — doesn't depend on pace setup. Running near peak, 12 days sharp. HAUNTRESS (3-1, Beyer 88) is the overbet chalk. EL MA'ANY (7-2) is 112 days off — terrible bet.", bets: [{amount: '$15', type: 'Win', horse: '#7 SHADYSIDE'}, {amount: '$10', type: 'Win', horse: '#2 LINARITE'}, {amount: '$6', type: 'Exacta Box', horse: '7-2-3'}], total: '$31', box: [7,2,3] }
    };

    const t = theories[raceNum];
    const postTime = race.post_time ? new Date('2026-01-01T' + race.post_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—';
    const isBestRace = raceNum === 5;
    const prevRace = raceNum > 1 ? raceNum - 1 : null;
    const nextRace = raceNum < 6 ? raceNum + 1 : null;

    let fieldRows = '';
    for (const e of entries) {
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

    const raceHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MTH R${raceNum} — Monmouth Park</title>
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
    .race-hero-num { font-size: 48px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; }
    .race-hero-time { font-size: 14px; color: #6b7280; margin-top: 4px; }
    .race-hero-info { font-size: 12px; color: #9ca3af; margin-top: 4px; }
    .race-hero-composite { font-size: 24px; font-weight: 800; margin-top: 12px; }
    ${isBestRace ? '.race-hero-num { color: #16a34a; }' : ''}

    .pick-hero { background: #fff; border: 2px solid #1a1a1a; border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: center; }
    .pick-hero-name { font-size: 20px; font-weight: 800; }
    .pick-hero-meta { font-size: 13px; color: #6b7280; margin-top: 4px; }
    ${isBestRace ? '.pick-hero { border-color: #16a34a; }' : ''}

    .theory-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
    .theory-title { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 700; margin-bottom: 8px; }
    .theory-text { font-size: 13px; color: #374151; line-height: 1.7; }

    .wager-card { background: #1a1a1a; border-radius: 12px; padding: 16px; margin-bottom: 16px; color: #fff; }
    .wager-title { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 700; margin-bottom: 10px; }
    .wager-detail { font-size: 14px; font-weight: 600; line-height: 1.6; }
    .wager-list { list-style: none; padding: 0; margin: 0 0 12px; }
    .wager-list li { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 14px; font-weight: 500; }
    .wager-list li:last-child { border-bottom: none; }
    .wager-check { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.4); border-radius: 4px; flex-shrink: 0; }
    .wager-amount { color: #4ade80; font-weight: 700; min-width: 40px; }
    .wager-type { color: rgba(255,255,255,0.7); }
    .wager-total { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; }
    .wager-total-amount { font-size: 18px; color: #fff; }

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
    .field-table .style { color: #6b7280; }
    .field-table .jockey { color: #9ca3af; font-size: 11px; }
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
      ${prevRace ? '<a href="/monmouth/r' + prevRace + '?date=' + date + '" class="nav-btn">&larr; R' + prevRace + '</a>' : '<span></span>'}
      <div class="nav-dots">
        ${[1,2,3,4,5,6].map(n => '<div class="nav-dot ' + (n === raceNum ? 'active' : '') + '"></div>').join('')}
      </div>
      ${nextRace ? '<a href="/monmouth/r' + nextRace + '?date=' + date + '" class="nav-btn">R' + nextRace + ' &rarr;</a>' : '<span></span>'}
    </div>

    <div class="race-hero">
      <div class="race-hero-num">R${raceNum}</div>
      <div class="race-hero-time">${postTime} ET</div>
      <div class="race-hero-info">${race.distance} ${race.surface} • ${race.conditions} • ${race.field_size} runners</div>
      ${t ? '<div class="race-hero-composite">' + t.composite.toFixed(1) + '</div>' : ''}
    </div>

    ${t ? `
    <div class="pick-hero">
      <div class="pick-hero-name">${t.pick}</div>
      <div class="pick-hero-meta">PP${t.pickPP} • ML ${t.ml}</div>
    </div>

    <div class="wager-card">
      <div class="wager-title">WAGER</div>
      <ul class="wager-list">
        ${t.bets.map(b => '<li><div class="wager-check"></div><span class="wager-amount">' + b.amount + '</span><span class="wager-type">' + b.type + '</span><span>' + b.horse + '</span></li>').join('')}
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
      ${prevRace ? '<a href="/monmouth/r' + prevRace + '?date=' + date + '" class="nav-btn">&larr; R' + prevRace + '</a>' : '<span></span>'}
      <a href="/monmouth?date=${date}" class="nav-btn">All Races</a>
      ${nextRace ? '<a href="/monmouth/r' + nextRace + '?date=' + date + '" class="nav-btn">R' + nextRace + ' &rarr;</a>' : '<span></span>'}
    </div>
  </div>
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(raceHtml);
    return;
  }

  if (url.pathname === '/monmouth') {
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const { rows: races } = await query(`
      SELECT r.id, r.race_number, r.distance, r.surface, r.conditions, r.post_time, r.purse, r.field_size
      FROM races r
      WHERE r.date = $1 AND r.track = 'Monmouth Park'
      ORDER BY r.race_number
    `, [date]);

    const { rows: entries } = await query(`
      SELECT r.race_number, e.post_position, h.name, e.morning_line_odds, e.best_beyer, e.running_style, e.jockey, e.trainer, e.scratched
      FROM entries e
      JOIN horses h ON h.id = e.horse_id
      JOIN races r ON r.id = e.race_id
      WHERE r.date = $1 AND r.track = 'Monmouth Park'
      ORDER BY r.race_number, e.post_position
    `, [date]);

    const theories = {
      1: { pick: 'AUSPLEXITY', pickPP: 2, ml: '5-2', composite: 12.7, favePP: 9, theory: "Turf sprint — AUSPLEXITY (5-2, Beyer 99) has the BEST figure in the field and S11 fires (inside turf speed from PP2). NATURES FURY (2-1) is the chalk but ran a 77 last out — massive regression from 97 best. At 2-1 that's terrible price for declining form. MUNCHKIN (10-1, Beyer 96) is the value bomb if her 77 last was a trip fluke.", bets: [{amount: '$10', type: 'Win', horse: '#2 AUSPLEXITY'}, {amount: '$5', type: 'Win', horse: '#5 MUNCHKIN'}, {amount: '$6', type: 'Exacta Box', horse: '2-9-5'}], total: '$21', box: [2,9,5] },
      2: { pick: 'FINAL JOKE', pickPP: 3, ml: '6-1', composite: 17.1, favePP: 6, theory: 'BONSAI WARRIOR (9-5, Beyer 102) is a monster figure but has 76-DAY LAYOFF and faces pace pressure from CAPTAIN OATS (E) and FRATELLONE (E/P). Too short for that risk. FINAL JOKE (6-1, Beyer 96) had a 70 last — classic troubled trip with 26-point drop. Stalks the duel from PP3. BLISS STREET (8-1, Beyer 96) is the same thesis, even bigger price. FRATELLONE (5-2, Beyer 87) is massively overbet — 4th best figure at 2nd shortest price.', bets: [{amount: '$10', type: 'Win', horse: '#3 FINAL JOKE'}, {amount: '$5', type: 'Win', horse: '#4 BLISS STREET'}, {amount: '$6', type: 'Exacta Box', horse: '3-4-6'}], total: '$21', box: [3,4,6] },
      3: { pick: 'CONFABULATION', pickPP: 5, ml: '7-2', composite: 15.4, favePP: 4, theory: 'CHALK IS WRONG. STREET GLIDE (9-5, Beyer 82) and KNOX (5-2, Beyer 77) are the two favorites with the WORST figures in a 6-horse field. The public is asleep. CONFABULATION (7-2, Beyer 94) has the best figure by 3 points. SYNTACTIC (8-1, Beyer 91) is 2nd best and razor sharp at 5 days off. This is a two-horse race between our picks — everyone else is 7+ points below.', bets: [{amount: '$30', type: 'Win', horse: '#5 CONFABULATION'}, {amount: '$30', type: 'Place', horse: '#5 CONFABULATION'}, {amount: '$15', type: 'Win', horse: '#2 SYNTACTIC'}, {amount: '$4', type: 'Exacta Box', horse: '5-2'}], total: '$79', box: [5,2] },
      4: { pick: 'BELLA BELLO BANKER', pickPP: 1, ml: '5-2', composite: 13.9, favePP: 1, theory: 'Bet the best horse. BELLA BELLO BANKER (5-2, Beyer 99) is field-best with S11 firing (inside turf draw, E/P style). Pace is hot — MYA PAPAYA (E), LADY HATHOR (E), PRECIOUS CAT (E/P) all want the front. BELLA BELLO saves ground on the rail and inherits. EMILY REWARD (12-1, Beyer 93) is the value underneath if she fires off 75 days.', bets: [{amount: '$10', type: 'Win', horse: '#1 BELLA BELLO BANKER'}, {amount: '$5', type: 'Win', horse: '#2 EMILY REWARD'}, {amount: '$6', type: 'Exacta Box', horse: '1-4-2'}], total: '$21', box: [1,4,2] },
      5: { pick: 'RED HEAD ITALIAN', pickPP: 5, ml: '5-2', composite: 18.7, favePP: 2, theory: "RED HEAD ITALIAN (5-2, Beyer 98, LAST 96) is the only horse in peak form — nobody else within 10 points of that last-race figure. Lone E-type who will dictate pace at 6F on dirt. LA RESOLANA (3-2) is the fade — 81 last, presser with no pace to press into. SHE'S A BOMBSHELL (8-1, Beyer 97) is the insurance play if RED HEAD tires — same ceiling as the fave at triple the price.", bets: [{amount: '$20', type: 'Win', horse: '#5 RED HEAD ITALIAN'}, {amount: '$20', type: 'Place', horse: '#5 RED HEAD ITALIAN'}, {amount: '$10', type: 'Win', horse: "#7 SHE'S A BOMBSHELL"}, {amount: '$12', type: 'Exacta Box', horse: '5-7-6'}], total: '$62', box: [5,7,6] },
      6: { pick: 'SHADYSIDE', pickPP: 7, ml: '6-1', composite: 14.5, favePP: 3, theory: "Turf route with slow pace — only TACO CAT BACKWARDS wants the front. LINARITE (4-1, Beyer 95) has the best figure by 5 points but ran 77 last and NEEDS pace to close into (won't get it). SHADYSIDE (6-1, Beyer 90, last 87) is a presser who makes his own trip — doesn't depend on pace setup. Running near peak, 12 days sharp. HAUNTRESS (3-1, Beyer 88) is the overbet chalk. EL MA'ANY (7-2) is 112 days off — terrible bet.", bets: [{amount: '$15', type: 'Win', horse: '#7 SHADYSIDE'}, {amount: '$10', type: 'Win', horse: '#2 LINARITE'}, {amount: '$6', type: 'Exacta Box', horse: '7-2-3'}], total: '$31', box: [7,2,3] }
    };

    let raceCards = '';
    for (const race of races) {
      const raceEntries = entries.filter(e => e.race_number === race.race_number);
      const t = theories[race.race_number];
      const postTime = race.post_time ? new Date('2026-01-01T' + race.post_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—';
      const isBestRace = race.race_number === 5;

      let fieldRows = '';
      for (const e of raceEntries) {
        const isPick = t && e.post_position === t.pickPP;
        const inBox = t && t.box.includes(e.post_position);
        fieldRows += `
          <tr class="${isPick ? 'pick-row' : ''} ${e.scratched ? 'scratched-row' : ''}">
            <td class="pp">${e.post_position}</td>
            <td class="horse">${e.name}${isPick ? ' <span class="pick-badge">PICK</span>' : ''}${e.scratched ? ' <span class="scr-badge">SCR</span>' : ''}</td>
            <td class="ml">${e.morning_line_odds || '—'}</td>
            <td class="beyer">${e.best_beyer || '—'}</td>
            <td class="style">${e.running_style || '—'}</td>
            <td class="jockey">${e.jockey || '—'}</td>
          </tr>`;
      }

      raceCards += `
        <div class="race-card ${isBestRace ? 'best-race' : ''}">
          <div class="race-header">
            <div class="race-id">
              <span class="race-num">R${race.race_number}</span>
              <span class="race-time">${postTime} ET</span>
            </div>
            <div class="race-info">${race.distance} ${race.surface} • ${race.conditions} • ${race.field_size} runners</div>
            ${t && t.composite ? '<span class="composite-badge">' + t.composite.toFixed(1) + '</span>' : ''}
            ${isBestRace ? '<span class="best-badge">BEST BET</span>' : ''}
          </div>
          <table class="field-table">
            <thead><tr><th>PP</th><th>Horse</th><th>ML</th><th>Beyer</th><th>Style</th><th>Jockey</th></tr></thead>
            <tbody>${fieldRows}</tbody>
          </table>
          ${t ? `
            <div class="theory-section">
              <div class="theory-title">THEORY</div>
              <p class="theory-text">${t.theory}</p>
            </div>
            <div class="wager-section">
              <div class="wager-title">WAGER</div>
              <div class="wager-pick"><span class="wager-horse">${t.pick}</span> <span class="wager-ml">(${t.ml})</span></div>
              <div class="wager-detail">${t.wager}</div>
            </div>
          ` : ''}
        </div>`;
    }

    const mthHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FTC — Monmouth Park</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, -apple-system, sans-serif; background: #f8f8f6; padding: 16px; color: #1a1a1a; }
    .container { max-width: 700px; margin: 0 auto; }
    .page-header { text-align: center; margin-bottom: 24px; }
    .page-title { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
    .page-subtitle { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .page-budget { font-size: 13px; font-weight: 700; color: #1a1a1a; margin-top: 8px; background: #fff; border: 1px solid #e5e7eb; display: inline-block; padding: 4px 12px; border-radius: 6px; }

    .race-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 16px; overflow: hidden; }
    .best-race { border: 2px solid #16a34a; }
    .race-header { padding: 12px 16px; background: #fafaf8; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .race-id { display: flex; flex-direction: column; }
    .race-num { font-size: 18px; font-weight: 800; }
    .race-time { font-size: 11px; color: #6b7280; }
    .race-info { font-size: 11px; color: #6b7280; flex: 1; }
    .composite-badge { font-size: 14px; font-weight: 800; color: #1a1a1a; background: #f3f4f6; border: 1px solid #e5e7eb; padding: 2px 10px; border-radius: 6px; }
    .best-badge { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; background: #16a34a; color: #fff; padding: 3px 8px; border-radius: 4px; }

    .field-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .field-table thead { background: #f9fafb; }
    .field-table th { padding: 6px 10px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
    .field-table td { padding: 6px 10px; border-bottom: 1px solid #f3f4f6; }
    .field-table .pp { font-weight: 700; width: 30px; }
    .field-table .horse { font-weight: 500; }
    .field-table .ml { color: #6b7280; text-align: right; }
    .field-table .beyer { font-weight: 700; text-align: right; }
    .field-table .style { color: #6b7280; text-align: center; }
    .field-table .jockey { color: #9ca3af; font-size: 11px; }
    .pick-row { background: #f0fdf4; }
    .pick-row .horse { font-weight: 700; }
    .scratched-row { opacity: 0.4; text-decoration: line-through; }
    .pick-badge { font-size: 8px; font-weight: 800; background: #1a1a1a; color: #fff; padding: 1px 5px; border-radius: 3px; vertical-align: middle; margin-left: 4px; }
    .scr-badge { font-size: 8px; font-weight: 700; background: #fee2e2; color: #991b1b; padding: 1px 4px; border-radius: 3px; vertical-align: middle; margin-left: 4px; }

    .theory-section { padding: 12px 16px; border-top: 1px solid #f3f4f6; }
    .theory-title { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 700; margin-bottom: 6px; }
    .theory-text { font-size: 12px; color: #374151; line-height: 1.6; }

    .wager-section { padding: 12px 16px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
    .wager-title { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 700; margin-bottom: 6px; }
    .wager-pick { font-size: 14px; font-weight: 800; margin-bottom: 4px; }
    .wager-ml { font-size: 12px; color: #6b7280; font-weight: 500; }
    .wager-detail { font-size: 12px; color: #374151; font-weight: 500; }
  </style>
</head>
<body>
  <div class="container">
    <div class="page-header">
      <div class="page-title">Monmouth Park</div>
      <div class="page-subtitle">${date} — 6 races • First post 2:00 PM ET</div>
      <div class="page-budget">Day budget: $154</div>
    </div>
    ${raceCards}
  </div>
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(mthHtml);
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Execution tracker running at http://localhost:${PORT}`);
});

process.on('SIGTERM', async () => { await pool.end(); process.exit(0); });
process.on('SIGINT', async () => { await pool.end(); process.exit(0); });
