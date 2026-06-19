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
      entry.result = {
        win_pp: result.win_pp, win_horse: result.win_horse,
        place_pp: result.place_pp, place_horse: result.place_horse,
        show_pp: result.show_pp, show_horse: result.show_horse,
        fourth_pp: result.fourth_pp, fourth_horse: result.fourth_horse,
      };
      const boxPPs = (exBet?.entries_used || []).map(parsePP);
      const wpp = String(result.win_pp), ppp = String(result.place_pp), spp = String(result.show_pp);
      const winPickPP = winBet?.entries_used?.[0] ? parsePP(winBet.entries_used[0]) : '';
      entry.hits = {
        win: winPickPP === wpp,
        ex: boxPPs.includes(wpp) && boxPPs.includes(ppp),
        tri: boxPPs.includes(wpp) && boxPPs.includes(ppp) && boxPPs.includes(spp),
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
    <script>
      // Patch the UI after React mounts with live results
      function patchUI() {
        var data = window.__LIVE_DATA__;
        if (!data || !data.races) return;

        // Update the "last updated" time
        var timeEls = document.querySelectorAll('[class*="text-muted"]');
        timeEls.forEach(function(el) {
          if (el.textContent && el.textContent.includes('Updated')) {
            el.textContent = 'Updated ' + data.updated + ' ET (live)';
          }
        });

        // Find race cards and patch status
        var cards = document.querySelectorAll('[class*="focus:outline-none"]');
        if (cards.length === 0) cards = document.querySelectorAll('button[class]');

        data.races.forEach(function(race) {
          if (race.status !== 'finished' || !race.result) return;

          // Find the card matching this race number
          cards.forEach(function(card) {
            var numEl = card.querySelector('[class*="text-3xl"]');
            if (!numEl) return;
            var num = parseInt(numEl.textContent);
            if (num !== race.race_number) return;

            // Find "Projected order" label and change to "Finish"
            var labels = card.querySelectorAll('[class*="tracking-wider"]');
            labels.forEach(function(label) {
              if (label.textContent && label.textContent.trim() === 'Projected order') {
                label.textContent = 'Finish';
              }
            });

            // Find the order display and update with actual results
            var orderEls = card.querySelectorAll('[class*="tabular-nums"]');
            // Look for the projected finish section
            var allText = card.querySelectorAll('span');
            allText.forEach(function(span) {
              var t = span.textContent || '';
              // Update status badge
              if (t === 'upcoming' || t === 'Upcoming') {
                span.textContent = race.hits && (race.hits.win || race.hits.ex || race.hits.tri) ? 'HIT' : 'Result';
                span.style.color = race.hits && (race.hits.win || race.hits.ex || race.hits.tri) ? '#16a34a' : '#6b7280';
              }
            });
          });
        });
      }

      // Wait for React to mount then patch
      setTimeout(patchUI, 1500);
      setTimeout(patchUI, 3000);
    </script>
  </body>
</html>`);
}
