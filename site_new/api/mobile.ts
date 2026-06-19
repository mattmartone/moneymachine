import { query } from './db.js';

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
    `SELECT b.race_id, b.bet_type, b.stake, b.doubled, b.entries_used,
            r.track, r.race_number, r.post_time
     FROM bets b JOIN races r ON r.id = b.race_id
     WHERE r.date = $1 ORDER BY r.post_time NULLS LAST, r.race_number`,
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

  // Build race status data for the client
  interface RaceStatus {
    race_number: number;
    track: string;
    status: 'upcoming' | 'pending' | 'finished';
    result?: { win_pp: number; win_horse: string; place_pp: number; place_horse: string; show_pp: number; show_horse: string; fourth_pp?: number; fourth_horse?: string; };
    hits?: { win: boolean; ex: boolean; tri: boolean; };
  }

  const raceStatuses: RaceStatus[] = [];
  const seen = new Set<number>();
  for (const bet of bets) {
    if (seen.has(bet.race_id)) continue;
    seen.add(bet.race_id);
    const result = results[bet.race_id];
    const raceBets = bets.filter((b: any) => b.race_id === bet.race_id);
    const winBet = raceBets.find((b: any) => b.bet_type === 'win');
    const exBet = raceBets.find((b: any) => b.bet_type === 'exacta');

    let status: 'upcoming' | 'pending' | 'finished' = 'upcoming';
    if (result) status = 'finished';
    else if (bet.post_time && bet.post_time.slice(0, 5) < currentTime) status = 'pending';

    const entry: RaceStatus = { race_number: bet.race_number, track: bet.track, status };
    if (result) {
      const winPickPP = winBet?.entries_used?.[0] ? parsePP(winBet.entries_used[0]) : '';
      const winPickName = winBet?.entries_used?.[0]?.replace(/^#\d+\s*/, '') || '';
      entry.result = {
        win_pp: result.win_pp, win_horse: result.win_horse,
        place_pp: result.place_pp, place_horse: result.place_horse,
        show_pp: result.show_pp, show_horse: result.show_horse,
        fourth_pp: result.fourth_pp, fourth_horse: result.fourth_horse,
      };
      const boxPPs = (exBet?.entries_used || []).map(parsePP);
      const wpp = String(result.win_pp), ppp = String(result.place_pp), spp = String(result.show_pp);
      const winHit = winPickPP === wpp;
      const exHit = boxPPs.includes(wpp) && boxPPs.includes(ppp);
      const triHit = exHit && boxPPs.includes(spp);
      entry.hits = { win: winHit, ex: exHit, tri: triHit };
      (entry as any).winPickPP = winPickPP;
      (entry as any).winPickName = winPickName;

      // Calculate payouts
      const triBet = raceBets.find((b: any) => b.bet_type === 'trifecta');
      const superBet = raceBets.find((b: any) => b.bet_type === 'superfecta');
      const fpp = result.fourth_pp ? String(result.fourth_pp) : null;
      const superHit = triHit && fpp && boxPPs.includes(fpp);
      let totalStake = raceBets.reduce((s: number, b: any) => s + b.stake, 0);
      let collected = 0;
      const n = boxPPs.length;

      if (winHit && result.win_payout) collected += (result.win_payout / 2) * (winBet?.stake || 25);
      if (exHit && result.exacta_payout) collected += result.exacta_payout * ((exBet?.stake || 50) / (n * (n - 1)));
      if (triHit && result.trifecta_payout) collected += result.trifecta_payout * ((triBet?.stake || 24) / (n * (n - 1) * (n - 2)));
      if (superHit && result.superfecta_payout) collected += result.superfecta_payout * ((superBet?.stake || 2.4) / (n * (n - 1) * (n - 2) * (n - 3)));

      (entry as any).payouts = {
        win: winHit && result.win_payout ? ((result.win_payout / 2) * (winBet?.stake || 25)).toFixed(2) : null,
        ex: exHit && result.exacta_payout ? (result.exacta_payout * ((exBet?.stake || 50) / (n * (n - 1)))).toFixed(2) : null,
        tri: triHit && result.trifecta_payout ? (result.trifecta_payout * ((triBet?.stake || 24) / (n * (n - 1) * (n - 2)))).toFixed(2) : null,
        super: superHit && result.superfecta_payout ? (result.superfecta_payout * ((superBet?.stake || 2.4) / (n * (n - 1) * (n - 2) * (n - 3)))).toFixed(2) : null,
        totalStake: totalStake.toFixed(2),
        collected: collected.toFixed(2),
        net: (collected - totalStake).toFixed(2),
      };
    }
    raceStatuses.push(entry);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.status(200).send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Race Day Dashboard</title>
    <script>window.__LIVE_DATA__ = ${JSON.stringify({ races: raceStatuses, updated: currentTime })};</script>
    <script type="module" crossorigin src="/mobile/assets/index-CqI2JM09.js"></script>
    <link rel="stylesheet" crossorigin href="/mobile/assets/index-S8yKncZX.css">
  </head>
  <body>
    <div id="root"></div>
    <style>
      .ftc-result-overlay { margin-top: 12px; padding: 12px; border-radius: 10px; font-family: Inter, sans-serif; font-size: 12px; }
      .ftc-result-overlay.hit { background: rgba(22,163,74,0.06); border: 1px solid rgba(22,163,74,0.25); }
      .ftc-result-overlay.miss { background: rgba(239,68,68,0.04); border: 1px solid rgba(239,68,68,0.15); }
      .ftc-result-overlay .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; color: #6b7280; margin-bottom: 8px; }
      .ftc-result-overlay .finish-order { font-weight: 600; color: #111827; margin-bottom: 10px; font-size: 13px; }
      .ftc-result-overlay table { width: 100%; border-collapse: collapse; font-size: 11px; }
      .ftc-result-overlay th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600; padding: 4px 0; border-bottom: 1px solid rgba(0,0,0,0.06); }
      .ftc-result-overlay td { padding: 5px 0; border-bottom: 1px solid rgba(0,0,0,0.04); }
      .ftc-result-overlay td.result-hit { color: #16a34a; font-weight: 700; }
      .ftc-result-overlay td.result-miss { color: #9ca3af; }
      .ftc-result-overlay .verdict { margin-top: 10px; font-weight: 700; font-size: 12px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.08); }
      .ftc-result-overlay .verdict.positive { color: #16a34a; }
      .ftc-result-overlay .verdict.negative { color: #ef4444; }
    </style>
    <script>
      function patchUI() {
        var data = window.__LIVE_DATA__;
        if (!data || !data.races) return;

        // Update the "last updated" time
        var allEls = document.querySelectorAll('span, div, p');
        allEls.forEach(function(el) {
          if (el.textContent && el.textContent.includes('Updated') && el.children.length === 0) {
            el.textContent = 'Updated ' + data.updated + ' ET (live)';
          }
        });

        // Find race cards by looking for the big race numbers
        var buttons = document.querySelectorAll('button');

        data.races.forEach(function(race) {
          if (race.status !== 'finished' || !race.result) return;

          buttons.forEach(function(btn) {
            // Find the race number element (big bold number)
            var numEl = btn.querySelector('[class*="text-3xl"]');
            if (!numEl) return;
            var num = parseInt(numEl.textContent);
            if (num !== race.race_number) return;

            // Check if already patched
            var cardEl = btn.parentElement;
            if (cardEl && cardEl.querySelector('.ftc-result-overlay')) return;
            if (btn.querySelector('.ftc-result-overlay')) return;

            // Change "Projected order" to "Finish"
            var spans = btn.querySelectorAll('span');
            spans.forEach(function(span) {
              if (span.textContent && span.textContent.trim() === 'Projected order') {
                span.textContent = 'Finish';
              }
            });

            // Build the result overlay
            var r = race.result;
            var h = race.hits;
            var anyHit = h && (h.win || h.ex || h.tri);

            var overlay = document.createElement('div');
            overlay.className = 'ftc-result-overlay ' + (anyHit ? 'hit' : 'miss');

            var finishHtml = '<div class="section-title">Race Result</div>';
            finishHtml += '<div class="finish-order">#' + r.win_pp + ' ' + r.win_horse + ' &mdash; #' + r.place_pp + ' ' + r.place_horse + ' &mdash; #' + r.show_pp + ' ' + r.show_horse + '</div>';

            var p = race.payouts || {};
            var betsHtml = '<table><tr><th>Bet</th><th>Result</th><th>Payout</th></tr>';
            betsHtml += '<tr><td>Win</td><td class="' + (h.win ? 'result-hit' : 'result-miss') + '">' + (h.win ? 'HIT \\u2713' : 'MISS') + '</td><td class="' + (h.win ? 'result-hit' : 'result-miss') + '">' + (p.win ? '$' + p.win : '—') + '</td></tr>';
            betsHtml += '<tr><td>Exacta</td><td class="' + (h.ex ? 'result-hit' : 'result-miss') + '">' + (h.ex ? 'HIT \\u2713' : 'MISS') + '</td><td class="' + (h.ex ? 'result-hit' : 'result-miss') + '">' + (p.ex ? '$' + p.ex : '—') + '</td></tr>';
            betsHtml += '<tr><td>Trifecta</td><td class="' + (h.tri ? 'result-hit' : 'result-miss') + '">' + (h.tri ? 'HIT \\u2713' : 'MISS') + '</td><td class="' + (h.tri ? 'result-hit' : 'result-miss') + '">' + (p.tri ? '$' + p.tri : '—') + '</td></tr>';
            betsHtml += '<tr><td>Superfecta</td><td class="' + (p.super ? 'result-hit' : 'result-miss') + '">' + (p.super ? 'HIT \\u2713' : 'MISS') + '</td><td class="' + (p.super ? 'result-hit' : 'result-miss') + '">' + (p.super ? '$' + p.super : '—') + '</td></tr>';
            betsHtml += '</table>';

            var netVal = parseFloat(p.net || '0');
            var verdictHtml = '<div class="verdict ' + (netVal >= 0 ? 'positive' : 'negative') + '">Wagered $' + (p.totalStake || '0') + ' &middot; Collected $' + (p.collected || '0') + ' &middot; Net: ' + (netVal >= 0 ? '+' : '') + '$' + (p.net || '0') + '</div>';

            overlay.innerHTML = finishHtml + betsHtml + verdictHtml;

            // Insert inside the race's expanded panel (the overflow-hidden div)
            // Walk up from button to find the card wrapper, then find its overflow-hidden child
            var card = btn.parentElement;
            var expandedPanel = null;
            // Try sibling of button first
            var sibling = btn.nextElementSibling;
            while (sibling) {
              if (sibling.className && sibling.className.indexOf('overflow') >= 0) {
                expandedPanel = sibling;
                break;
              }
              sibling = sibling.nextElementSibling;
            }
            // If not found, check parent's children
            if (!expandedPanel && card) {
              var children = card.children;
              for (var k = 0; k < children.length; k++) {
                if (children[k] !== btn && children[k].className && children[k].className.indexOf('overflow') >= 0) {
                  expandedPanel = children[k];
                  break;
                }
              }
            }
            if (expandedPanel) {
              // Append at the end of the expanded content
              var innerDiv = expandedPanel.firstElementChild || expandedPanel;
              innerDiv.appendChild(overlay);
            } else {
              // Last resort: right after the button
              btn.parentElement.appendChild(overlay);
            }
          });
        });
      }

      // Wait for React to mount then patch
      setTimeout(patchUI, 1000);
      setTimeout(patchUI, 2500);
      setTimeout(patchUI, 5000);
    </script>
  </body>
</html>`);
}
