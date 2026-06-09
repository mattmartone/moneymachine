import { readFileSync } from 'fs';
import pg from 'pg';
const { Pool } = pg;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const pool = new Pool({
  connectionString: 'postgres://postgres.bazvhjajajkpkqqvyelg:Cbl49UHWAQNJ8Lyf@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: true
});

const file = process.argv[2];
if (!file) { console.error('Usage: node parse_drf.mjs <file.DRF>'); process.exit(1); }

const raw = readFileSync(file, 'utf-8');
const lines = raw.split('\n').filter(l => l.trim());

function parseLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { fields.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  fields.push(current.trim());
  return fields;
}

function yardsToDistance(yards) {
  const y = parseInt(yards);
  if (!y) return null;
  const furlongs = y / 220;
  if (furlongs === 6) return '6 Fur';
  if (furlongs === 6.5) return '6.5 Fur';
  if (furlongs === 7) return '7 Fur';
  if (y === 1760) return '1 Mile';
  if (y === 1980) return '1-1/8 Mi';
  if (y === 2200) return '1-1/4 Mi';
  if (y === 2640) return '1-1/2 Mi';
  if (y === 1320) return '6 Fur';
  if (y === 1430) return '6.5 Fur';
  if (y === 1100) return '5 Fur';
  if (y === 1210) return '5.5 Fur';
  if (y === 880) return '4 Fur';
  if (y === 1650) return '7.5 Fur';
  return `${furlongs}f`;
}

function surfaceName(code) {
  if (code === 'T') return 'Turf';
  if (code === 'D') return 'Dirt';
  return code || null;
}

async function run() {
  const races = new Map();
  const entries = [];

  for (const line of lines) {
    const f = parseLine(line);
    const track = (f[0] || '').trim();
    const dateStr = (f[1] || '').trim();
    const raceNum = parseInt(f[2]);
    const post = parseInt(f[3]);
    const distYards = f[5];
    const surfCode = (f[6] || '').trim();
    const conditions = (f[10] || '').trim();
    const purse = parseInt(f[11]) || null;
    const fieldSize = parseInt(f[23]) || null;
    const trainer = (f[27] || '').trim();
    const jockey = (f[32] || '').trim();
    const horseName = (f[44] || '').trim();
    const sex = (f[48] || '').trim();
    const weight = parseInt(f[50]) || null;
    const sire = (f[51] || '').trim();
    const dam = (f[53] || '').trim();
    const owner = (f[55] || '').trim();

    // Running style is around field 140-ish, look for E, E/P, P, S pattern
    let runStyle = null;
    for (let i = 130; i < 150 && i < f.length; i++) {
      const v = (f[i] || '').trim();
      if (v === 'E' || v === 'E/P' || v === 'P' || v === 'S') { runStyle = v; break; }
    }

    // ML odds - searching for it in the typical brisnet position
    // It's usually around field 108 area or the "morning line" section
    let mlOdds = null;
    // field 108 region typically has the ML
    const mlField = f[108];
    if (mlField && parseFloat(mlField) > 0) {
      mlOdds = mlField;
    }

    const date = `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`;
    const raceKey = `${track}-${date}-${raceNum}`;

    if (!races.has(raceKey)) {
      races.set(raceKey, {
        track: track === 'SA' ? 'Santa Anita' : track,
        date,
        race_number: raceNum,
        conditions,
        distance: yardsToDistance(distYards),
        surface: surfaceName(surfCode),
        purse,
        field_size: fieldSize
      });
    }

    if (horseName) {
      entries.push({
        raceKey,
        horse_name: horseName,
        post_position: post,
        jockey: jockey || null,
        trainer: trainer || null,
        sire: sire || null,
        dam: dam || null,
        owner: owner || null,
        weight,
        morning_line_odds: mlOdds,
        running_style: runStyle
      });
    }
  }

  console.log(`Parsed ${races.size} races, ${entries.length} entries`);

  // Insert races
  const raceIdMap = new Map();
  for (const [key, race] of races) {
    const res = await pool.query(
      `INSERT INTO races (track, date, race_number, conditions, distance, surface, purse, field_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (track, date, race_number) DO UPDATE SET field_size = EXCLUDED.field_size
       RETURNING id`,
      [race.track, race.date, race.race_number, race.conditions, race.distance, race.surface, race.purse, race.field_size]
    );
    raceIdMap.set(key, res.rows[0].id);
    console.log(`  Race ${race.race_number}: ${race.conditions} (${race.distance} ${race.surface}) - ${race.field_size} horses`);
  }

  // Insert horses + entries
  let entryCount = 0;
  for (const entry of entries) {
    const raceId = raceIdMap.get(entry.raceKey);
    if (!raceId) continue;

    // Upsert horse
    const horseRes = await pool.query(
      `INSERT INTO horses (name, sire, dam) VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE SET sire = COALESCE(EXCLUDED.sire, horses.sire), dam = COALESCE(EXCLUDED.dam, horses.dam)
       RETURNING id`,
      [entry.horse_name, entry.sire, entry.dam]
    );
    const horseId = horseRes.rows[0].id;

    // Upsert entry
    await pool.query(
      `INSERT INTO entries (race_id, horse_id, post_position, morning_line_odds, jockey, trainer, weight, owner, running_style)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (race_id, horse_id) DO UPDATE SET
         post_position = EXCLUDED.post_position,
         jockey = EXCLUDED.jockey,
         trainer = EXCLUDED.trainer,
         weight = EXCLUDED.weight,
         running_style = COALESCE(EXCLUDED.running_style, entries.running_style)`,
      [raceId, horseId, entry.post_position, entry.morning_line_odds, entry.jockey, entry.trainer, entry.weight, entry.owner, entry.running_style]
    );
    entryCount++;
  }

  console.log(`\nLoaded ${entryCount} entries into DB`);
  console.log('Done!');
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
