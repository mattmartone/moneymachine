import { readFileSync } from 'fs';
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

function s(fields, i) { return (fields[i] || '').trim() || null; }
function n(fields, i) { const v = parseInt(fields[i]); return isNaN(v) ? null : v; }
function d(fields, i) { const v = parseFloat(fields[i]); return isNaN(v) ? null : v; }
function formatDate(raw) { return raw && raw.length === 8 ? `${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}` : null; }
function yardsToDistance(yards) {
  const y = parseInt(yards);
  if (!y) return null;
  const map = { 880:'4 Fur', 1100:'5 Fur', 1210:'5.5 Fur', 1320:'6 Fur', 1430:'6.5 Fur',
    1540:'7 Fur', 1650:'7.5 Fur', 1760:'1 Mile', 1870:'8.5 Fur', 1980:'1-1/8 Mi',
    2200:'1-1/4 Mi', 2420:'1-3/8 Mi', 2640:'1-1/2 Mi' };
  return map[y] || `${(y/220).toFixed(1)}f`;
}

const { rows: aliases } = await pool.query('SELECT alias, canonical_name FROM track_aliases');
const trackLookup = Object.fromEntries(aliases.map(r => [r.alias, r.canonical_name]));

const files = process.argv.slice(2);
if (!files.length) { console.error('Usage: node scripts/reparse_distances.mjs <file1.DRF> [file2.DRF ...]'); process.exit(1); }

let updated = 0, skipped = 0;

for (const file of files) {
  const raw = readFileSync(file, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());

  for (const line of lines) {
    const f = parseLine(line);
    const trackCode = s(f, 0);
    const trackName = trackLookup[trackCode] || trackCode;
    const dateStr = s(f, 1);
    const date = formatDate(dateStr);
    const raceNum = n(f, 2);
    const pp = n(f, 3);

    const pps = [];
    for (let i = 0; i < 10; i++) {
      const ppDate = formatDate(s(f, 101 + i));
      if (!ppDate) continue;
      pps.push({
        date: ppDate,
        track: s(f, 125 + i),
        distance: yardsToDistance(s(f, 315 + i)),
        distance_yards: n(f, 315 + i),
        surface_condition: s(f, 149 + i),
        track_type: s(f, 161 + i),
        inner_outer: s(f, 173 + i),
        final_time: d(f, 113 + i),
        field_size: n(f, 355 + i),
        post_drawn: s(f, 565 + i),
        pos_1st_call: s(f, 575 + i),
        pos_2nd_call: s(f, 585 + i),
        pos_far_turn: s(f, 595 + i),
        pos_stretch: s(f, 605 + i),
        pos_finish: s(f, 615 + i),
        beaten_lengths_finish: d(f, 465 + i),
        odds: d(f, 515 + i),
        beyer: n(f, 765 + i),
        beyer_variant: n(f, 775 + i),
        class: s(f, 535 + i),
        claiming_price: n(f, 545 + i),
        purse: n(f, 555 + i),
        weight: n(f, 435 + i),
        comment: s(f, 395 + i),
        winner: s(f, 405 + i),
        second: s(f, 415 + i),
        third: s(f, 425 + i),
      });
    }

    const res = await pool.query(
      `UPDATE entries SET past_performances = $1
       WHERE race_id = (SELECT id FROM races WHERE track = $2 AND date = $3 AND race_number = $4)
       AND post_position = $5`,
      [JSON.stringify(pps), trackName, date, raceNum, pp]
    );
    if (res.rowCount > 0) updated++;
    else skipped++;
  }
  console.log(`${file.split('/').pop()}: done`);
}

console.log(`\nUpdated ${updated} entries, ${skipped} skipped (no match)`);
await pool.end();
