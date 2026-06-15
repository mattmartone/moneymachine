import { query } from '../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ftc-dev-secret';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const now = new Date();
    const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const today = `${et.getFullYear()}-${String(et.getMonth() + 1).padStart(2, '0')}-${String(et.getDate()).padStart(2, '0')}`;
    const { track } = req.query;

    // Get bets for today, optionally filtered by track
    const { rows: bets } = await query(
      `SELECT b.id, b.race_id, b.bet_type, b.stake, b.doubled, b.entries_used
       FROM bets b JOIN races r ON r.id = b.race_id
       WHERE r.date = $1 ${track ? 'AND r.track = $2' : ''}
       ORDER BY b.race_id`,
      track ? [today, track] : [today]
    );

    // Get all results for today's races that have bets
    const raceIds = [...new Set(bets.map((b: any) => b.race_id))];
    if (raceIds.length === 0) {
      return res.status(200).json({ performance: null });
    }

    const { rows: results } = await query(
      `SELECT r.race_id, r.win_payout, r.exacta_payout, r.trifecta_payout, r.superfecta_payout, r.settled_at,
              ew.post_position AS win_pp, ep.post_position AS place_pp, es.post_position AS show_pp,
              ef.post_position AS fourth_pp
       FROM results r
       LEFT JOIN entries ew ON ew.id = r.win_entry_id
       LEFT JOIN entries ep ON ep.id = r.place_entry_id
       LEFT JOIN entries es ON es.id = r.show_entry_id
       LEFT JOIN entries ef ON ef.id = r.fourth_entry_id
       WHERE r.race_id = ANY($1)`,
      [raceIds]
    );

    const resultMap: Record<number, any> = {};
    for (const r of results) {
      resultMap[r.race_id] = r;
    }

    const totalRaces = raceIds.length;
    const closedRaces = results.length;
    const openRaces = totalRaces - closedRaces;

    let totalWagered = 0;
    let totalCollected = 0;
    let lastSettled: string | null = null;

    const parsePP = (entry: string) => entry.replace(/^#/, '').split(' ')[0];

    for (const bet of bets) {
      const result = resultMap[bet.race_id];
      if (!result) continue;

      totalWagered += bet.stake;

      if (result.settled_at && (!lastSettled || result.settled_at > lastSettled)) {
        lastSettled = result.settled_at;
      }

      const betKey = bet.bet_type.toLowerCase();
      const wpp = String(result.win_pp);
      const ppp = String(result.place_pp);
      const spp = String(result.show_pp);

      if (!bet.entries_used?.length) continue;

      if (betKey === 'win') {
        const pickPP = parsePP(bet.entries_used[0]);
        if (pickPP === wpp && result.win_payout) {
          totalCollected += result.win_payout * (bet.stake / 2);
        }
      } else if (betKey === 'exacta') {
        const boxPPs = bet.entries_used.map(parsePP);
        if (boxPPs.includes(wpp) && boxPPs.includes(ppp) && result.exacta_payout) {
          const n = boxPPs.length;
          const combos = n * (n - 1);
          const perCombo = bet.stake / combos;
          totalCollected += result.exacta_payout * (perCombo / 1);
        }
      } else if (betKey === 'trifecta') {
        const boxPPs = bet.entries_used.map(parsePP);
        if (boxPPs.includes(wpp) && boxPPs.includes(ppp) && boxPPs.includes(spp) && result.trifecta_payout) {
          const n = boxPPs.length;
          const combos = n * (n - 1) * (n - 2);
          const perCombo = bet.stake / combos;
          totalCollected += result.trifecta_payout * (perCombo / 1);
        }
      } else if (betKey === 'superfecta') {
        const boxPPs = bet.entries_used.map(parsePP);
        const fpp = result.fourth_pp ? String(result.fourth_pp) : null;
        if (boxPPs.includes(wpp) && boxPPs.includes(ppp) && boxPPs.includes(spp) && fpp && boxPPs.includes(fpp) && result.superfecta_payout) {
          const n = boxPPs.length;
          const combos = n * (n - 1) * (n - 2) * (n - 3);
          const perCombo = bet.stake / combos;
          totalCollected += result.superfecta_payout * (perCombo / 0.10);
        }
      }
    }

    return res.status(200).json({
      performance: {
        total_races: totalRaces,
        closed_races: closedRaces,
        open_races: openRaces,
        total_wagered: totalWagered,
        total_collected: totalCollected,
        net: totalCollected - totalWagered,
        last_settled: lastSettled,
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
