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

    return res.status(200).json({ data: [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
