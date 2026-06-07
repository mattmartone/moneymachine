// Money Machine — Churchill Downs 5/31/2026 — LIVE DAY 3
(function() {
    'use strict';

    // Today's bets (populated as we go)
    const ACTUAL_BETS = {};

    // Today's results (populated as races finish)
    const RESULTS = {};

    let state = {
        activeView: 'races',
        activeRace: 0,
        activeRaceTab: 'field',
        signals: SIGNALS.map(s => ({ ...s })),
        customRows: [],
        horseTags: {},
        picks: {},
        scratches: {},
        liveOdds: {},
        recommendations: {},
        savedRuns: {},
        activeRunIdx: {}
    };

    const QUOTES = [
        { text: "Look at her. She's a beautiful creature.", attr: 'Tony Soprano', ctx: 'On first meeting the horse' },
        { text: "That's our girl! She's a beautiful, innocent creature!", attr: 'Tony Soprano', ctx: 'When she wins her first race' },
        { text: "Can't I just be sad for a horse, without some touchy-feely, Freudian shit component to it?", attr: 'Tony Soprano', ctx: 'Defending his grief to Dr. Melfi' },
        { text: 'She was a beautiful, innocent creature! What did she ever do to you?', attr: 'Tony Soprano', ctx: 'The final confrontation with Ralph' },
        { text: 'And tell that midget not to be shy with the whip.', attr: 'Ralph Cifaretto', ctx: 'To the trainer at the track' },
        { text: "The horse was no f---ing good with the colic all the time. I know it's tragic to think this way, but you can't argue with the f---ing logic.", attr: 'Ralph Cifaretto', ctx: 'Rationalizing the insurance fraud' },
        { text: "It was a f---ing horse! What are you, a vegetarian? You eat beef and sausage by the cartload!", attr: 'Ralph Cifaretto', ctx: 'His final words before Tony attacks' }
    ];
    let quoteIdx = Math.floor(Math.random() * QUOTES.length);
    let quoteInterval = null;

    function esc(s) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; }
    function fmt(n) { const a = Math.abs(n); const s = a >= 1000 ? '$'+a.toLocaleString('en-US',{maximumFractionDigits:2}) : '$'+a.toFixed(2); return n < 0 ? '-'+s : s; }

    // --- VIEW NAV ---
    document.querySelectorAll('.view-nav__btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.activeView = btn.dataset.view;
            render();
        });
    });

    // --- RACE TAB NAV ---
    document.querySelectorAll('.race-tabs__btn').forEach(btn => {
        if (btn.dataset.tab === 'submit' || btn.dataset.tab === 'results') return;
        btn.addEventListener('click', () => {
            state.activeRaceTab = btn.dataset.tab;
            render();
        });
    });

    // --- RENDER ---
    function render() {
        document.querySelectorAll('.view-nav__btn').forEach(b => {
            b.classList.toggle('view-nav__btn--active', b.dataset.view === state.activeView);
        });
        const raceNav = document.getElementById('race-nav');
        const raceTabs = document.getElementById('race-tabs');
        raceNav.classList.toggle('race-nav--hidden', state.activeView !== 'races');
        raceTabs.style.display = state.activeView === 'races' ? 'flex' : 'none';

        document.querySelectorAll('.race-tabs__btn').forEach(b => {
            b.classList.toggle('race-tabs__btn--active', b.dataset.tab === state.activeRaceTab);
            if (b.dataset.tab === 'submit' || b.dataset.tab === 'results') b.style.display = 'none';
        });

        if (state.activeView === 'races') { renderRaceNav(); renderRace(); }
        else if (state.activeView === 'recap') { renderRecap(); }
        else if (state.activeView === 'strategy') { renderStrategy(); }
        else if (state.activeView === 'history') { renderHistory(); }
        else if (state.activeView === 'todo') { renderTodo(); }

        renderStats();
    }

    // --- STATS ---
    function renderStats() {
        let totalBet = 0, totalCollected = 0, wins = 0, losses = 0;
        Object.keys(RESULTS).forEach(r => {
            const bet = ACTUAL_BETS[r];
            const res = RESULTS[r];
            if (!bet) return;
            totalBet += bet.totalWagered;
            totalCollected += res.collected;
            if (res.collected > bet.totalWagered) wins++; else losses++;
        });
        const todayPL = totalCollected - totalBet;
        const lifetimePL = LIFETIME_PRIOR_PL + todayPL;
        const lifetime = LIFETIME_STARTING_BANKROLL + lifetimePL;
        const roi = totalBet > 0 ? ((todayPL / totalBet) * 100) : 0;

        const el = (id, text, cls) => { const e = document.getElementById(id); if (!e) return; e.textContent = text; e.className = 'header__stat-value' + (cls ? ' '+cls : ''); };
        el('stat-lifetime', fmt(lifetime), lifetimePL > 0 ? 'up' : lifetimePL < 0 ? 'down' : '');
        el('stat-pl', (todayPL >= 0 ? '+' : '') + fmt(todayPL), todayPL > 0 ? 'up' : todayPL < 0 ? 'down' : '');
        el('stat-roi', totalBet > 0 ? ((todayPL >= 0 ? '+' : '') + roi.toFixed(1) + '%') : '0%', roi > 0 ? 'up' : roi < 0 ? 'down' : '');
        el('stat-record', `${wins}W-${losses}L`, '');
    }

    // --- RACE NAV ---
    function renderRaceNav() {
        const nav = document.getElementById('race-nav');
        nav.innerHTML = RACES.map((race, i) => {
            const active = i === state.activeRace;
            const raceNum = race.number;
            const hasResult = !!RESULTS[raceNum];
            const hasBets = !!ACTUAL_BETS[raceNum];
            let icon = '';
            if (hasResult) {
                const res = RESULTS[raceNum];
                const bet = ACTUAL_BETS[raceNum];
                const profit = res.collected - bet.totalWagered;
                icon = profit > 0 ? '💰' : '❌';
            } else if (hasBets) {
                icon = '⏳';
            }
            return `<button class="race-nav__btn ${active?'race-nav__btn--active':''} ${hasResult?'race-nav__btn--settled':''} ${hasBets&&!hasResult?'race-nav__btn--picks':''}" onclick="MM.switchRace(${i})">R${race.number}${icon ? `<span class="race-nav__btn-icon">${icon}</span>` : ''}</button>`;
        }).join('');
    }

    // --- RACE VIEW ---
    function renderRace() {
        const main = document.getElementById('main-content');
        const i = state.activeRace;
        if (i < 0 || i >= RACES.length) { main.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-body);opacity:0.5">Select a race</div>'; return; }

        const race = RACES[i];
        const raceNum = race.number;
        const bets = ACTUAL_BETS[raceNum] || null;
        const result = RESULTS[raceNum] || null;
        const picks = state.picks[i] || null;

        let html = '<div class="race-page">';

        html += `<div class="race-page__header">
            <h2 class="race-page__title">R${race.number}: ${esc(race.name)}</h2>
            <div class="race-page__meta">
                <span class="race-page__meta-chip">${esc(race.distance)}</span>
                <span class="race-page__meta-chip race-page__meta-chip--surface">${esc(race.surface)}</span>
                ${race.postTime ? `<span class="race-page__meta-chip">${esc(race.postTime)}</span>` : ''}
                ${race.purse ? `<span class="race-page__meta-chip race-page__meta-chip--grade">${esc(race.purse)}</span>` : ''}
                <span class="race-page__meta-chip">${race.horses.filter(h => !(race.scratches||[]).includes(h.number)).length} runners</span>
            </div>
            ${race.condition ? `<p class="race-page__condition">${esc(race.condition)}</p>` : ''}
        </div>`;

        // Result banner
        if (result && bets) {
            const profit = result.collected - bets.totalWagered;
            const cls = profit > 0 ? 'result-banner--win' : 'result-banner--loss';
            const orderStr = result.order.map((n,idx) => {
                const h = race.horses.find(h => h.number === n);
                return `${idx+1}${idx===0?'st':idx===1?'nd':idx===2?'rd':'th'}: #${n} ${h?h.name:''}`;
            }).join(' · ');
            html += `<div class="result-banner ${cls}"><div class="result-banner__left"><span class="result-banner__label">RESULT</span><span class="result-banner__detail">${orderStr}</span></div><div class="result-banner__right"><span class="result-banner__payout">Collected: ${fmt(result.collected)}</span><span class="result-banner__profit ${profit>=0?'up':'down'}">${profit>=0?'+':''}${fmt(profit)}</span></div></div>`;
        } else if (bets && !result) {
            html += `<div class="result-banner" style="background:rgba(212,162,76,0.08);border-color:var(--accent-amber)"><div class="result-banner__left"><span class="result-banner__label" style="color:var(--accent-amber)">PENDING</span><span class="result-banner__detail">Bets placed — awaiting result</span></div></div>`;
        }

        const tab = state.activeRaceTab;
        if (tab === 'field') {
            html += renderFieldTab(race, i);
        } else if (tab === 'analysis') {
            html += renderBetsTab(race, raceNum, bets, result);
        } else if (tab === 'signals') {
            html += renderSignalsTab(race, i, picks);
        }

        html += '</div>';
        html += renderFooterGallery();
        main.innerHTML = html;
        startQuoteRotation();
    }

    function renderFieldTab(race, raceIdx) {
        const scratches = race.scratches || [];
        const liveOddsForRace = state.liveOdds[raceIdx] || {};
        let html = `<div class="field-section">
            <div class="field-section__header"><h3>Field</h3><span style="font-size:0.65rem;color:var(--text-body);opacity:0.6">Click odds to update live · Click SCR to scratch</span></div>
            <table class="field-table"><thead><tr><th>#</th><th>Horse</th><th>Jockey</th><th>Trainer</th><th>ML</th><th>Live</th><th></th></tr></thead><tbody>`;
        race.horses.forEach(h => {
            const isScratched = scratches.includes(h.number);
            const liveOdd = liveOddsForRace[h.number] || '';
            html += `<tr style="${isScratched?'opacity:0.35':''}">
                <td class="field-table__num">${h.number}</td>
                <td class="field-table__name" style="${isScratched?'text-decoration:line-through':''}">${esc(h.name)}${isScratched?' (SCR)':''}</td>
                <td>${esc(h.jockey)}</td>
                <td>${esc(h.trainer)}</td>
                <td class="field-table__ml">${esc(h.ml)}</td>
                <td><input type="text" value="${esc(liveOdd)}" placeholder="—" style="width:50px;background:var(--bg-elevated);border:1px solid var(--border-brown);border-radius:4px;color:var(--accent-amber);font-family:var(--font-mono);font-size:0.75rem;padding:2px 6px;text-align:center" onchange="MM.setLiveOdds(${raceIdx},${h.number},this.value)" ${isScratched?'disabled':''}></td>
                <td><button onclick="MM.toggleScratch(${raceIdx},${h.number})" style="font-size:0.6rem;padding:2px 6px;border:1px solid ${isScratched?'var(--success)':'var(--danger)'};border-radius:4px;background:transparent;color:${isScratched?'var(--success)':'var(--danger)'};cursor:pointer">${isScratched?'Unscratch':'SCR'}</button></td>
            </tr>`;
        });
        html += '</tbody></table></div>';
        html += renderExecuteButton(raceIdx);
        return html;
    }

    function renderExecuteButton(raceIdx) {
        const race = RACES[raceIdx];
        const picks = state.picks[raceIdx];
        const hasBets = !!ACTUAL_BETS[race.number];
        let recs = state.recommendations ? state.recommendations[raceIdx] : null;

        let html = `<div style="margin-top:1.5rem;text-align:center">
            <button class="btn btn--execute" onclick="MM.executeAnalysis(${raceIdx})" style="padding:0.75rem 2rem;font-size:0.85rem;font-weight:700;background:var(--accent-amber);color:#0B1B1F;border:none;border-radius:var(--radius);cursor:pointer;transition:all 0.15s">
                ⚡ EXECUTE ANALYSIS — GET BETS
            </button>`;
        if (picks && picks.scores) {
            const top = picks.scores.filter(s => s.total >= 3);
            if (top.length) {
                html += `<div style="margin-top:0.75rem;font-size:0.7rem;color:var(--text-body);opacity:0.7">Signal scoring ready — ${top.length} horse${top.length>1?'s':''} scored 3+</div>`;
            }
        }
        html += '</div>';

        // Show run tabs if multiple runs exist
        const runs = state.savedRuns[raceIdx] || [];
        if (runs.length > 0) {
            const activeIdx = state.activeRunIdx[raceIdx] || 0;
            html += `<div style="margin-top:1.5rem;display:flex;gap:0.4rem;flex-wrap:wrap;border-bottom:1px solid var(--border-brown);padding-bottom:0.5rem">`;
            runs.forEach((run, idx) => {
                const isActive = idx === activeIdx;
                html += `<button onclick="MM.switchRun(${raceIdx},${idx})" style="padding:0.35rem 0.7rem;font-size:0.6rem;border:1px solid ${isActive?'var(--accent-amber)':'var(--border-brown)'};border-radius:4px;background:${isActive?'var(--accent-amber)':'transparent'};color:${isActive?'#0B1B1F':'var(--text-body)'};cursor:pointer;font-weight:${isActive?'700':'400'}">${run.timestamp}</button>`;
            });
            html += `</div>`;

            // Use the active run's data
            if (!recs || !recs.win) {
                const activeRun = runs[state.activeRunIdx[raceIdx] || 0];
                if (activeRun && activeRun.result) {
                    recs = activeRun.result;
                    if (!state.lastPrompt) state.lastPrompt = {};
                    state.lastPrompt[raceIdx] = activeRun.prompt;
                }
            }
        }

        // Show recommendations if generated
        if (recs) {
            if (recs.loading) {
                html += `<div style="margin-top:1.5rem;padding:2rem;text-align:center;background:var(--bg-surface);border:2px solid var(--accent-amber);border-radius:var(--radius-lg)">
                    <div style="font-family:var(--font-display);color:var(--accent-amber);font-size:1.1rem;margin-bottom:0.5rem">Analyzing R${race.number}...</div>
                    <div style="font-size:0.75rem;color:var(--text-body)">Claude is reasoning through the field. This takes 15-30 seconds.</div>
                </div>`;
            } else if (recs.error) {
                html += `<div style="margin-top:1.5rem;padding:1.25rem;background:rgba(181,87,61,0.1);border:2px solid var(--danger);border-radius:var(--radius-lg)">
                    <h3 style="color:var(--danger);margin-bottom:0.5rem">Analysis Error</h3>
                    <div style="font-size:0.75rem;color:var(--text-body)">${esc(recs.error)}</div>
                    ${recs.raw ? `<pre style="font-size:0.6rem;color:var(--text-body);opacity:0.6;margin-top:0.5rem;white-space:pre-wrap;max-height:200px;overflow:auto">${esc(recs.raw)}</pre>` : ''}
                </div>`;
            } else {
                html += `<div style="margin-top:1.5rem;padding:1.25rem;background:var(--bg-surface);border:2px solid var(--accent-amber);border-radius:var(--radius-lg)">
                    <h3 style="font-family:var(--font-display);color:var(--accent-amber);margin-bottom:1rem">Recommended Bets — R${race.number}</h3>`;

                html += `<div class="pick-card" style="margin-bottom:0.75rem"><div class="pick-card__header"><span class="pick-card__type" style="background:var(--accent-amber);color:#0B1B1F">WIN</span><span class="pick-card__wager">$50 to win</span></div><div class="pick-card__horse" style="color:var(--text-cream);font-size:0.9rem">#${recs.win.horse} ${esc(recs.win.name)} (${esc(recs.win.odds)})</div><div style="font-size:0.75rem;color:var(--text-body);margin-top:0.4rem;line-height:1.4">${esc(recs.win.reason)}</div></div>`;

                html += `<div class="pick-card" style="margin-bottom:0.75rem"><div class="pick-card__header"><span class="pick-card__type">EXACTA BOX</span><span class="pick-card__wager">$30</span></div><div class="pick-card__horse" style="color:var(--text-cream);font-size:0.9rem">${recs.exacta.horses.map(n => { const h = race.horses.find(x=>x.number===n); return '#'+n+' '+(h?h.name:''); }).join(' / ')}</div></div>`;

                html += `<div class="pick-card" style="margin-bottom:0.75rem"><div class="pick-card__header"><span class="pick-card__type">TRIFECTA BOX</span><span class="pick-card__wager">$24</span></div><div class="pick-card__horse" style="color:var(--text-cream);font-size:0.9rem">${recs.trifecta.horses.map(n => { const h = race.horses.find(x=>x.number===n); return '#'+n+' '+(h?h.name:''); }).join(' / ')}</div></div>`;

                html += `<div style="font-family:var(--font-mono);font-size:0.8rem;color:var(--text-body);margin-top:1rem;padding:0.5rem;background:var(--bg-elevated);border-radius:var(--radius)">Total wagered: <strong>$104</strong></div>`;

                if (recs.notes) {
                    html += `<div style="font-size:0.75rem;color:var(--accent-amber);margin-top:0.75rem;font-weight:600">${esc(recs.notes)}</div>`;
                }

                if (recs.analysis) {
                    html += `<details style="margin-top:1rem;border:1px solid var(--border-brown);border-radius:var(--radius);overflow:hidden" open>
                        <summary style="padding:0.75rem;background:var(--bg-elevated);color:var(--text-cream);font-size:0.75rem;cursor:pointer;font-weight:600">Full Analysis</summary>
                        <div style="padding:1rem;font-size:0.75rem;color:var(--text-body);line-height:1.5">${esc(recs.analysis)}</div>
                    </details>`;
                }

                if (recs.signalBreakdown && recs.signalBreakdown.length) {
                    html += `<details style="margin-top:0.75rem;border:1px solid var(--border-brown);border-radius:var(--radius);overflow:hidden">
                        <summary style="padding:0.75rem;background:var(--bg-elevated);color:var(--text-cream);font-size:0.75rem;cursor:pointer;font-weight:600">Signal-by-Signal Breakdown (${recs.signalBreakdown.filter(s=>s.fired).length}/${recs.signalBreakdown.length} fired)</summary>
                        <div style="padding:1rem">`;
                    recs.signalBreakdown.forEach(sb => {
                        const sig = state.signals.find(s => s.id === sb.id);
                        const sigName = sig ? sig.name : sb.id;
                        const firedColor = sb.fired ? 'var(--success)' : 'var(--text-body)';
                        const firedIcon = sb.fired ? '✅' : '—';
                        const horsesStr = sb.horses && sb.horses.length ? sb.horses.map(n => { const h = race.horses.find(x=>x.number===n); return '#'+n+(h?' '+h.name:''); }).join(', ') : '';
                        html += `<div style="margin-bottom:0.75rem;padding:0.6rem;background:var(--bg-base);border-radius:var(--radius);border-left:3px solid ${firedColor}">
                            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.3rem">
                                <span style="font-size:0.7rem">${firedIcon}</span>
                                <span style="font-size:0.7rem;font-weight:700;color:${firedColor}">${esc(sb.id)}: ${esc(sigName)}</span>
                                ${sb.fired && horsesStr ? `<span style="font-size:0.6rem;color:var(--accent-amber);margin-left:auto">${esc(horsesStr)}</span>` : ''}
                            </div>
                            <div style="font-size:0.65rem;color:var(--text-body);line-height:1.4;opacity:0.85">${esc(sb.reasoning)}</div>
                        </div>`;
                    });
                    html += '</div></details>';
                }

                html += '</div>';

                // Collapsible prompt inspector — show FULL data as sent
                const promptData = (state.lastPrompt || {})[raceIdx];
                if (promptData) {
                    const scratches = promptData.race.scratches || [];
                    const liveHorses = promptData.race.horses.filter(h => !scratches.includes(h.number));
                    const fieldStr = liveHorses.map(h => {
                        const lo = (promptData.liveOdds||{})[h.number]||'';
                        return `#${h.number} ${h.name} | ML: ${h.ml}${lo?' | LIVE ODDS: '+lo:''} | J: ${h.jockey} | T: ${h.trainer} | ${h.notes || '(no data)'}`;
                    }).join('\n\n');
                    const rulesStr = promptData.rules.filter(r => r.active).map(r => `${r.id}: ${r.name} — ${r.description}`).join('\n');
                    const sigsStr = promptData.signals.filter(s => s.active).map(s => {
                        let line = `${s.id} (weight +${s.weight}): ${s.name} — ${s.description}`;
                        if (s.detection) line += `\n   DETECTION: ${s.detection}`;
                        if (s.dataStatus === 'yellow') line += `\n   ⚠️ ${s.dataNote || ''}`;
                        if (s.dataStatus === 'red') line += `\n   🚫 ${s.dataNote || ''}`;
                        return line;
                    }).join('\n\n');

                    html += `<details style="margin-top:1rem;border:1px solid var(--border-brown);border-radius:var(--radius);overflow:hidden">
                        <summary style="padding:0.75rem;background:var(--bg-elevated);color:var(--text-body);font-size:0.7rem;cursor:pointer;font-weight:600">View Full Prompt Sent to Claude</summary>
                        <div style="padding:1rem;font-family:var(--font-mono);font-size:0.55rem;color:var(--text-body);line-height:1.7;white-space:pre-wrap;max-height:600px;overflow:auto;background:var(--bg-base)">RACE: R${promptData.race.number} — ${esc(promptData.race.name)}
Distance: ${esc(promptData.race.distance)} | Surface: ${esc(promptData.race.surface)} | Purse: ${esc(promptData.race.purse||'N/A')}
Condition: ${esc(promptData.race.condition||'N/A')}
Live Runners: ${liveHorses.length}

═══ FIELD (Full DRF Data) ═══

${esc(fieldStr)}

═══ ACTIVE RULES ═══

${esc(rulesStr)}

═══ ACTIVE SIGNALS (with Detection Instructions) ═══

${esc(sigsStr)}

═══ LIVE ODDS OVERRIDES ═══
${JSON.stringify(promptData.liveOdds || {}, null, 2)}</div>
                    </details>`;
                }
            }
        }

        return html;
    }

    function renderBetsTab(race, raceNum, bets, result) {
        let html = '';
        html += renderExecuteButton(RACES.findIndex(r => r.number === raceNum));
        if (!bets) {
            html += '<div style="padding:2rem;text-align:center;color:var(--text-body);opacity:0.5">No bets placed on this race yet.</div>';
            return html;
        }

        html += `<div class="picks-output"><h3 class="picks-output__title">Our Bets — R${raceNum}</h3>`;

        if (bets.win) {
            const hitWin = result && result.order[0] === bets.win.horse;
            const statusIcon = result ? (hitWin ? '✅' : '❌') : '⏳';
            html += `<div class="pick-card"><div class="pick-card__header"><span class="pick-card__type">WIN</span><span class="pick-card__wager">$${bets.win.amount} to win</span></div><div class="pick-card__horse">${statusIcon} #${bets.win.horse} ${esc(bets.win.name)}</div></div>`;
        }

        if (bets.exacta) {
            const hitEx = result && result.exactaHit;
            const statusIcon = result ? (hitEx ? '✅' : '❌') : '⏳';
            const horseNames = bets.exacta.horses.map(n => { const h = race.horses.find(x=>x.number===n); return `#${n} ${h?h.name:''}`; }).join(' / ');
            const payNote = hitEx && result.exactaPay ? ` — Paid ${fmt(result.exactaPay)}` : '';
            html += `<div class="pick-card"><div class="pick-card__header"><span class="pick-card__type">EXACTA BOX</span><span class="pick-card__wager">$${bets.exacta.amount}</span></div><div class="pick-card__horse">${statusIcon} ${horseNames}${payNote}</div></div>`;
        }

        if (bets.trifecta) {
            const hitTri = result && result.trifectaHit;
            const statusIcon = result ? (hitTri ? '✅' : '❌') : '⏳';
            const horseNames = bets.trifecta.horses.map(n => { const h = race.horses.find(x=>x.number===n); return `#${n} ${h?h.name:''}`; }).join(' / ');
            html += `<div class="pick-card"><div class="pick-card__header"><span class="pick-card__type">TRIFECTA BOX</span><span class="pick-card__wager">$${bets.trifecta.amount}</span></div><div class="pick-card__horse">${statusIcon} ${horseNames}</div></div>`;
        }

        if (result) {
            const profit = result.collected - bets.totalWagered;
            html += `<div style="margin-top:1rem;padding:0.75rem;background:var(--bg-elevated);border-radius:var(--radius);font-family:var(--font-mono);font-size:0.8rem;display:flex;gap:2rem"><span>Wagered: ${fmt(bets.totalWagered)}</span><span>Collected: ${fmt(result.collected)}</span><span style="color:${profit>=0?'var(--success)':'var(--danger)'};font-weight:700">${profit>=0?'+':''}${fmt(profit)}</span></div>`;
        } else {
            html += `<div style="margin-top:1rem;padding:0.75rem;background:var(--bg-elevated);border-radius:var(--radius);font-family:var(--font-mono);font-size:0.8rem"><span>Wagered: ${fmt(bets.totalWagered)} — Result pending</span></div>`;
        }

        html += '</div>';
        return html;
    }

    function renderSignalsTab(race, raceIdx, picks) {
        let html = '';
        html += `<div style="margin-bottom:1.5rem"><h3 style="font-family:var(--font-display);font-size:1.1rem;color:var(--text-cream);margin-bottom:0.75rem">Signal Definitions</h3>`;
        html += `<table class="signal-ref-table"><thead><tr><th>ID</th><th>Signal</th><th>Wt</th><th>Trigger</th></tr></thead><tbody>`;
        state.signals.forEach(sig => {
            html += `<tr><td><span class="signal-ref-table__id">${esc(sig.id)}</span></td><td style="font-weight:600;color:var(--text-cream)">${esc(sig.name)}</td><td class="signal-ref-table__weight">+${sig.weight}</td><td style="font-size:0.65rem;color:var(--text-body);opacity:0.7">${esc(sig.description)}</td></tr>`;
        });
        html += '</tbody></table></div>';

        if (picks && picks.scores) {
            html += renderScoring(picks.scores, race);
        }
        return html;
    }

    function renderScoring(scores, race) {
        const sorted = [...scores].sort((a,b) => b.total - a.total);
        let html = `<div class="scoring-output"><h3 class="scoring-output__title">Full Field Signal Scoring</h3><table class="scoring-table"><thead><tr><th>#</th><th>Horse</th><th>Odds</th><th>Jockey / Trainer</th><th style="text-align:center">Score</th><th>Signals</th></tr></thead><tbody>`;
        sorted.forEach(s => {
            const horse = race.horses.find(h => h.number === s.num);
            const cls = s.total >= 5 ? 'scoring-table__score--high' : s.total >= 3 ? 'scoring-table__score--med' : 'scoring-table__score--low';
            const rowCls = s.total >= 3 ? 'scoring-table__row--pick' : '';
            const boloLabels = s.hits.map(sig => {
                const clean = sig.replace(/\(.*/, '');
                const sigDef = state.signals.find(sd => sd.id === clean);
                return sigDef ? sigDef.name : clean;
            });
            html += `<tr class="${rowCls}">
                <td class="horse-table__num">${s.num}</td>
                <td><strong style="color:var(--text-cream)">${esc(s.name)}</strong></td>
                <td class="horse-table__ml">${esc(s.ml)}</td>
                <td style="font-size:0.65rem;color:var(--text-body);opacity:0.7">${horse ? esc(horse.jockey) + ' / ' + esc(horse.trainer) : ''}</td>
                <td class="scoring-table__score ${cls}" style="text-align:center">${s.total}</td>
                <td class="scoring-table__signals">${boloLabels.join(', ') || '—'}</td>
            </tr>`;
        });
        return html + '</tbody></table></div>';
    }

    // --- DAILY RECAP ---
    function renderRecap() {
        document.getElementById('race-nav').innerHTML = '';
        const main = document.getElementById('main-content');

        let totalWagered = 0, totalCollected = 0, wins = 0, losses = 0;
        const settledRaces = Object.keys(RESULTS).map(Number).sort((a,b) => a-b);
        const pendingRaces = Object.keys(ACTUAL_BETS).map(Number).filter(r => !RESULTS[r]).sort((a,b) => a-b);

        settledRaces.forEach(r => {
            if (!ACTUAL_BETS[r]) return;
            totalWagered += ACTUAL_BETS[r].totalWagered;
            totalCollected += RESULTS[r].collected;
            if (RESULTS[r].collected > ACTUAL_BETS[r].totalWagered) wins++; else losses++;
        });
        const todayPL = totalCollected - totalWagered;
        const pendingWagered = pendingRaces.reduce((sum, r) => sum + ACTUAL_BETS[r].totalWagered, 0);

        let html = '<div class="history-page">';

        html += `<div class="history-lifetime" style="border-color:${todayPL>=0?'var(--success)':'var(--danger)'}">
            <h3>Daily Recap — Churchill Downs 5/31</h3>
            <div class="history-lifetime__stats" style="margin-bottom:1rem">
                <span>Wagered: ${fmt(totalWagered)}</span>
                <span>Collected: <strong style="color:${todayPL>=0?'var(--success)':'var(--danger)'}">${fmt(totalCollected)}</strong></span>
                <span>P/L: <strong style="color:${todayPL>=0?'var(--success)':'var(--danger)'}">${todayPL>=0?'+':''}${fmt(todayPL)}</strong></span>
                <span>Record: ${wins}W-${losses}L</span>
                <span>ROI: ${totalWagered>0?((todayPL/totalWagered)*100).toFixed(1):'0'}%</span>
            </div>
            ${pendingRaces.length ? `<div style="font-size:0.75rem;color:var(--accent-amber);font-family:var(--font-mono)">⏳ ${pendingRaces.length} races pending (${fmt(pendingWagered)} in play): R${pendingRaces.join(', R')}</div>` : ''}
            ${!settledRaces.length && !pendingRaces.length ? '<div style="font-size:0.85rem;color:var(--text-body);opacity:0.6;margin-top:0.5rem">No bets placed yet today. Let\'s get after it.</div>' : ''}
        </div>`;

        if (settledRaces.length) {
            html += '<h2 style="margin-bottom:1rem">Settled Races</h2>';
            html += `<table class="field-table" style="margin-bottom:2rem"><thead><tr><th>Race</th><th>Win Bet</th><th>Exacta</th><th>Trifecta</th><th>Wagered</th><th>Collected</th><th>P/L</th></tr></thead><tbody>`;
            settledRaces.forEach(rNum => {
                const bet = ACTUAL_BETS[rNum];
                if (!bet) return;
                const res = RESULTS[rNum];
                const profit = res.collected - bet.totalWagered;
                const race = RACES.find(r => r.number === rNum);
                const winHorse = race ? race.horses.find(h => h.number === bet.win.horse) : null;
                html += `<tr>
                    <td class="field-table__num">R${rNum}</td>
                    <td>${res.winHit?'✅':'❌'} #${bet.win.horse} ${winHorse?esc(winHorse.name):''}</td>
                    <td>${res.exactaHit?'✅':'❌'} ${bet.exacta.horses.join('/')}</td>
                    <td>${bet.trifecta ? (res.trifectaHit?'✅':'❌')+' '+bet.trifecta.horses.join('/') : '—'}</td>
                    <td style="font-family:var(--font-mono)">${fmt(bet.totalWagered)}</td>
                    <td style="font-family:var(--font-mono)">${fmt(res.collected)}</td>
                    <td style="font-family:var(--font-mono);color:${profit>=0?'var(--success)':'var(--danger)'};font-weight:700">${profit>=0?'+':''}${fmt(profit)}</td>
                </tr>`;
            });
            html += '</tbody></table>';
        }

        // Lifetime context
        html += `<div style="margin-top:2rem;padding:1rem;background:var(--bg-surface);border:1px solid var(--border-brown);border-radius:var(--radius-lg)">
            <h4 style="font-family:var(--font-display);color:var(--text-cream);margin-bottom:0.5rem">Lifetime Context</h4>
            <div style="font-family:var(--font-mono);font-size:0.8rem;display:flex;gap:2rem;flex-wrap:wrap">
                <span>Starting bankroll: ${fmt(LIFETIME_STARTING_BANKROLL)}</span>
                <span>Prior sessions: ${LIFETIME_PRIOR_PL>=0?'+':''}${fmt(LIFETIME_PRIOR_PL)}</span>
                <span>Today: ${todayPL>=0?'+':''}${fmt(todayPL)}</span>
                <span>Current bankroll: <strong style="color:${(LIFETIME_PRIOR_PL+todayPL)>=0?'var(--success)':'var(--danger)'}">${fmt(LIFETIME_STARTING_BANKROLL + LIFETIME_PRIOR_PL + todayPL)}</strong></span>
            </div>
        </div>`;

        html += '</div>';
        html += renderFooterGallery();
        main.innerHTML = html;
        startQuoteRotation();
    }

    // --- STRATEGY VIEW ---
    let strategyTab = 'bets';

    function renderStrategy() {
        document.getElementById('race-nav').innerHTML = '';
        const main = document.getElementById('main-content');
        let html = '<div class="strategy-page">';
        html += `<div class="strategy-page__header"><h2>Strategy Library</h2></div>`;

        // Tab nav
        html += `<nav class="strategy-tabs">
            <button class="strategy-tabs__btn ${strategyTab==='bets'?'strategy-tabs__btn--active':''}" onclick="MM.stratTab('bets')">Bet Structure</button>
            <button class="strategy-tabs__btn ${strategyTab==='rules'?'strategy-tabs__btn--active':''}" onclick="MM.stratTab('rules')">Rules (Hard Gates)</button>
            <button class="strategy-tabs__btn ${strategyTab==='bolos'?'strategy-tabs__btn--active':''}" onclick="MM.stratTab('bolos')">BOLOs (Scoring Signals)</button>
        </nav>`;

        if (strategyTab === 'bets') {
            html += `<div class="bet-structure">
                <div class="bet-structure__banner" style="background:rgba(107,74,43,0.15);border:1px dashed var(--accent-amber);border-radius:8px;padding:0.75rem 1rem;margin-bottom:1.5rem;display:flex;align-items:center;gap:0.5rem">
                    <span style="font-size:1.2rem">&#9888;</span>
                    <span style="font-size:0.75rem;color:var(--accent-amber);font-weight:600">RECOMMENDED — NOT YET LIVE IN PROMPT. Implement tomorrow.</span>
                </div>
                <h3 style="margin-bottom:1rem;color:var(--text-heading)">Recommended Bet Structure (v2)</h3>
                <p style="font-size:0.8rem;color:var(--text-body);margin-bottom:1.5rem;line-height:1.5">Based on 5/31 analysis: 10 races, $1,040 wagered, $392.98 collected. The model finds the right horses (3/10 tri hits, 2/10 exacta hits, 1/10 win) but sizing and structure leave money on the table.</p>

                <div class="signal-grid">
                    <div class="signal-card signal-card--active" style="border-color:var(--success)">
                        <div class="signal-card__top"><span class="signal-card__id">CURRENT</span></div>
                        <div class="signal-card__name">Today's Structure ($104/race)</div>
                        <div class="signal-card__desc" style="line-height:1.8">
                            <strong>Win:</strong> $50 (never the fav, 7/2+)<br>
                            <strong>Exacta Box:</strong> $30 → 3 horses, $5/combo (6 combos)<br>
                            <strong>Trifecta Box:</strong> $24 → 4 horses, $1/combo (24 combos)
                        </div>
                    </div>

                    <div class="signal-card signal-card--active" style="border-color:var(--accent-amber)">
                        <div class="signal-card__top"><span class="signal-card__id">NEW</span></div>
                        <div class="signal-card__name">Updated Structure ($90/race)</div>
                        <div class="signal-card__desc" style="line-height:1.8">
                            <strong>Win:</strong> $10 (lottery ticket — sized accordingly)<br>
                            <strong>Exacta Box:</strong> $50 → 3-4 horses, $8/combo (heavier unit)<br>
                            <strong>Trifecta:</strong> $30 → partial wheels or keyed (not full box)
                        </div>
                    </div>
                </div>

                <h3 style="margin-top:2rem;margin-bottom:1rem;color:var(--text-heading)">Why Change</h3>
                <div class="signal-grid">
                    <div class="signal-card signal-card--active" style="border-color:var(--border-brown)">
                        <div class="signal-card__top"><span class="signal-card__id">1</span></div>
                        <div class="signal-card__name">Win bet is structurally expensive</div>
                        <div class="signal-card__desc">$50/race (48% of budget) on a bet designed to lose most of the time. It's a home run swing getting everyday money. Reduce to $20-30 and reallocate to exotics.</div>
                    </div>
                    <div class="signal-card signal-card--active" style="border-color:var(--border-brown)">
                        <div class="signal-card__top"><span class="signal-card__id">2</span></div>
                        <div class="signal-card__name">Trifecta hits pay nothing on chalk</div>
                        <div class="signal-card__desc">3/10 tri hits but payouts were $63.98, $14.12, $12.48. Two of three didn't even cover the $24 wager when we WON. Full box at $1/combo is too thin when favorites fill the top spots.</div>
                    </div>
                    <div class="signal-card signal-card--active" style="border-color:var(--border-brown)">
                        <div class="signal-card__top"><span class="signal-card__id">3</span></div>
                        <div class="signal-card__name">Exacta is our best value bet</div>
                        <div class="signal-card__desc">2/10 hit rate with meaningful payoffs ($85.65, $43.75). Both covered the $30 cost easily. Heavier unit per combo = bigger returns when we connect. Consider adding a 4th horse or increasing unit size.</div>
                    </div>
                    <div class="signal-card signal-card--active" style="border-color:var(--border-brown)">
                        <div class="signal-card__top"><span class="signal-card__id">4</span></div>
                        <div class="signal-card__name">Trifecta: key or partial wheel</div>
                        <div class="signal-card__desc">Instead of full box (24 combos at $1), key our top pick on top with 4-5 underneath ($2-3/combo, fewer tickets, bigger payout). Or partial wheel: key 2 horses in top 2 spots with 4-5 in 3rd.</div>
                    </div>
                </div>
            </div>`;
        } else if (strategyTab === 'rules') {
            html += '<div class="signal-grid">';
            RULES.forEach((rule, idx) => {
                const disabledCls = rule.active ? '' : 'signal-card--disabled';
                html += `<div class="signal-card signal-card--active ${disabledCls}" style="border-color:${rule.active?'var(--danger)':'var(--border-brown)'}">
                    <div class="signal-card__top"><span class="signal-card__id">${esc(rule.id)}</span></div>
                    <div class="signal-card__name">${esc(rule.name)}</div>
                    <div class="signal-card__desc">${esc(rule.description)}</div>
                    <div class="signal-card__toggle">
                        <div class="signal-card__switch ${rule.active?'signal-card__switch--on':''}" onclick="MM.toggleRule(${idx})"><div class="signal-card__switch-knob"></div></div>
                        <label>${rule.active?'Active':'Off'}</label>
                    </div>
                </div>`;
            });
            html += '</div>';
        } else {
            html += '<div class="signal-grid">';
            state.signals.forEach((sig, idx) => {
                const disabledCls = sig.active ? '' : 'signal-card--disabled';
                const statusColor = sig.dataStatus === 'green' ? 'var(--success)' : sig.dataStatus === 'yellow' ? 'var(--accent-amber)' : 'var(--danger)';
                const statusLabel = sig.dataStatus === 'green' ? 'Executable' : sig.dataStatus === 'yellow' ? 'Needs Input' : 'Not Available';
                html += `<div class="signal-card signal-card--active ${disabledCls}">
                    <div class="signal-card__top"><span class="signal-card__id">${esc(sig.id)}</span><div class="signal-card__weight"><span class="signal-card__weight-val">+${sig.weight}</span></div></div>
                    <div class="signal-card__name">${esc(sig.name)}</div>
                    <div style="display:flex;align-items:center;gap:0.4rem;margin:0.4rem 0">
                        <span style="width:8px;height:8px;border-radius:50%;background:${statusColor};display:inline-block"></span>
                        <span style="font-size:0.6rem;color:${statusColor};font-weight:600">${statusLabel}</span>
                    </div>
                    <div class="signal-card__desc">${esc(sig.description)}</div>
                    ${sig.detection ? `<details style="margin-top:0.5rem;border-top:1px solid rgba(107,74,43,0.3);padding-top:0.5rem">
                        <summary style="font-size:0.6rem;color:var(--accent-amber);cursor:pointer;font-weight:600">Detection Instruction</summary>
                        <div style="font-size:0.6rem;color:var(--text-body);margin-top:0.4rem;line-height:1.5;opacity:0.85">${esc(sig.detection)}</div>
                    </details>` : ''}
                    ${sig.dataNote ? `<div style="font-size:0.55rem;color:${statusColor};margin-top:0.3rem;opacity:0.7">${esc(sig.dataNote)}</div>` : ''}
                    <div class="signal-card__toggle">
                        <div class="signal-card__switch ${sig.active?'signal-card__switch--on':''}" onclick="MM.toggleSignal(${idx})"><div class="signal-card__switch-knob"></div></div>
                        <label>${sig.active?'Active':'Off'}</label>
                    </div>
                    ${sig.active ? `<div class="signal-card__slider">
                        <label style="font-size:0.65rem;color:var(--text-body);opacity:0.7">Weight:</label>
                        <input type="range" min="1" max="5" value="${sig.weight}" oninput="MM.setWeight(${idx}, this.value)">
                        <span class="signal-card__slider-val">+${sig.weight}</span>
                    </div>` : ''}
                </div>`;
            });
            html += '</div>';
        }

        html += '</div>';
        html += renderFooterGallery();
        main.innerHTML = html;
        startQuoteRotation();
    }

    // --- TO DO VIEW ---
    function renderTodo() {
        document.getElementById('race-nav').innerHTML = '';
        const main = document.getElementById('main-content');
        const todos = [
            { id: 1, title: 'Better data sourcing', desc: 'Figure out where and how to get richer data (live odds, full running lines, same-day results) so we can execute on more strategies. B2/B3/B5/B8 are dead because the model lacks live data.', status: 'open', priority: 'high' },
            { id: 2, title: 'Signal fire rate vs hit rate database', desc: 'Build a database (SQLite or Postgres) tracking every signal fire: race, conditions, horse, odds, result. Calculate fire rate and hit rate per signal over time. This is the core feedback loop — identify what hits, tune weights, prune what doesn\'t. Eventually becomes a portable MCP library of executable strategies.', status: 'open', priority: 'high' },
            { id: 3, title: 'Implement new bet structure in prompt', desc: 'Update the AI prompt to use: Win $10 (down from $50), Exacta $50 heavier unit, Trifecta $30 via partial wheels/keys. Currently on the Strategy page as "recommended" — needs to go live in the prompt.', status: 'open', priority: 'medium' },
            { id: 4, title: 'Add new signal: Blinkers + Elite Jockey', desc: 'Combo signal: equipment change (blinkers on/off) + top-5 jockey at any odds. R8 winner McCann had this exact combo at 6/1 — model flagged both individually but no combo signal existed. Weight TBD.', status: 'done', priority: 'medium' },
            { id: 5, title: 'Add new signal: Highest Speed Rating at a price', desc: 'DRF tags "Highest Speed Rating" separately from Beyer. When that horse is 8/1+, it\'s a value angle. R10 winner Culture War was exactly this at 12/1. Weight TBD.', status: 'done', priority: 'medium' },
            { id: 6, title: 'Audit dead signals (B2/B3/B5/B8)', desc: 'These 4 signals never fired in 10 races. Either feed them live data or replace with executable alternatives. Related to #1 (data sourcing).', status: 'open', priority: 'medium' },
        ];

        let html = '<div class="strategy-page">';
        html += '<div class="strategy-page__header"><h2>Project To Do</h2><p style="font-size:0.75rem;color:var(--text-body);margin-top:0.25rem">Money Machine build backlog</p></div>';

        const open = todos.filter(t => t.status === 'open');
        const done = todos.filter(t => t.status === 'done');

        html += '<h3 style="margin:1.5rem 0 1rem;color:var(--text-heading)">Open</h3>';
        html += '<div class="signal-grid">';
        open.forEach(t => {
            const prioColor = t.priority === 'high' ? 'var(--danger)' : 'var(--accent-amber)';
            html += `<div class="signal-card signal-card--active" style="border-color:${prioColor}">
                <div class="signal-card__top"><span class="signal-card__id">#${t.id}</span><span style="font-size:0.6rem;color:${prioColor};font-weight:700;text-transform:uppercase">${t.priority}</span></div>
                <div class="signal-card__name">${esc(t.title)}</div>
                <div class="signal-card__desc">${esc(t.desc)}</div>
            </div>`;
        });
        html += '</div>';

        if (done.length) {
            html += '<h3 style="margin:2rem 0 1rem;color:var(--text-heading);opacity:0.6">Done</h3>';
            html += '<div class="signal-grid">';
            done.forEach(t => {
                html += `<div class="signal-card" style="border-color:var(--success);opacity:0.6">
                    <div class="signal-card__top"><span class="signal-card__id">#${t.id}</span><span style="font-size:0.6rem;color:var(--success);font-weight:700">DONE</span></div>
                    <div class="signal-card__name" style="text-decoration:line-through">${esc(t.title)}</div>
                    <div class="signal-card__desc">${esc(t.desc)}</div>
                </div>`;
            });
            html += '</div>';
        }

        html += '</div>';
        html += renderFooterGallery();
        main.innerHTML = html;
        startQuoteRotation();
    }

    // --- HISTORY VIEW ---
    function renderHistory() {
        document.getElementById('race-nav').innerHTML = '';
        const main = document.getElementById('main-content');
        const todayPL = Object.keys(RESULTS).reduce((sum, r) => ACTUAL_BETS[r] ? sum + RESULTS[r].collected - ACTUAL_BETS[r].totalWagered : sum, 0);
        const lifetimePL = LIFETIME_PRIOR_PL + todayPL;
        const lifetime = LIFETIME_STARTING_BANKROLL + lifetimePL;

        let html = '<div class="history-page">';
        html += `<div class="history-lifetime"><h3>Lifetime Bankroll</h3><div class="history-lifetime__stats"><span>Started: ${fmt(LIFETIME_STARTING_BANKROLL)}</span><span>Current: <strong style="color:${lifetimePL>=0?'var(--success)':'var(--danger)'}">${fmt(lifetime)}</strong></span><span>All-time P/L: ${lifetimePL>=0?'+':''}${fmt(lifetimePL)}</span></div></div>`;
        html += '<h2>Session History</h2>';
        HISTORY.forEach(session => {
            html += `<div class="history-card"><div class="history-card__header"><span class="history-card__date">${session.date} — ${session.track}</span><span class="history-card__track">${session.racesRange} (${session.races} races)</span></div>`;
            html += `<div class="history-card__stats"><span><span class="history-card__stat-label">Record:</span><span class="history-card__stat-value">${session.record}</span></span><span><span class="history-card__stat-label">Wagered:</span><span class="history-card__stat-value">${fmt(session.wagered)}</span></span><span><span class="history-card__stat-label">Collected:</span><span class="history-card__stat-value">${fmt(session.collected)}</span></span><span><span class="history-card__stat-label">P/L:</span><span class="history-card__stat-value" style="color:${session.pl>=0?'var(--success)':'var(--danger)'}">${session.pl>=0?'+':''}${fmt(session.pl)} (${session.roi}%)</span></span></div>`;
            if (session.highlights && session.highlights.length) { html += '<ul class="history-card__highlights">'; session.highlights.forEach(h => html += `<li>${esc(h)}</li>`); html += '</ul>'; }
            if (session.lessons && session.lessons.length) { html += '<ul class="history-card__lessons" style="margin-top:0.4rem">'; session.lessons.forEach(l => html += `<li>${esc(l)}</li>`); html += '</ul>'; }
            html += '</div>';
        });
        html += '</div>';
        html += renderFooterGallery();
        main.innerHTML = html;
        startQuoteRotation();
    }

    // --- FOOTER GALLERY ---
    function renderFooterGallery() {
        const q = QUOTES[quoteIdx];
        return `<div class="footer-gallery">
            <div class="footer-gallery__header">
                <p>In Memoriam</p>
                <h3>Pie-O-My</h3>
            </div>
            <div class="quotes-carousel" id="quotes-carousel">
                <div>
                    <p class="quotes-carousel__text" id="quote-text">"${esc(q.text)}"</p>
                    <p class="quotes-carousel__attr" id="quote-attr">${esc(q.attr)}</p>
                    <p class="quotes-carousel__ctx" id="quote-ctx">${esc(q.ctx)}</p>
                    <div class="quotes-carousel__controls">
                        <button onclick="MM.prevQuote()">‹</button>
                        <div class="quotes-carousel__dots">${QUOTES.map((_,i) => `<button class="quotes-carousel__dot ${i===quoteIdx?'quotes-carousel__dot--active':''}" onclick="MM.goQuote(${i})"></button>`).join('')}</div>
                        <button onclick="MM.nextQuote()">›</button>
                    </div>
                </div>
            </div>
            <div class="gallery-photos">
                <div class="polaroid" style="width:160px;transform:rotate(-8deg);margin-top:14px">
                    <div class="polaroid__inner" style="aspect-ratio:4/5"><img src="t.jpg" alt=""><div class="polaroid__overlay"></div><div class="polaroid__vignette"></div></div>
                </div>
                <div class="polaroid" style="width:220px;transform:rotate(6deg);margin-top:32px">
                    <div class="polaroid__inner" style="aspect-ratio:16/10"><img src="t2.jpg" alt=""><div class="polaroid__overlay"></div><div class="polaroid__vignette"></div></div>
                </div>
                <div class="polaroid" style="width:190px;transform:rotate(-3deg);margin-top:-6px">
                    <div class="polaroid__inner" style="aspect-ratio:4/5"><img src="t3.jpg" alt=""><div class="polaroid__overlay"></div><div class="polaroid__vignette"></div></div>
                </div>
            </div>
        </div>`;
    }

    function startQuoteRotation() {
        if (quoteInterval) clearInterval(quoteInterval);
        quoteInterval = setInterval(() => {
            quoteIdx = (quoteIdx + 1) % QUOTES.length;
            updateQuoteDisplay();
        }, 9000);
    }

    function updateQuoteDisplay() {
        const q = QUOTES[quoteIdx];
        const textEl = document.getElementById('quote-text');
        const attrEl = document.getElementById('quote-attr');
        const ctxEl = document.getElementById('quote-ctx');
        if (textEl) {
            textEl.style.opacity = '0';
            setTimeout(() => {
                textEl.textContent = `"${q.text}"`;
                attrEl.textContent = q.attr;
                ctxEl.textContent = q.ctx;
                textEl.style.opacity = '1';
                document.querySelectorAll('.quotes-carousel__dot').forEach((dot, i) => {
                    dot.classList.toggle('quotes-carousel__dot--active', i === quoteIdx);
                });
            }, 300);
        }
    }

    // --- SIGNAL SCORING ---
    function executeForRace(raceIdx) {
        const race = RACES[raceIdx];
        const scratches = race.scratches || [];
        const liveHorses = race.horses.filter(h => !scratches.includes(h.number));

        const beyers = liveHorses.map(h => ({ num: h.number, beyer: extractBeyer(h.notes) })).filter(b => b.beyer > 0);
        const bestBeyer = beyers.length ? beyers.reduce((a,b) => a.beyer > b.beyer ? a : b) : null;
        const earnings = liveHorses.map(h => ({ num: h.number, earn: extractEarnings(h.notes) })).filter(e => e.earn > 0);
        const topEarner = earnings.length ? earnings.reduce((a,b) => a.earn > b.earn ? a : b) : null;

        const s1 = state.signals.find(s => s.id === 'B1');
        const s4 = state.signals.find(s => s.id === 'B4');
        const s6 = state.signals.find(s => s.id === 'B6');
        const s7 = state.signals.find(s => s.id === 'B7');
        const s9 = state.signals.find(s => s.id === 'B9');
        const s10 = state.signals.find(s => s.id === 'B10');
        const s11 = state.signals.find(s => s.id === 'B11');
        const s12 = state.signals.find(s => s.id === 'B12');
        const s13 = state.signals.find(s => s.id === 'B13');

        const topJockeys = ['ortiz j', 'ortiz jr', 'prat f', 'gaffalione', 'saez l', 'saez g'];
        const topTrainers = ['cox', 'baffert', 'asmussen', 'walsh', 'walden', 'mcpeek', 'eurton', 'sharp joe', 'maker', 'pletcher', 'jacobson', 'mccarthy'];

        const scores = liveHorses.map(h => {
            let total = 0; const hits = [];
            const notes = (h.notes || '').toLowerCase();
            const odds = parseOdds(h.ml);

            if (s1 && s1.active && odds >= 12) {
                const jl = h.jockey.toLowerCase();
                if (topJockeys.some(j => jl.includes(j))) { total += s1.weight; hits.push(`B1(+${s1.weight})`); }
            }

            if (s4 && s4.active && odds >= 6) {
                if (notes.includes('16%') || notes.includes('30%') || notes.includes('hot trainer')) {
                    total += s4.weight; hits.push(`B4(+${s4.weight})`);
                }
            }

            if (s6 && s6.active && bestBeyer && bestBeyer.num === h.number) {
                total += s6.weight; hits.push(`B6(+${s6.weight})`);
            }

            if (s7 && s7.active) {
                if (notes.includes('first time blinkers') || notes.includes('blinkers on')) {
                    total += s7.weight; hits.push(`B7(+${s7.weight})`);
                }
            }

            if (s9 && s9.active && topEarner && topEarner.num === h.number) {
                total += s9.weight; hits.push(`B9(+${s9.weight})`);
            }

            if (s10 && s10.active) {
                const isFTS = notes.includes('fts') || notes.includes('first time starter');
                const expensivePedigree = notes.match(/\$([12]\d{2}|[3-9]\d{2}|\d{3,})k/i) || notes.match(/\$[1-9]\d*m/i) || notes.includes('$200k') || notes.includes('$250k') || notes.includes('$125k') || notes.includes('$100k') || notes.includes('$110k') || notes.includes('$75k');
                if (isFTS && expensivePedigree) { total += s10.weight; hits.push(`B10(+${s10.weight})`); }
            }

            if (s11 && s11.active && odds >= 8) {
                const jl = h.jockey.toLowerCase();
                const tl = h.trainer.toLowerCase();
                if (topJockeys.some(j => jl.includes(j)) && topTrainers.some(t => tl.includes(t))) {
                    total += s11.weight; hits.push(`B11(+${s11.weight})`);
                }
            }

            if (s12 && s12.active) {
                const hasBlinkers = notes.includes('first time blinkers') || notes.includes('blinkers on') || notes.includes('blinkers off');
                const jl = h.jockey.toLowerCase();
                if (hasBlinkers && topJockeys.some(j => jl.includes(j))) {
                    total += s12.weight; hits.push(`B12(+${s12.weight})`);
                }
            }

            if (s13 && s13.active && odds >= 8) {
                if (notes.includes('highest speed rating')) {
                    total += s13.weight; hits.push(`B13(+${s13.weight})`);
                }
            }

            return { num: h.number, name: h.name, ml: h.ml, total, hits };
        });
        scores.sort((a,b) => b.total - a.total);

        state.picks[raceIdx] = { scores };
    }

    function extractBeyer(notes) {
        if (!notes) return 0;
        const m = notes.match(/beyer\s*(\d+)/i);
        return m ? parseInt(m[1]) : 0;
    }

    function extractEarnings(notes) {
        if (!notes) return 0;
        const m = notes.match(/\$([0-9,.]+[KkMm]?)\s*(earner|earnings|leader)/i) || notes.match(/\$([0-9,.]+[KkMm]?)\./);
        if (!m) return 0;
        let val = m[1].replace(/,/g, '');
        if (val.match(/[Kk]$/)) return parseFloat(val) * 1000;
        if (val.match(/[Mm]$/)) return parseFloat(val) * 1000000;
        return parseFloat(val) || 0;
    }

    function parseOdds(ml) { if (!ml) return 99; const s = String(ml).replace(/[^0-9/.-]/g,''); if (s.includes('/')) { const p = s.split('/'); return parseFloat(p[0])/parseFloat(p[1]); } return parseFloat(s)||99; }

    // --- PUBLIC API ---
    window.MM = {
        switchRace(i) { state.activeRace = i; state.activeRaceTab = 'field'; window.location.hash = 'R' + RACES[i].number; render(); },
        stratTab(tab) { strategyTab = tab; render(); },
        toggleRule(idx) { RULES[idx].active = !RULES[idx].active; saveState(); render(); },
        toggleSignal(idx) { state.signals[idx].active = !state.signals[idx].active; for (let i = 0; i < RACES.length; i++) executeForRace(i); saveState(); render(); },
        setWeight(idx, val) { state.signals[idx].weight = parseInt(val); for (let i = 0; i < RACES.length; i++) executeForRace(i); saveState(); render(); },
        setLiveOdds(raceIdx, horseNum, val) {
            if (!state.liveOdds[raceIdx]) state.liveOdds[raceIdx] = {};
            state.liveOdds[raceIdx][horseNum] = val;
            executeForRace(raceIdx);
            saveState();
        },
        toggleScratch(raceIdx, horseNum) {
            const race = RACES[raceIdx];
            if (!race.scratches) race.scratches = [];
            const idx = race.scratches.indexOf(horseNum);
            if (idx >= 0) race.scratches.splice(idx, 1);
            else race.scratches.push(horseNum);
            executeForRace(raceIdx);
            saveState();
            render();
        },
        showAnalysis(raceIdx) {
            state.activeRace = raceIdx;
            state.activeRaceTab = 'signals';
            render();
        },
        switchRun(raceIdx, runIdx) {
            state.activeRunIdx[raceIdx] = runIdx;
            const runs = state.savedRuns[raceIdx] || [];
            if (runs[runIdx]) {
                state.recommendations[raceIdx] = runs[runIdx].result;
                if (!state.lastPrompt) state.lastPrompt = {};
                state.lastPrompt[raceIdx] = runs[runIdx].prompt;
            }
            render();
        },
        executeAnalysis(raceIdx) {
            const race = RACES[raceIdx];
            const liveOddsForRace = state.liveOdds[raceIdx] || {};

            // Show loading state
            state.recommendations[raceIdx] = { loading: true };
            render();

            const payload = {
                race: race,
                signals: state.signals,
                rules: RULES,
                liveOdds: liveOddsForRace
            };

            // Store the prompt payload for inspection
            state.lastPrompt = state.lastPrompt || {};
            state.lastPrompt[raceIdx] = payload;

            fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(r => r.json())
            .then(data => {
                if (data.error) {
                    state.recommendations[raceIdx] = { error: data.error, raw: data.raw || '' };
                } else {
                    const winHorse = race.horses.find(h => h.number === data.win.horse);
                    const recs = {
                        win: { horse: data.win.horse, name: data.win.name || (winHorse ? winHorse.name : ''), odds: data.win.odds || '', reason: data.win.reason || '' },
                        exacta: { horses: data.exacta.horses },
                        trifecta: { horses: data.trifecta.horses },
                        notes: data.notes || '',
                        analysis: data.analysis || '',
                        signalBreakdown: data.signalBreakdown || []
                    };
                    state.recommendations[raceIdx] = recs;

                    // Save run to server with timestamp
                    const ts = new Date().toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit', hour12:true });
                    const run = { raceNumber: race.number, timestamp: ts, prompt: payload, result: recs };
                    fetch('/api/runs', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(run) }).catch(()=>{});

                    // Add to local savedRuns
                    if (!state.savedRuns[raceIdx]) state.savedRuns[raceIdx] = [];
                    state.savedRuns[raceIdx].unshift(run);
                    state.activeRunIdx[raceIdx] = 0;
                }
                saveState();
                render();
            })
            .catch(err => {
                state.recommendations[raceIdx] = { error: 'Network error: ' + err.message };
                render();
            });
        },
        nextQuote() { if (quoteInterval) clearInterval(quoteInterval); quoteIdx = (quoteIdx + 1) % QUOTES.length; updateQuoteDisplay(); },
        prevQuote() { if (quoteInterval) clearInterval(quoteInterval); quoteIdx = (quoteIdx - 1 + QUOTES.length) % QUOTES.length; updateQuoteDisplay(); },
        goQuote(i) { if (quoteInterval) clearInterval(quoteInterval); quoteIdx = i; updateQuoteDisplay(); }
    };

    // --- PERSIST STATE ---
    function saveState() {
        const payload = {
            rules: RULES.map(r => ({ id: r.id, name: r.name, active: r.active, description: r.description })),
            signals: state.signals.map(s => ({ id: s.id, name: s.name, weight: s.weight, active: s.active, description: s.description })),
            liveOdds: state.liveOdds,
            scratches: {},
            recommendations: state.recommendations
        };
        RACES.forEach((race, i) => {
            if (race.scratches && race.scratches.length) payload.scratches[race.number] = race.scratches;
        });
        fetch('/api/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {});
    }

    // --- LOAD SAVED RUNS ---
    function loadSavedRuns() {
        fetch('/api/runs').then(r => r.json()).then(runs => {
            runs.forEach(run => {
                const raceIdx = RACES.findIndex(r => r.number === run.raceNumber);
                if (raceIdx >= 0) {
                    if (!state.savedRuns[raceIdx]) state.savedRuns[raceIdx] = [];
                    state.savedRuns[raceIdx].push(run);
                    // Set the most recent as active recommendation
                    if (!state.recommendations[raceIdx] || !state.recommendations[raceIdx].win) {
                        state.recommendations[raceIdx] = run.result;
                        state.lastPrompt = state.lastPrompt || {};
                        state.lastPrompt[raceIdx] = run.prompt;
                    }
                }
            });
            if (!state.activeRunIdx) state.activeRunIdx = {};
            render();
        }).catch(() => {});
    }

    // --- INIT ---
    // Hash routing
    function readHash() {
        const hash = window.location.hash.replace('#', '');
        if (hash.match(/^R\d+$/)) {
            const rNum = parseInt(hash.substring(1));
            const idx = RACES.findIndex(r => r.number === rNum);
            if (idx >= 0) { state.activeRace = idx; state.activeView = 'races'; }
        }
    }
    window.addEventListener('hashchange', () => { readHash(); render(); });
    readHash();

    for (let i = 0; i < RACES.length; i++) { executeForRace(i); }
    loadSavedRuns();
    render();
})();
