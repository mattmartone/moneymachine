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

  const { filter } = req.query;

  try {
    if (filter === 'bet_types') {
      const { rows } = await query(`
        SELECT b.bet_type,
               COUNT(*) as fires,
               SUM(b.stake) as wagered
        FROM bets b
        JOIN races r ON r.id = b.race_id
        JOIN results res ON res.race_id = r.id
        WHERE b.conviction IN ('COMMISSION', 'HIGH')
        GROUP BY b.bet_type
        ORDER BY b.bet_type
      `);

      // Calculate collected per bet type
      const { rows: settledBets } = await query(`
        SELECT b.bet_type, b.stake, b.entries_used,
               res.win_payout, res.exacta_payout, res.trifecta_payout, res.superfecta_payout,
               ew.post_position as win_pp, ep.post_position as place_pp,
               es.post_position as show_pp, ef.post_position as fourth_pp
        FROM bets b
        JOIN races r ON r.id = b.race_id
        JOIN results res ON res.race_id = r.id
        LEFT JOIN entries ew ON ew.id = res.win_entry_id
        LEFT JOIN entries ep ON ep.id = res.place_entry_id
        LEFT JOIN entries es ON es.id = res.show_entry_id
        LEFT JOIN entries ef ON ef.id = res.fourth_entry_id
        WHERE b.conviction IN ('COMMISSION', 'HIGH')
      `);

      const parsePP = (entry: string) => parseInt(entry.replace(/^#/, '').split(' ')[0], 10);

      const collectedByType: Record<string, { collected: number; wins: number }> = {
        win: { collected: 0, wins: 0 },
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
          if (pps.includes(winPP) && bet.win_payout > 0) {
            const collected = (bet.win_payout / 2) * bet.stake;
            collectedByType.win.collected += collected;
            collectedByType.win.wins++;
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
               res.win_payout, res.exacta_payout, res.trifecta_payout, res.superfecta_payout,
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
        WHERE b.conviction IN ('COMMISSION', 'HIGH')
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
        if (row.bet_type === 'win' && pps.includes(row.win_pp) && row.win_payout > 0) {
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
        WHERE b.conviction IN ('COMMISSION', 'HIGH') AND b.bet_type = 'win'
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
        .map(([name, h]) => {
          const net = h.collected - h.wagered;
          const roi = h.wagered > 0 ? Math.round((net / h.wagered) * 100) : 0;
          return { name: name || 'Unknown', fires: h.fires, wins: h.wins, roi, net: Math.round(net * 100) / 100 };
        })
        .sort((a, b) => b.net - a.net);

      return res.status(200).json({ data: result });
    }

    if (filter === 'trainers' || filter === 'jockeys' || filter === 'barns') {
      const personCol = filter === 'jockeys' ? 'e.jockey' : 'e.trainer';
      const groupCol = filter === 'barns' ? `e.trainer || ' (' || r.track || ')'` : personCol;

      const { rows: personBets } = await query(`
        SELECT ${groupCol} as person, b.bet_type, b.stake, b.entries_used,
               res.win_payout, res.exacta_payout, res.trifecta_payout, res.superfecta_payout,
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
