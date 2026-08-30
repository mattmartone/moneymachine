import pg from 'pg';
const { Pool } = pg;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 3000,
});

const API_USER = 'Vy3tbvnI66ZOQKUBdokAI7FY';
const API_PASS = 'mkuaEi2qrgZpraYMoLj3a6fg';
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

let TRACK_NAMES = {};
async function loadTrackNames() {
  const { rows } = await pool.query('SELECT alias, canonical_name FROM track_aliases');
  TRACK_NAMES = Object.fromEntries(rows.map(r => [r.alias, r.canonical_name]));
}

async function run() {
  await loadTrackNames();
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
        const d = new Date(parseInt(race.post_time_long, 10));
        if (!isNaN(d.getTime())) {
          const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(d);
          const h = parts.find(p => p.type === 'hour')?.value || '0';
          const m = parts.find(p => p.type === 'minute')?.value || '0';
          postTime = `${h.padStart(2, '0')}:${m.padStart(2, '0')}:00`;
        }
      }
      if (postTime && postTime.includes('NaN')) postTime = null;
      const fieldSize = race.runners?.length || null;
      const conditions = race.race_class || race.race_type_description || null;
      const rawPurse = parseInt(race.purse);
      const purse = isNaN(rawPurse) ? null : rawPurse;

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

      // Upsert runners (include scratches — they show as scratched in the field)
      for (const runner of (race.runners || [])) {
        const isScratched = runner.scratch_indicator === 'Y';

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

        const rawPostPos = parseInt(runner.post_pos);
        const postPos = isNaN(rawPostPos) ? null : rawPostPos;
        const ml = parseOdds(runner.morning_line_odds);
        const liveOdds = parseOdds(runner.live_odds);
        const jockey = runner.jockey?.alias || [runner.jockey?.last_name, runner.jockey?.first_name_initial].filter(Boolean).join(' ') || null;
        const trainer = runner.trainer?.alias || [runner.trainer?.last_name, runner.trainer?.first_name_initial].filter(Boolean).join(' ') || null;
        const rawWeight = parseInt(runner.weight);
        const weight = isNaN(rawWeight) ? null : rawWeight;

        await pool.query(
          `INSERT INTO entries (race_id, horse_id, post_position, morning_line_odds, live_odds, jockey, trainer, weight, scratched)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (race_id, horse_id) DO UPDATE SET
             morning_line_odds = COALESCE(EXCLUDED.morning_line_odds, entries.morning_line_odds),
             live_odds = COALESCE(EXCLUDED.live_odds, entries.live_odds),
             jockey = COALESCE(EXCLUDED.jockey, entries.jockey),
             trainer = COALESCE(EXCLUDED.trainer, entries.trainer),
             post_position = COALESCE(EXCLUDED.post_position, entries.post_position),
             scratched = EXCLUDED.scratched`,
          [raceId, horseId, postPos, ml, liveOdds, jockey, trainer, weight, isScratched]
        );
      }

      console.log(`  R${raceNum}: ${conditions} (${distance} ${surface}) — ${fieldSize} runners`);
    }
  }

  console.log('\nDone!');
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
