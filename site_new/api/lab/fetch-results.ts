import { query } from '../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ftc-dev-secret';
const API_USER = 'DPoVaGs2XRopMmiHUcJDkHtC';
const API_PASS = 'YQJDPUITg7LCEP0Ascpu5t1S';
const BASE_URL = 'https://api.theracingapi.com/v1/north-america';

const TRACK_IDS: Record<string, string> = {
  'Santa Anita': 'SA', 'Laurel Park': 'LRL', 'Saratoga': 'SAR', 'Churchill Downs': 'CD',
  'Del Mar': 'DMR', 'Gulfstream Park': 'GP', 'Aqueduct': 'AQU', 'Belmont': 'BEL',
  'Belmont at the Big A': 'BAQ', 'Keeneland': 'KEE', 'Pimlico': 'PIM', 'Monmouth Park': 'MTH',
  'Woodbine': 'WO', 'Oaklawn Park': 'OP', 'Tampa Bay': 'TAM', 'Fair Grounds': 'FG',
  'Parx Racing': 'PRX', 'Charles Town': 'CT', 'Penn National': 'PEN', 'Canterbury Park': 'CBY',
  'Prairie Meadows': 'PRM', 'Lone Star Park': 'LS', 'Hawthorne': 'HAW',
  'DEL': 'DEL', 'Delaware Park': 'DEL', 'IND': 'IND', 'Horseshoe Indianapolis': 'IND',
  'CBY': 'CBY', 'EMD': 'EMD', 'Emerald Downs': 'EMD', 'ALB': 'ALB', 'WYO': 'WYO',
  'LS': 'LS', 'PRM': 'PRM',
};

function normalizeExoticPayout(payoffAmount: number, ticketsBet: number, targetBase: number) {
  if (!payoffAmount) return null;
  const baseDollars = (ticketsBet && ticketsBet > 0) ? ticketsBet / 100 : targetBase;
  return (payoffAmount / baseDollars) * targetBase;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const decoded: any = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    const { rows: userRows } = await query('SELECT email FROM users WHERE id = $1', [decoded.userId]);
    if (!userRows.length || userRows[0].email !== 'mwmartone@gmail.com') {
      return res.status(403).json({ error: 'Admin only' });
    }
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { race_id } = req.query;
  if (!race_id) return res.status(400).json({ error: 'race_id required' });

  try {
    const { rows: raceRows } = await query(
      'SELECT id, track, date, race_number FROM races WHERE id = $1', [race_id]
    );
    if (!raceRows.length) return res.status(404).json({ error: 'Race not found' });

    const race = raceRows[0];
    const dateStr = typeof race.date === 'string' ? race.date.split('T')[0] : race.date.toISOString().split('T')[0];
    const trackId = TRACK_IDS[race.track];
    if (!trackId) return res.status(400).json({ error: `Unknown track: ${race.track}` });

    const auth = 'Basic ' + Buffer.from(`${API_USER}:${API_PASS}`).toString('base64');

    const meetsRes = await fetch(`${BASE_URL}/meets?start_date=${dateStr}&end_date=${dateStr}`, {
      headers: { 'Authorization': auth }
    });
    if (!meetsRes.ok) return res.status(502).json({ error: 'Racing API meets failed' });

    const meetsData = await meetsRes.json();
    const meet = (meetsData.meets || []).find((m: any) => m.track_id === trackId);
    if (!meet) return res.status(404).json({ error: `No meet found for ${trackId} on ${dateStr}` });

    const resultsRes = await fetch(`${BASE_URL}/meets/${meet.meet_id}/results`, {
      headers: { 'Authorization': auth }
    });
    if (!resultsRes.ok) return res.status(502).json({ error: 'Racing API results failed' });

    const resultsData = await resultsRes.json();
    const raceResult = (resultsData.races || []).find(
      (r: any) => parseInt(r.race_key?.race_number) === race.race_number
    );

    if (!raceResult) return res.status(200).json({ error: 'Results not yet available for this race' });

    const runners = raceResult.runners || [];
    if (runners.length < 3) return res.status(200).json({ error: 'Incomplete results (fewer than 3 finishers)' });

    const winPP = parseInt(runners[0].program_number);
    const placePP = parseInt(runners[1].program_number);
    const showPP = parseInt(runners[2].program_number);

    const lookupEntry = async (pp: number) => {
      const { rows } = await query(
        'SELECT id FROM entries WHERE race_id = $1 AND post_position = $2', [race_id, pp]
      );
      return rows.length ? rows[0].id : null;
    };

    const winEntryId = await lookupEntry(winPP);
    const placeEntryId = await lookupEntry(placePP);
    const showEntryId = await lookupEntry(showPP);

    if (!winEntryId || !placeEntryId || !showEntryId) {
      return res.status(200).json({ error: `Could not match entries for PP ${winPP}-${placePP}-${showPP}` });
    }

    const winPayout = runners[0].win_payoff ? parseFloat(runners[0].win_payoff) : null;

    const payoffs = raceResult.payoffs || [];
    let exactaPayout = null;
    let trifectaPayout = null;
    let superfectaPayout = null;

    for (const p of payoffs) {
      const wager = (p.wager_name || '').toLowerCase();
      const tickets = parseInt(p.number_of_tickets_bet) || 0;
      if (wager.includes('exacta')) {
        exactaPayout = normalizeExoticPayout(parseFloat(p.payoff_amount), tickets, 1);
      } else if (wager.includes('trifecta')) {
        trifectaPayout = normalizeExoticPayout(parseFloat(p.payoff_amount), tickets, 1);
      } else if (wager.includes('superfecta')) {
        superfectaPayout = normalizeExoticPayout(parseFloat(p.payoff_amount), tickets, 0.10);
      }
    }

    // Our win pick's PLACE/SHOW payoff (per $2) for the place bet on the win pick
    let placePayout = null, showPayout = null;
    const { rows: pickRows } = await query(
      `SELECT entries_used FROM bets WHERE race_id = $1 AND bet_type IN ('win','place') LIMIT 1`, [race_id]
    );
    if (pickRows[0]?.entries_used?.length) {
      const pickPP = parseInt(String(pickRows[0].entries_used[0]).replace(/^#/, '').split(' ')[0]);
      const pickRunner = runners.find((r: any) => parseInt(r.program_number) === pickPP);
      placePayout = pickRunner?.place_payoff ? parseFloat(pickRunner.place_payoff) : null;
      showPayout = pickRunner?.show_payoff ? parseFloat(pickRunner.show_payoff) : null;
    }

    await query(
      `INSERT INTO results (race_id, win_entry_id, place_entry_id, show_entry_id, win_payout, place_payout, show_payout, exacta_payout, trifecta_payout, superfecta_payout, settled_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       ON CONFLICT (race_id) DO UPDATE SET
         win_entry_id = EXCLUDED.win_entry_id, place_entry_id = EXCLUDED.place_entry_id,
         show_entry_id = EXCLUDED.show_entry_id, win_payout = EXCLUDED.win_payout,
         place_payout = EXCLUDED.place_payout, show_payout = EXCLUDED.show_payout,
         exacta_payout = EXCLUDED.exacta_payout, trifecta_payout = EXCLUDED.trifecta_payout,
         superfecta_payout = EXCLUDED.superfecta_payout, settled_at = NOW()`,
      [race_id, winEntryId, placeEntryId, showEntryId, winPayout, placePayout, showPayout, exactaPayout, trifectaPayout, superfectaPayout]
    );

    const { rows: resultRows } = await query(
      `SELECT r.id, r.race_id, r.win_payout, r.place_payout, r.show_payout, r.exacta_payout, r.trifecta_payout, r.superfecta_payout, r.settled_at,
              hw.name AS win_horse, ew.post_position AS win_pp,
              hp.name AS place_horse, ep.post_position AS place_pp,
              hs.name AS show_horse, es.post_position AS show_pp
       FROM results r
       LEFT JOIN entries ew ON ew.id = r.win_entry_id LEFT JOIN horses hw ON hw.id = ew.horse_id
       LEFT JOIN entries ep ON ep.id = r.place_entry_id LEFT JOIN horses hp ON hp.id = ep.horse_id
       LEFT JOIN entries es ON es.id = r.show_entry_id LEFT JOIN horses hs ON hs.id = es.horse_id
       WHERE r.race_id = $1`, [race_id]
    );

    return res.status(200).json({ results: resultRows[0] || null });
  } catch (err: any) {
    console.error('fetch-results error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
