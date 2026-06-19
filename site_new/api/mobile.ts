export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(HTML);
}

const HTML = `<!DOCTYPE html>
<html lang="en" data-theme="ink">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <title>FTC Race Day</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --c-app: 250 249 246; --c-surface: 255 255 255; --c-border: 229 231 235;
      --c-primary: 17 24 39; --c-accent: 22 163 74; --c-success: 22 163 74;
      --c-danger: 239 68 68; --c-muted: 107 114 128; --c-gray-900: 17 24 39;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, sans-serif; background: #faf9f6; color: #111827; -webkit-font-smoothing: antialiased; }
    .container { max-width: 28rem; margin: 0 auto; padding: 1rem; padding-bottom: 6rem; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .header h1 { font-size: 1.125rem; font-weight: 700; letter-spacing: -0.025em; }
    .header .meta { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: rgb(var(--c-muted)); font-weight: 600; }
    .perf-bar { background: rgb(var(--c-surface)); border: 1px solid rgb(var(--c-border)); border-radius: 0.75rem; padding: 0.875rem; margin-bottom: 1rem; }
    .perf-row { display: flex; justify-content: space-between; align-items: baseline; }
    .perf-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: rgb(var(--c-muted)); font-weight: 600; }
    .perf-value { font-size: 1.875rem; font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1; }
    .perf-value.positive { color: rgb(var(--c-success)); }
    .perf-value.negative { color: rgb(var(--c-danger)); }
    .perf-sub { font-size: 0.75rem; color: rgb(var(--c-muted)); margin-top: 0.25rem; }
    .section-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: rgb(var(--c-muted)); font-weight: 600; padding: 0 0.25rem; margin-bottom: 0.5rem; margin-top: 1.25rem; }
    .race-card { background: rgb(var(--c-surface)); border: 1px solid rgb(var(--c-border)); border-radius: 0.75rem; padding: 1rem; margin-bottom: 0.5rem; cursor: pointer; transition: box-shadow 0.15s; }
    .race-card:active { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .race-card.hit { border-color: rgb(var(--c-success) / 0.4); background: rgb(var(--c-success) / 0.05); }
    .race-card.miss { border-color: rgb(var(--c-danger) / 0.3); background: rgb(var(--c-danger) / 0.03); }
    .race-card.live { border-color: rgb(var(--c-accent) / 0.4); }
    .race-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; }
    .race-left { display: flex; flex-direction: column; min-width: 0; }
    .race-track { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: rgb(var(--c-muted)); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .race-num-row { display: flex; align-items: baseline; gap: 2px; line-height: 1; }
    .race-prefix { font-size: 0.875rem; font-weight: 700; color: rgb(var(--c-muted)); }
    .race-number { font-size: 1.875rem; font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1; }
    .race-time { font-size: 0.75rem; color: rgb(var(--c-muted)); font-variant-numeric: tabular-nums; margin-top: 0.25rem; }
    .race-right { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
    .race-stake { font-size: 1.125rem; font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: -0.025em; color: rgb(var(--c-primary)); }
    .race-stake.positive { color: rgb(var(--c-success)); }
    .race-stake.negative { color: rgb(var(--c-danger)); }
    .badge { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; padding: 2px 6px; border-radius: 4px; white-space: nowrap; }
    .badge-pending { background: rgb(var(--c-primary) / 0.1); color: rgb(var(--c-primary)); }
    .badge-hit { background: rgb(var(--c-success) / 0.15); color: rgb(var(--c-success)); }
    .badge-miss { background: rgb(var(--c-danger) / 0.1); color: rgb(var(--c-danger)); }
    .badge-next { background: rgb(var(--c-primary)); color: white; }
    .race-detail { margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgb(var(--c-border)); }
    .finish-row { font-size: 0.6875rem; color: rgb(var(--c-muted)); margin-bottom: 0.375rem; }
    .finish-row strong { color: rgb(var(--c-gray-900)); }
    .bets-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .bet-chip { font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; }
    .bet-chip.hit { background: rgb(var(--c-success) / 0.15); color: rgb(var(--c-success)); }
    .bet-chip.miss { color: rgb(var(--c-muted) / 0.5); text-decoration: line-through; }
    .box-row { margin-top: 0.5rem; font-size: 0.6875rem; color: rgb(var(--c-muted)); }
    .box-row .horse { display: inline-block; margin-right: 0.25rem; padding: 1px 4px; border-radius: 3px; background: rgb(var(--c-primary) / 0.06); }
    .box-row .horse.winner { background: rgb(var(--c-success) / 0.15); color: rgb(var(--c-success)); font-weight: 600; }
    .loading { text-align: center; padding: 3rem 1rem; color: #6b7280; font-size: 0.875rem; }
    .dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: rgb(var(--c-success)); animation: pulse 2s infinite; margin-right: 4px; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .hidden { display: none; }
  </style>
</head>
<body>
  <div class="container" id="app">
    <div class="loading" style="color:#111827;">Loading race day...</div>
  </div>
  <script>
    const TOKEN_KEY = 'ftc_token';
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
    const parsePP = (s) => s.replace(/^#/, '').split(' ')[0];

    function formatTime(t) {
      if (!t) return '';
      const [h, m] = t.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
      return hr + ':' + String(m).padStart(2, '0') + ' ' + ampm;
    }

    function getNowET() {
      const now = new Date();
      const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      return String(et.getHours()).padStart(2, '0') + ':' + String(et.getMinutes()).padStart(2, '0');
    }

    async function load() {
      if (!token) {
        document.getElementById('app').innerHTML = '<div style="padding:2rem;color:red;font-size:16px;font-weight:bold;">No token found. <a href="/">Login first</a>, then come back to /mobile.</div>';
        return;
      }

      const picksResponse = await fetch('/api/lab/today', { headers: headers });
      const perfResponse = await fetch('/api/lab/performance', { headers: headers });

      if (picksResponse.status === 401 || perfResponse.status === 401) {
        document.getElementById('app').innerHTML = '<div style="padding:2rem;color:red;font-size:16px;font-weight:bold;">Session expired (401). <a href="/">Login</a>, then come back.</div>';
        return;
      }

      const picksRes = await picksResponse.json();
      const perfRes = await perfResponse.json();

      const picks = picksRes.picks || [];
      const perf = perfRes.performance;

      var raceMap = new Map();
      for (var i = 0; i < picks.length; i++) {
        var pick = picks[i];
        if (!raceMap.has(pick.race_id)) {
          raceMap.set(pick.race_id, {
            race_id: pick.race_id, track: pick.track, race_number: pick.race_number,
            post_time: pick.post_time, conditions: pick.conditions,
            distance: pick.distance, surface: pick.surface,
            bets: [], total_stake: 0
          });
        }
        var r = raceMap.get(pick.race_id);
        r.bets.push(pick);
        r.total_stake += pick.stake;
      }

      var races = Array.from(raceMap.values()).sort(function(a, b) {
        if (!a.post_time && !b.post_time) return 0;
        if (!a.post_time) return 1;
        if (!b.post_time) return -1;
        return a.post_time.localeCompare(b.post_time);
      });

      var results = {};
      var resultPromises = races.map(function(race) {
        return fetch('/api/lab/results?race_id=' + race.race_id, { headers: headers })
          .then(function(res) { return res.json(); })
          .then(function(data) { if (data && data.results) results[race.race_id] = data.results; })
          .catch(function() {});
      });
      await Promise.all(resultPromises);

      render(races, results, perf);
    }

    function computeHits(race, result) {
      var winBet = race.bets.find(function(b) { return b.bet_type === 'win'; });
      var exBet = race.bets.find(function(b) { return b.bet_type === 'exacta'; });
      var boxPPs = (exBet && exBet.entries_used || []).map(parsePP);
      var winPickPP = winBet && winBet.entries_used && winBet.entries_used[0] ? parsePP(winBet.entries_used[0]) : null;
      var wpp = String(result.win_pp), ppp = String(result.place_pp), spp = String(result.show_pp);
      var fpp = result.fourth_pp ? String(result.fourth_pp) : null;
      return {
        win: winPickPP === wpp,
        ex: boxPPs.indexOf(wpp) >= 0 && boxPPs.indexOf(ppp) >= 0,
        tri: boxPPs.indexOf(wpp) >= 0 && boxPPs.indexOf(ppp) >= 0 && boxPPs.indexOf(spp) >= 0,
        super: boxPPs.indexOf(wpp) >= 0 && boxPPs.indexOf(ppp) >= 0 && boxPPs.indexOf(spp) >= 0 && fpp && boxPPs.indexOf(fpp) >= 0,
        boxPPs: boxPPs, winPickPP: winPickPP
      };
    }

    function render(races, results, perf) {
      var now = getNowET();
      var upcoming = [], pending = [], settled = [];
      for (var i = 0; i < races.length; i++) {
        var race = races[i];
        var result = results[race.race_id];
        if (result) { settled.push(Object.assign({}, race, { result: result })); }
        else if (race.post_time && race.post_time.slice(0,5) < now) { pending.push(race); }
        else { upcoming.push(race); }
      }

      var html = '<div class="header"><h1>Race Day</h1><div class="meta">' + new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + '</div></div>';

      if (perf) {
        var net = perf.net || 0;
        var cls = net >= 0 ? 'positive' : 'negative';
        html += '<div class="perf-bar"><div class="perf-row"><div><div class="perf-label">Today P/L</div><div class="perf-value ' + cls + '">' + (net >= 0 ? '+' : '') + '$' + net.toFixed(2) + '</div></div><div style="text-align:right"><div class="perf-label">Settled</div><div style="font-size:1.25rem;font-weight:700;">' + perf.closed_races + '/' + perf.total_races + '</div></div></div><div class="perf-sub">Wagered $' + perf.total_wagered.toFixed(0) + ' · Collected $' + perf.total_collected.toFixed(2) + '</div></div>';
      }

      if (pending.length > 0) {
        html += '<div class="section-label"><span class="dot"></span> Awaiting Results</div>';
        for (var i = 0; i < pending.length; i++) html += renderCard(pending[i], null, 'pending');
      }
      if (upcoming.length > 0) {
        html += '<div class="section-label">Upcoming</div>';
        for (var i = 0; i < upcoming.length; i++) html += renderCard(upcoming[i], null, i === 0 ? 'next' : 'upcoming');
      }
      if (settled.length > 0) {
        html += '<div class="section-label">Results</div>';
        for (var i = 0; i < settled.length; i++) html += renderCard(settled[i], settled[i].result, 'settled');
      }

      document.getElementById('app').innerHTML = html;
      document.querySelectorAll('.race-card').forEach(function(card) {
        card.addEventListener('click', function() {
          var detail = card.querySelector('.race-detail');
          if (detail) detail.classList.toggle('hidden');
        });
      });
    }

    function renderCard(race, result, status) {
      var cardClass = 'race-card';
      var badgeHtml = '';
      var stakeHtml = '<span class="race-stake">$' + race.total_stake.toFixed(0) + '</span>';
      var detailHtml = '';

      if (result) {
        var hits = computeHits(race, result);
        var anyHit = hits.win || hits.ex || hits.tri || hits.super;
        cardClass += anyHit ? ' hit' : ' miss';
        var bestHit = hits.win ? 'WIN' : hits.super ? 'SUPER' : hits.tri ? 'TRI' : hits.ex ? 'EX' : 'MISS';
        badgeHtml = '<span class="badge ' + (anyHit ? 'badge-hit' : 'badge-miss') + '">' + bestHit + '</span>';

        var collected = 0;
        var winBet = race.bets.find(function(b) { return b.bet_type === 'win'; });
        if (hits.win && result.win_payout) collected += (result.win_payout / 2) * (winBet ? winBet.stake : 25);
        if (hits.ex && result.exacta_payout) {
          var n = hits.boxPPs.length;
          var exBet = race.bets.find(function(b) { return b.bet_type === 'exacta'; });
          var perCombo = (exBet ? exBet.stake : 50) / (n * (n - 1));
          collected += result.exacta_payout * perCombo;
        }
        if (hits.tri && result.trifecta_payout) {
          var n = hits.boxPPs.length;
          var triBet = race.bets.find(function(b) { return b.bet_type === 'trifecta'; });
          var perCombo = (triBet ? triBet.stake : 24) / (n * (n - 1) * (n - 2));
          collected += result.trifecta_payout * perCombo;
        }
        if (hits.super && result.superfecta_payout) {
          var n = hits.boxPPs.length;
          var superBet = race.bets.find(function(b) { return b.bet_type === 'superfecta'; });
          var perCombo = (superBet ? superBet.stake : 2.4) / (n * (n - 1) * (n - 2) * (n - 3));
          collected += result.superfecta_payout * perCombo;
        }
        var raceNet = collected - race.total_stake;
        stakeHtml = '<span class="race-stake ' + (raceNet >= 0 ? 'positive' : 'negative') + '">' + (raceNet >= 0 ? '+' : '') + '$' + Math.abs(raceNet).toFixed(0) + '</span>';

        detailHtml = '<div class="race-detail hidden"><div class="finish-row"><strong>#' + result.win_pp + ' ' + result.win_horse + '</strong> — #' + result.place_pp + ' ' + result.place_horse + ' — #' + result.show_pp + ' ' + result.show_horse + (result.fourth_pp ? ' — #' + result.fourth_pp + ' ' + (result.fourth_horse || '') : '') + '</div><div class="bets-row"><span class="bet-chip ' + (hits.win ? 'hit' : 'miss') + '">WIN</span><span class="bet-chip ' + (hits.ex ? 'hit' : 'miss') + '">EX' + (hits.ex ? ' HIT' : '') + '</span><span class="bet-chip ' + (hits.tri ? 'hit' : 'miss') + '">TRI</span><span class="bet-chip ' + (hits.super ? 'hit' : 'miss') + '">SUPER</span></div></div>';
      } else if (status === 'pending') {
        cardClass += ' live';
        badgeHtml = '<span class="badge badge-pending">PENDING</span>';
        var winBet = race.bets.find(function(b) { return b.bet_type === 'win'; });
        var exBet = race.bets.find(function(b) { return b.bet_type === 'exacta'; });
        detailHtml = '<div class="race-detail hidden"><div class="finish-row">Win pick: <strong>' + (winBet && winBet.entries_used ? winBet.entries_used[0] : '') + '</strong></div></div>';
      } else {
        if (status === 'next') badgeHtml = '<span class="badge badge-next">NEXT</span>';
        var winBet = race.bets.find(function(b) { return b.bet_type === 'win'; });
        var exBet = race.bets.find(function(b) { return b.bet_type === 'exacta'; });
        detailHtml = '<div class="race-detail hidden"><div class="finish-row">Win pick: <strong>' + (winBet && winBet.entries_used ? winBet.entries_used[0] : '') + '</strong>' + (winBet && winBet.doubled ? ' <span class="badge badge-hit">2x</span>' : '') + '</div></div>';
      }

      return '<div class="' + cardClass + '"><div class="race-top"><div class="race-left"><div class="race-track">' + race.track + '</div><div class="race-num-row"><span class="race-prefix">R</span><span class="race-number">' + race.race_number + '</span></div><div class="race-time">' + formatTime(race.post_time) + ' ' + badgeHtml + '</div></div><div class="race-right">' + stakeHtml + '</div></div>' + detailHtml + '</div>';
    }

    load().catch(function(e) {
      document.getElementById('app').innerHTML = '<div style="padding:2rem;color:red;font-size:16px;font-weight:bold;">Error: ' + (e.message || 'Failed to load') + '. <a href="/">Login</a></div>';
    });

    setInterval(function() { load().catch(function() {}); }, 120000);
  </script>
</body>
</html>`;
