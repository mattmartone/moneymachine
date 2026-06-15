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
  return res.json();
}

function parseOdds(oddsStr) {
  if (!oddsStr || oddsStr === 'None') return null;
  return oddsStr;
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

async function run() {
  const date = process.argv[2] || new Date().toISOString().split('T')[0];
  const trackFilter = process.argv[3] ? process.argv[3].split(',') : null;

  console.log(`Pulling Racing API data for ${date}...`);

  const meetsData = await apiFetch(`/meets?start_date=${date}&end_date=${date}`);
  let meets = meetsData.meets || [];

  if (trackFilter) {
    meets = meets.filter(m => trackFilter.includes(m.track_id));
  }

  // Skip synthetic/pick type meets
  meets = meets.filter(m => !['CCP', 'SWA'].includes(m.track_id));

  console.log(`${meets.length} tracks to load`);

  for (const meet of meets) {
    const trackName = TRACK_NAMES[meet.track_id] || meet.track_name;
    console.log(`\n${trackName} (${meet.track_id})...`);

    const entriesData = await apiFetch(`/meets/${meet.meet_id}/entries`);
    const races = entriesData.races || [];

    for (const race of races) {
      const raceNum = parseInt(race.race_key.race_number);
      const distance = race.distance_description || null;
      const surface = race.course_type === 'D' ? 'Dirt' : race.course_type === 'T' ? 'Turf' : race.course_type || null;
      let postTime = race.post_time || null;
      if (!postTime && race.post_time_long) {
        const d = new Date(race.post_time_long);
        const et = new Date(d.toLocaleString('en-US', { timeZone: 'America/New_York' }));
        postTime = `${String(et.getHours()).padStart(2, '0')}:${String(et.getMinutes()).padStart(2, '0')}:00`;
      }
      const fieldSize = race.runners?.length || 0;
      const conditions = race.race_class || race.race_type_description || null;
      const purse = race.purse || null;

      // Upsert race
      const raceRes = await pool.query(
        `INSERT INTO races (track, date, race_number, conditions, distance, surface, purse, field_size, post_time)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::time)
         ON CONFLICT (track, date, race_number) DO UPDATE SET
           post_time = COALESCE(EXCLUDED.post_time, races.post_time),
           field_size = EXCLUDED.field_size,
           conditions = COALESCE(EXCLUDED.conditions, races.conditions)
         RETURNING id`,
        [trackName, date, raceNum, conditions, distance, surface, purse, fieldSize, postTime]
      );
      const raceId = raceRes.rows[0].id;

      // Upsert runners
      for (const runner of (race.runners || [])) {
        if (runner.scratch_indicator === 'Y') continue;

        const horseName = runner.horse_name?.toUpperCase();
        if (!horseName) continue;

        const sire = runner.sire_name || null;
        const dam = runner.dam_name || null;

        // Upsert horse
        const horseRes = await pool.query(
          `INSERT INTO horses (name, sire, dam) VALUES ($1, $2, $3)
           ON CONFLICT (name) DO UPDATE SET sire = COALESCE(EXCLUDED.sire, horses.sire), dam = COALESCE(EXCLUDED.dam, horses.dam)
           RETURNING id`,
          [horseName, sire, dam]
        );
        const horseId = horseRes.rows[0].id;

        const postPos = parseInt(runner.post_pos) || null;
        const ml = parseOdds(runner.morning_line_odds);
        const liveOdds = parseOdds(runner.live_odds);
        const jockey = runner.jockey?.alias || [runner.jockey?.last_name, runner.jockey?.first_name_initial].filter(Boolean).join(' ') || null;
        const trainer = runner.trainer?.alias || [runner.trainer?.last_name, runner.trainer?.first_name_initial].filter(Boolean).join(' ') || null;
        const weight = parseInt(runner.weight) || null;

        await pool.query(
          `INSERT INTO entries (race_id, horse_id, post_position, morning_line_odds, live_odds, jockey, trainer, weight)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (race_id, horse_id) DO UPDATE SET
             morning_line_odds = COALESCE(EXCLUDED.morning_line_odds, entries.morning_line_odds),
             live_odds = COALESCE(EXCLUDED.live_odds, entries.live_odds),
             jockey = COALESCE(EXCLUDED.jockey, entries.jockey),
             trainer = COALESCE(EXCLUDED.trainer, entries.trainer),
             post_position = COALESCE(EXCLUDED.post_position, entries.post_position)`,
          [raceId, horseId, postPos, ml, liveOdds, jockey, trainer, weight]
        );
      }

      console.log(`  R${raceNum}: ${conditions} (${distance} ${surface}) — ${fieldSize} runners`);
    }
  }

  console.log('\nDone!');
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
