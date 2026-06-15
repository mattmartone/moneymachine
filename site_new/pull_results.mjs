import pg from 'pg';
const { Pool } = pg;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const pool = new Pool({
  connectionString: 'postgres://postgres.bazvhjajajkpkqqvyelg:Cbl49UHWAQNJ8Lyf@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: true
});

const API_USER = 'DPoVaGs2XRopMmiHUcJDkHtC';
const API_PASS = 'YQJDPUITg7LCEP0Ascpu5t1S';
const BASE_URL = 'https://api.theracingapi.com/v1/north-america';

async function apiFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Authorization': 'Basic ' + Buffer.from(`${API_USER}:${API_PASS}`).toString('base64') }
  });
  if (!res.ok) {
    console.error(`API ${res.status}: ${path}`);
    return null;
  }
  return res.json();
}

const TRACK_NAMES = {
  'SA':'Santa Anita', 'LRL':'Laurel Park', 'SAR':'Saratoga', 'CD':'Churchill Downs',
  'DMR':'Del Mar', 'GP':'Gulfstream Park', 'AQU':'Aqueduct', 'BEL':'Belmont',
  'BAQ':'Belmont at the Big A', 'KEE':'Keeneland', 'PIM':'Pimlico', 'MTH':'Monmouth Park',
  'WO':'Woodbine', 'OP':'Oaklawn Park', 'TAM':'Tampa Bay', 'FG':'Fair Grounds',
  'PRX':'Parx Racing', 'CT':'Charles Town', 'PEN':'Penn National', 'TUP':'Turf Paradise',
  'GG':'Golden Gate', 'LA':'Los Alamitos', 'LS':'Lone Star Park', 'DEL':'Delaware Park',
  'CBY':'Canterbury Park', 'IND':'Horseshoe Indianapolis', 'BTP':'Belterra Park',
  'DED':'Delta Downs', 'EVD':'Evangeline Downs', 'HAW':'Hawthorne', 'TDN':'Thistledown',
  'HOU':'Sam Houston', 'FMT':'Fair Meadows', 'FL':'Finger Lakes', 'PID':'Presque Isle Downs',
  'MNR':'Mountaineer Park', 'PRM':'Prairie Meadows', 'ARP':'Arapahoe Park', 'ALB':'Albuquerque',
  'LEG':'Legacy Downs', 'LAD':'Louisiana Downs'
};

function normalizeExoticPayout(payoffAmount, ticketsBet, targetBase) {
  if (!payoffAmount) return null;
  const baseDollars = (ticketsBet && ticketsBet > 0) ? ticketsBet / 100 : targetBase;
  return (payoffAmount / baseDollars) * targetBase;
}

async function run() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const positional = args.filter(a => !a.startsWith('--'));
  const date = positional[0] || new Date().toISOString().split('T')[0];
  const trackFilter = positional[1] ? positional[1].split(',') : null;

  console.log(`Pulling results for ${date}...`);

  const meetsData = await apiFetch(`/meets?start_date=${date}&end_date=${date}`);
  let meets = meetsData?.meets || [];

  if (trackFilter) {
    meets = meets.filter(m => trackFilter.includes(m.track_id));
  }

  meets = meets.filter(m => !['CCP', 'SWA'].includes(m.track_id));
  console.log(`${meets.length} tracks to check`);

  let inserted = 0;
  let skipped = 0;

  for (const meet of meets) {
    const trackName = TRACK_NAMES[meet.track_id] || meet.track_name;
    console.log(`\n${trackName} (${meet.track_id})...`);

    const resultsData = await apiFetch(`/meets/${meet.meet_id}/results`);
    if (!resultsData) { console.log('  No results available'); continue; }

    const races = resultsData.races || [];

    for (const race of races) {
      const raceNum = parseInt(race.race_key?.race_number);
      if (!raceNum) continue;

      // Find race_id in our DB
      const raceRow = await pool.query(
        `SELECT id FROM races WHERE track = $1 AND date = $2 AND race_number = $3`,
        [trackName, date, raceNum]
      );
      if (raceRow.rows.length === 0) { continue; }
      const raceId = raceRow.rows[0].id;

      // Check if already settled (skip unless --force)
      const existing = await pool.query(`SELECT id FROM results WHERE race_id = $1`, [raceId]);
      if (existing.rows.length > 0 && !force) { skipped++; continue; }

      // Get top 4 finishers from runners array
      const runners = race.runners || [];
      if (runners.length < 3) { continue; }

      const winner = runners[0];
      const placer = runners[1];
      const shower = runners[2];
      const fourth = runners[3] || null;

      // Match to entry_ids by post position
      const winPP = parseInt(winner.program_number);
      const placePP = parseInt(placer.program_number);
      const showPP = parseInt(shower.program_number);
      const fourthPP = fourth ? parseInt(fourth.program_number) : null;

      const winEntry = await pool.query(
        `SELECT id FROM entries WHERE race_id = $1 AND post_position = $2`, [raceId, winPP]
      );
      const placeEntry = await pool.query(
        `SELECT id FROM entries WHERE race_id = $1 AND post_position = $2`, [raceId, placePP]
      );
      const showEntry = await pool.query(
        `SELECT id FROM entries WHERE race_id = $1 AND post_position = $2`, [raceId, showPP]
      );
      const fourthEntry = fourthPP ? await pool.query(
        `SELECT id FROM entries WHERE race_id = $1 AND post_position = $2`, [raceId, fourthPP]
      ) : { rows: [null] };

      if (!winEntry.rows[0] || !placeEntry.rows[0] || !showEntry.rows[0]) {
        console.log(`  R${raceNum}: couldn't match entries, skipping`);
        continue;
      }

      // Win payout (per $2)
      const winPayout = winner.win_payoff ? parseFloat(winner.win_payoff) : null;

      // Exotic payouts from payoffs array
      const payoffs = race.payoffs || [];
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

      const fourthEntryId = fourthEntry.rows[0]?.id || null;

      await pool.query(
        `INSERT INTO results (race_id, win_entry_id, place_entry_id, show_entry_id, fourth_entry_id, win_payout, exacta_payout, trifecta_payout, superfecta_payout, settled_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         ON CONFLICT (race_id) DO UPDATE SET
           win_entry_id = EXCLUDED.win_entry_id, place_entry_id = EXCLUDED.place_entry_id,
           show_entry_id = EXCLUDED.show_entry_id, fourth_entry_id = EXCLUDED.fourth_entry_id,
           win_payout = EXCLUDED.win_payout, exacta_payout = EXCLUDED.exacta_payout,
           trifecta_payout = EXCLUDED.trifecta_payout, superfecta_payout = EXCLUDED.superfecta_payout,
           settled_at = NOW()`,
        [raceId, winEntry.rows[0].id, placeEntry.rows[0].id, showEntry.rows[0].id, fourthEntryId, winPayout, exactaPayout, trifectaPayout, superfectaPayout]
      );

      console.log(`  R${raceNum}: ✅ PP${winPP}-PP${placePP}-PP${showPP} | Win $${winPayout || '?'} | Ex $${exactaPayout?.toFixed(2) || '?'} | Tri $${trifectaPayout?.toFixed(2) || '?'} | Super $${superfectaPayout?.toFixed(2) || '?'}`);
      inserted++;
    }
  }

  console.log(`\nDone! ${inserted} results inserted, ${skipped} already settled.`);
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
