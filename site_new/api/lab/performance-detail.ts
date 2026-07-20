import { query } from '../db.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  const isPublic = authHeader === 'Bearer public';
  if (!isPublic) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
  }

  const { filter, tier } = req.query;
  const tierFilter = tier === 'capo' ? `('MEDIUM', 'CAPO')` : tier === 'commission' ? `('COMMISSION', 'HIGH')` : `('COMMISSION', 'HIGH', 'MEDIUM', 'CAPO')`;
  const VERIFIED_DATES = `('2026-06-14', '2026-06-18', '2026-06-19', '2026-06-20', '2026-06-21', '2026-07-04')`;

  try {
    if (filter === 'today') {
      const now = new Date();
      const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      const today = `${et.getFullYear()}-${String(et.getMonth() + 1).padStart(2, '0')}-${String(et.getDate()).padStart(2, '0')}`;

      const { rows: todayBets } = await query(`
        SELECT b.id as bet_id, b.bet_type, b.stake, b.entries_used, b.doubled, b.conviction,
               r.id as race_id, r.track, r.race_number, r.post_time,
               s.name as strategy_name, sa.rationale,
               res.win_payout, res.place_payout, res.exacta_payout, res.trifecta_payout, res.superfecta_payout,
               res.settled_at,
               ew.post_position as win_pp, ep.post_position as place_pp,
               es.post_position as show_pp, ef.post_position as fourth_pp
        FROM bets b
        JOIN races r ON r.id = b.race_id
        LEFT JOIN strategy_activations sa ON sa.bet_id = b.id
        LEFT JOIN strategies s ON s.id = sa.strategy_id
        LEFT JOIN results res ON res.race_id = r.id
        LEFT JOIN entries ew ON ew.id = res.win_entry_id
        LEFT JOIN entries ep ON ep.id = res.place_entry_id
        LEFT JOIN entries es ON es.id = res.show_entry_id
        LEFT JOIN entries ef ON ef.id = res.fourth_entry_id
        WHERE r.date = $1 AND UPPER(b.conviction) IN ('COMMISSION', 'HIGH', 'MEDIUM', 'CAPO')
        ORDER BY r.post_time, r.race_number
      `, [today]);

      const parsePP = (entry: string) => parseInt(entry.replace(/^#/, '').split(' ')[0], 10);
      function factorial(n: number): number { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
      function permutations(n: number, k: number): number { return factorial(n) / factorial(n - k); }

      function calcCollected(bet: any): { collected: number; hit: boolean } {
        if (!bet.entries_used?.length || !bet.settled_at) return { collected: 0, hit: false };
        const pps = bet.entries_used.map(parsePP);
        const n = pps.length;
        const winPP = bet.win_pp;
        const placePP = bet.place_pp;
        const showPP = bet.show_pp;
        const fourthPP = bet.fourth_pp;

        if (bet.bet_type === 'win' && pps[0] === winPP && bet.win_payout > 0) {
          return { collected: (bet.win_payout / 2) * bet.stake, hit: true };
        } else if (bet.bet_type === 'place' && (pps[0] === winPP || pps[0] === placePP) && bet.place_payout > 0) {
          return { collected: (bet.place_payout / 2) * bet.stake, hit: true };
        } else if (bet.bet_type === 'exacta' && pps.includes(winPP) && pps.includes(placePP) && bet.exacta_payout > 0) {
          return { collected: bet.exacta_payout * (bet.stake / permutations(n, 2)), hit: true };
        } else if (bet.bet_type === 'trifecta' && pps.includes(winPP) && pps.includes(placePP) && pps.includes(showPP) && bet.trifecta_payout > 0) {
          return { collected: bet.trifecta_payout * (bet.stake / permutations(n, 3)), hit: true };
        } else if (bet.bet_type === 'superfecta' && pps.includes(winPP) && pps.includes(placePP) && pps.includes(showPP) && fourthPP && pps.includes(fourthPP) && bet.superfecta_payout > 0) {
          return { collected: bet.superfecta_payout * (bet.stake / permutations(n, 4)), hit: true };
        }
        return { collected: 0, hit: false };
      }

      // Determine tier per race (a race's tier = highest conviction among its bets)
      // Commission tier: COMMISSION or HIGH
      // Capo tier: MEDIUM or CAPO
      const raceTier: Record<string, string> = {};
      for (const row of todayBets) {
        const raceKey = `${row.track}-R${row.race_number}`;
        const conv = row.conviction?.toUpperCase() || 'CAPO';
        const priority = conv === 'COMMISSION' ? 3 : conv === 'HIGH' ? 2 : 1;
        const existing = raceTier[raceKey];
        const existingPriority = existing === 'COMMISSION' ? 3 : existing === 'HIGH' ? 2 : 1;
        if (!existing || priority > existingPriority) raceTier[raceKey] = conv;
      }

      // Group by strategy, track races within each
      function buildStrategyGroups(bets: any[], tierFilter: (raceKey: string) => boolean) {
        const stratMap: Record<string, {
          races: Record<string, { track: string; race_number: number; post_time: string; status: string; bets: { bet_type: string; stake: number; hit: boolean; net: number; doubled: boolean }[]; pick: string; rationale: string | null }>;
          totalWagered: number;
          totalCollected: number;
          wins: number;
          settled: number;
        }> = {};

        for (const row of bets) {
          const raceKey = `${row.track}-R${row.race_number}`;
          if (!tierFilter(raceKey)) continue;

          const stratName = row.strategy_name || '__untagged__';
          if (!stratMap[stratName]) {
            stratMap[stratName] = { races: {}, totalWagered: 0, totalCollected: 0, wins: 0, settled: 0 };
          }
          const strat = stratMap[stratName];

          if (!strat.races[raceKey]) {
            const isSettled = !!row.settled_at;
            const postTimeStr = row.post_time ? row.post_time.slice(0, 5) : '';
            let hour = parseInt(postTimeStr.split(':')[0] || '0');
            const min = postTimeStr.split(':')[1] || '00';
            const ampm = hour >= 12 ? 'PM' : 'AM';
            if (hour > 12) hour -= 12;
            if (hour === 0) hour = 12;

            strat.races[raceKey] = {
              track: row.track,
              race_number: row.race_number,
              post_time: postTimeStr ? `${hour}:${min} ${ampm}` : '',
              status: isSettled ? 'settled' : 'pending',
              bets: [],
              pick: row.entries_used?.[0]?.replace(/^#\d+\s*/, '') || '',
              rationale: row.rationale,
            };
          }

          const { collected, hit } = calcCollected(row);
          strat.races[raceKey].bets.push({
            bet_type: row.bet_type,
            stake: row.stake,
            hit,
            net: collected - row.stake,
            doubled: row.doubled || false,
          });
          strat.totalWagered += row.stake;
          strat.totalCollected += collected;
          if (hit) strat.wins++;
          if (row.settled_at) strat.settled++;
        }

        return Object.entries(stratMap)
          .filter(([name]) => name !== '__untagged__')
          .map(([name, s]) => ({
            name,
            fires: Object.keys(s.races).length,
            settled: Math.floor(s.settled / Math.max(Object.values(s.races)[0]?.bets.length || 1, 1)),
            wins: s.wins,
            net: Math.round((s.totalCollected - s.totalWagered) * 100) / 100,
            wagered: Math.round(s.totalWagered * 100) / 100,
            races: Object.values(s.races),
          }))
          .sort((a, b) => b.net - a.net);
      }

      const commission = buildStrategyGroups(todayBets, (rk) => raceTier[rk] === 'COMMISSION' || raceTier[rk] === 'HIGH');
      const capo = buildStrategyGroups(todayBets, (rk) => raceTier[rk] === 'MEDIUM' || raceTier[rk] === 'CAPO');

      return res.status(200).json({ commission, capo, type: 'today' });
    }

    if (filter === 'model') {
      const { rows } = await query(`
        SELECT date, races_played, total_wagered, total_collected, model_net,
               win_rate, exacta_rate, random_median_net, random_pct_beaten
        FROM performance_warehouse
        ORDER BY date DESC
      `);

      const data = rows.map((r: any) => ({
        date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        model_net: Math.round(r.model_net * 100) / 100,
        random_net: r.random_median_net ? Math.round(r.random_median_net * 100) / 100 : 0,
        model_win_rate: r.win_rate != null ? Math.round(r.win_rate * 100) : null,
        random_win_rate: null,
        model_exacta_rate: r.exacta_rate != null ? Math.round(r.exacta_rate * 100) : null,
        random_exacta_rate: null,
        races: r.races_played,
        model_beats: r.random_pct_beaten || null,
      }));

      return res.status(200).json({ data, type: 'model' });
    }

    if (filter === 'bet_types') {
      const { rows } = await query(`
        SELECT b.bet_type,
               COUNT(*) as fires,
               SUM(b.stake) as wagered
        FROM bets b
        JOIN races r ON r.id = b.race_id
        JOIN results res ON res.race_id = r.id
        WHERE UPPER(b.conviction) IN ${tierFilter}
          AND r.date IN ${VERIFIED_DATES}
        GROUP BY b.bet_type
        ORDER BY b.bet_type
      `);

      // Calculate collected per bet type
      const { rows: settledBets } = await query(`
        SELECT b.bet_type, b.stake, b.entries_used,
               res.win_payout, res.place_payout, res.exacta_payout, res.trifecta_payout, res.superfecta_payout,
               ew.post_position as win_pp, ep.post_position as place_pp,
               es.post_position as show_pp, ef.post_position as fourth_pp
        FROM bets b
        JOIN races r ON r.id = b.race_id
        JOIN results res ON res.race_id = r.id
        LEFT JOIN entries ew ON ew.id = res.win_entry_id
        LEFT JOIN entries ep ON ep.id = res.place_entry_id
        LEFT JOIN entries es ON es.id = res.show_entry_id
        LEFT JOIN entries ef ON ef.id = res.fourth_entry_id
        WHERE UPPER(b.conviction) IN ${tierFilter}
          AND r.date IN ${VERIFIED_DATES}
      `);

      const parsePP = (entry: string) => parseInt(entry.replace(/^#/, '').split(' ')[0], 10);

      const collectedByType: Record<string, { collected: number; wins: number }> = {
        win: { collected: 0, wins: 0 },
        place: { collected: 0, wins: 0 },
        exacta: { collected: 0, wins: 0 },
        trifecta: { collected: 0, wins: 0 },
        superfecta: { collected: 0, wins: 0 },
      };

      function factorial(n: number): number {
        let r = 1;
        for (let i = 2; i <= n; i++) r *= i;
        return r;
      }
      function permutations(n: number, k: number): number {
        return factorial(n) / factorial(n - k);
      }

      for (const bet of settledBets) {
        if (!bet.entries_used?.length) continue;
        const pps = bet.entries_used.map(parsePP);
        const n = pps.length;
        const winPP = bet.win_pp;
        const placePP = bet.place_pp;
        const showPP = bet.show_pp;
        const fourthPP = bet.fourth_pp;

        if (bet.bet_type === 'win') {
          if (pps[0] === winPP && bet.win_payout > 0) {
            const collected = (bet.win_payout / 2) * bet.stake;
            collectedByType.win.collected += collected;
            collectedByType.win.wins++;
          }
        } else if (bet.bet_type === 'place') {
          if ((pps[0] === winPP || pps[0] === placePP) && bet.place_payout > 0) {
            const collected = (bet.place_payout / 2) * bet.stake;
            collectedByType.place.collected += collected;
            collectedByType.place.wins++;
          }
        } else if (bet.bet_type === 'exacta') {
          if (pps.includes(winPP) && pps.includes(placePP) && bet.exacta_payout > 0) {
            const collected = bet.exacta_payout * (bet.stake / permutations(n, 2));
            collectedByType.exacta.collected += collected;
            collectedByType.exacta.wins++;
          }
        } else if (bet.bet_type === 'trifecta') {
          if (pps.includes(winPP) && pps.includes(placePP) && pps.includes(showPP) && bet.trifecta_payout > 0) {
            const collected = bet.trifecta_payout * (bet.stake / permutations(n, 3));
            collectedByType.trifecta.collected += collected;
            collectedByType.trifecta.wins++;
          }
        } else if (bet.bet_type === 'superfecta') {
          if (pps.includes(winPP) && pps.includes(placePP) && pps.includes(showPP) && fourthPP && pps.includes(fourthPP) && bet.superfecta_payout > 0) {
            const collected = bet.superfecta_payout * (bet.stake / permutations(n, 4));
            collectedByType.superfecta.collected += collected;
            collectedByType.superfecta.wins++;
          }
        }
      }

      const result = rows.map((r: any) => {
        const type = r.bet_type;
        const wagered = parseFloat(r.wagered);
        const collected = collectedByType[type]?.collected || 0;
        const wins = collectedByType[type]?.wins || 0;
        const net = collected - wagered;
        const roi = wagered > 0 ? Math.round((net / wagered) * 100) : 0;
        return {
          name: type.charAt(0).toUpperCase() + type.slice(1),
          fires: parseInt(r.fires),
          wins,
          roi,
          net: Math.round(net * 100) / 100,
        };
      });

      return res.status(200).json({ data: result });
    }

    if (filter === 'strategies') {
      const { rows: stratBets } = await query(`
        SELECT s.name as strategy_name, b.race_id, b.bet_type, b.stake, b.entries_used,
               res.win_payout, res.place_payout, res.exacta_payout, res.trifecta_payout, res.superfecta_payout,
               ew.post_position as win_pp, ep.post_position as place_pp,
               es.post_position as show_pp, ef.post_position as fourth_pp
        FROM strategy_activations sa
        JOIN strategies s ON s.id = sa.strategy_id
        JOIN bets b ON b.id = sa.bet_id
        JOIN races r ON r.id = b.race_id
        JOIN results res ON res.race_id = r.id
        LEFT JOIN entries ew ON ew.id = res.win_entry_id
        LEFT JOIN entries ep ON ep.id = res.place_entry_id
        LEFT JOIN entries es ON es.id = res.show_entry_id
        LEFT JOIN entries ef ON ef.id = res.fourth_entry_id
        WHERE UPPER(b.conviction) IN ${tierFilter}
          AND r.date IN ${VERIFIED_DATES}
      `);

      const parsePP = (entry: string) => parseInt(entry.replace(/^#/, '').split(' ')[0], 10);
      function factorial(n: number): number { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
      function permutations(n: number, k: number): number { return factorial(n) / factorial(n - k); }

      // Group by strategy, then by race to get per-race net
      const stratMap: Record<string, { races: Set<number>; wagered: number; collected: number; wins: number }> = {};

      for (const row of stratBets) {
        if (!stratMap[row.strategy_name]) {
          stratMap[row.strategy_name] = { races: new Set(), wagered: 0, collected: 0, wins: 0 };
        }
        const s = stratMap[row.strategy_name];
        s.races.add(row.race_id);
        s.wagered += row.stake;

        if (!row.entries_used?.length) continue;
        const pps = row.entries_used.map(parsePP);
        const n = pps.length;

        let collected = 0;
        if (row.bet_type === 'win' && pps[0] === row.win_pp && row.win_payout > 0) {
          collected = (row.win_payout / 2) * row.stake;
          s.wins++;
        } else if (row.bet_type === 'exacta' && pps.includes(row.win_pp) && pps.includes(row.place_pp) && row.exacta_payout > 0) {
          collected = row.exacta_payout * (row.stake / permutations(n, 2));
        } else if (row.bet_type === 'trifecta' && pps.includes(row.win_pp) && pps.includes(row.place_pp) && pps.includes(row.show_pp) && row.trifecta_payout > 0) {
          collected = row.trifecta_payout * (row.stake / permutations(n, 3));
        } else if (row.bet_type === 'superfecta' && pps.includes(row.win_pp) && pps.includes(row.place_pp) && pps.includes(row.show_pp) && row.fourth_pp && pps.includes(row.fourth_pp) && row.superfecta_payout > 0) {
          collected = row.superfecta_payout * (row.stake / permutations(n, 4));
        }
        s.collected += collected;
      }

      const result = Object.entries(stratMap)
        .map(([name, s]) => {
          const net = s.collected - s.wagered;
          const roi = s.wagered > 0 ? Math.round((net / s.wagered) * 100) : 0;
          return { name, fires: s.races.size, wins: s.wins, roi, net: Math.round(net * 100) / 100 };
        })
        .sort((a, b) => b.net - a.net);

      return res.status(200).json({ data: result });
    }

    if (filter === 'horses') {
      const { rows: horseBets } = await query(`
        SELECT h.name as horse_name, b.race_id, b.bet_type, b.stake, b.entries_used,
               res.win_payout, ew.post_position as win_pp
        FROM bets b
        JOIN races r ON r.id = b.race_id
        JOIN results res ON res.race_id = r.id
        LEFT JOIN entries ew ON ew.id = res.win_entry_id
        LEFT JOIN horses h ON h.id = ew.horse_id
        WHERE UPPER(b.conviction) IN ${tierFilter} AND b.bet_type = 'win'
          AND r.date IN ${VERIFIED_DATES}
      `);

      const parsePP = (entry: string) => parseInt(entry.replace(/^#/, '').split(' ')[0], 10);

      // For each win bet, check if our pick won — group by winning horse
      const horseMap: Record<string, { fires: number; wins: number; wagered: number; collected: number }> = {};

      for (const row of horseBets) {
        if (!row.entries_used?.length) continue;
        const pickPP = parsePP(row.entries_used[0]);
        const won = pickPP === row.win_pp;

        // Group by our pick horse (from entries_used, not the winner)
        const pickName = row.entries_used[0].replace(/^#\d+\s*/, '').trim() || `#${pickPP}`;
        if (!horseMap[pickName]) horseMap[pickName] = { fires: 0, wins: 0, wagered: 0, collected: 0 };
        const h = horseMap[pickName];
        h.fires++;
        h.wagered += row.stake;
        if (won && row.win_payout > 0) {
          h.wins++;
          h.collected += (row.win_payout / 2) * row.stake;
        }
      }

      const result = Object.entries(horseMap)
        .filter(([name]) => name && !/^\d+$/.test(name) && name !== 'Unknown')
        .map(([name, h]) => {
          const net = h.collected - h.wagered;
          const roi = h.wagered > 0 ? Math.round((net / h.wagered) * 100) : 0;
          return { name, fires: h.fires, wins: h.wins, roi, net: Math.round(net * 100) / 100 };
        })
        .sort((a, b) => b.net - a.net);

      return res.status(200).json({ data: result });
    }

    if (filter === 'trainers' || filter === 'jockeys' || filter === 'barns') {
      const personCol = filter === 'jockeys' ? 'e.jockey' : 'e.trainer';
      const groupCol = filter === 'barns' ? `e.trainer || ' (' || r.track || ')'` : personCol;

      const { rows: personBets } = await query(`
        SELECT ${groupCol} as person, b.bet_type, b.stake, b.entries_used,
               res.win_payout, res.place_payout, res.exacta_payout, res.trifecta_payout, res.superfecta_payout,
               ew.post_position as win_pp, ep.post_position as place_pp,
               es.post_position as show_pp, ef.post_position as fourth_pp
        FROM bets b
        JOIN races r ON r.id = b.race_id
        JOIN results res ON res.race_id = r.id
        JOIN entries e ON e.race_id = r.id
        LEFT JOIN entries ew ON ew.id = res.win_entry_id
        LEFT JOIN entries ep ON ep.id = res.place_entry_id
        LEFT JOIN entries es ON es.id = res.show_entry_id
        LEFT JOIN entries ef ON ef.id = res.fourth_entry_id
        WHERE b.conviction IN ('COMMISSION', 'HIGH')
          AND b.bet_type = 'win'
          AND ${personCol} IS NOT NULL
          AND r.date IN ${VERIFIED_DATES}
          AND e.post_position = (
            SELECT CAST(REPLACE(entries_used[1], '#', '') AS int)
            FROM bets b2 WHERE b2.id = b.id
          )
      `);

      const parsePP = (entry: string) => parseInt(entry.replace(/^#/, '').split(' ')[0], 10);

      const personMap: Record<string, { fires: number; wins: number; wagered: number; collected: number }> = {};

      for (const row of personBets) {
        if (!row.person || !row.entries_used?.length) continue;
        const name = row.person.trim();
        if (!personMap[name]) personMap[name] = { fires: 0, wins: 0, wagered: 0, collected: 0 };
        const p = personMap[name];
        p.fires++;
        p.wagered += row.stake;

        const pickPP = parsePP(row.entries_used[0]);
        if (pickPP === row.win_pp && row.win_payout > 0) {
          p.wins++;
          p.collected += (row.win_payout / 2) * row.stake;
        }
      }

      const result = Object.entries(personMap)
        .map(([name, p]) => {
          const net = p.collected - p.wagered;
          const roi = p.wagered > 0 ? Math.round((net / p.wagered) * 100) : 0;
          return { name, fires: p.fires, wins: p.wins, roi, net: Math.round(net * 100) / 100 };
        })
        .sort((a, b) => b.net - a.net);

      return res.status(200).json({ data: result });
    }

    return res.status(200).json({ data: [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
