import { pool, query } from './db.mjs';

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

function surfaceName(code) {
  return code === 'T' ? 'Turf' : code === 'D' ? 'Dirt' : code === 'S' ? 'Synthetic' : code || null;
}

function buildPPs(f) {
  const pps = [];
  for (let i = 0; i < 10; i++) {
    const date = formatDate(s(f, 101 + i));
    if (!date) continue;
    pps.push({
      date,
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
  return pps;
}

export async function parseDRF(fileContent, filename) {
  const lines = fileContent.split('\n').filter(l => l.trim());
  if (!lines.length) return { races: 0, entries: 0, error: null };

  const aliasRows = await query('SELECT alias, canonical_name FROM track_aliases');
  const trackLookup = Object.fromEntries(aliasRows.map(r => [r.alias, r.canonical_name]));

  const races = new Map();
  const allEntries = [];

  for (const line of lines) {
    const f = parseLine(line);
    const trackCode = s(f, 0);
    const dateStr = s(f, 1);
    const raceNum = n(f, 2);
    const post = n(f, 3);
    const distYards = s(f, 5);
    const surfCode = s(f, 6);
    const conditions = s(f, 10);
    const purse = n(f, 11);
    const fieldSize = n(f, 23);
    const trainerName = s(f, 27);
    const jockeyName = s(f, 32);
    const owner = s(f, 37);
    const horseName = s(f, 44);
    const sire = s(f, 51);
    const dam = s(f, 53);
    const weight = n(f, 50);
    const runStyle = s(f, 209);

    const date = formatDate(dateStr);
    const raceKey = `${trackCode}-${date}-${raceNum}`;
    const trackName = trackLookup[trackCode] || trackCode;

    if (!races.has(raceKey)) {
      races.set(raceKey, {
        track: trackName, date, race_number: raceNum,
        conditions, distance: yardsToDistance(distYards),
        surface: surfaceName(surfCode), purse, field_size: fieldSize
      });
    }

    const pps = buildPPs(f);
    const bestBeyer = pps.reduce((best, pp) => pp.beyer && pp.beyer > (best || 0) ? pp.beyer : best, null);
    const lastBeyer = pps.length > 0 ? pps[0].beyer : null;
    const daysSince = pps.length > 0 && pps[0].date ? Math.floor((new Date(date) - new Date(pps[0].date)) / 86400000) : null;

    const stats = {
      trainer: { name: trainerName },
      jockey: { name: jockeyName },
    };

    allEntries.push({
      raceKey, horse_name: horseName, post_position: post,
      jockey: jockeyName, trainer: trainerName, sire, dam,
      owner, weight, morning_line_odds: null,
      running_style: ['E', 'E/P', 'P', 'S'].includes(runStyle) ? runStyle : null,
      best_beyer: bestBeyer, last_beyer: lastBeyer, days_since_last: daysSince,
      past_performances: pps, stats
    });
  }

  // Check for existing data
  const firstEntry = allEntries[0];
  if (firstEntry) {
    const trackName = races.get(firstEntry.raceKey).track;
    const dateVal = races.get(firstEntry.raceKey).date;
    const existing = await query(`SELECT id, race_number FROM races WHERE track = $1 AND date = $2`, [trackName, dateVal]);
    if (existing.length > 0) {
      const ids = existing.map(r => r.id);
      await pool.query(`DELETE FROM entries WHERE race_id = ANY($1)`, [ids]);
      await pool.query(`DELETE FROM races WHERE id = ANY($1)`, [ids]);
    }
  }

  // Insert races
  const raceIdMap = new Map();
  for (const [key, race] of races) {
    const res = await pool.query(
      `INSERT INTO races (track, date, race_number, conditions, distance, surface, purse, field_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [race.track, race.date, race.race_number, race.conditions, race.distance, race.surface, race.purse, race.field_size]
    );
    raceIdMap.set(key, res.rows[0].id);
  }

  // Insert entries
  let count = 0;
  for (const entry of allEntries) {
    const raceId = raceIdMap.get(entry.raceKey);
    if (!raceId || !entry.horse_name) continue;

    const horseRes = await pool.query(
      `INSERT INTO horses (name, sire, dam) VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE SET sire = COALESCE(EXCLUDED.sire, horses.sire), dam = COALESCE(EXCLUDED.dam, horses.dam)
       RETURNING id`,
      [entry.horse_name, entry.sire, entry.dam]
    );
    const horseId = horseRes.rows[0].id;

    await pool.query(
      `INSERT INTO entries (race_id, horse_id, post_position, morning_line_odds, jockey, trainer, weight, owner, running_style, best_beyer, last_beyer, days_since_last, lifetime_earnings, past_performances, stats)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (race_id, horse_id) DO UPDATE SET
         past_performances = EXCLUDED.past_performances,
         stats = EXCLUDED.stats,
         running_style = EXCLUDED.running_style,
         best_beyer = EXCLUDED.best_beyer,
         last_beyer = EXCLUDED.last_beyer,
         days_since_last = EXCLUDED.days_since_last`,
      [raceId, horseId, entry.post_position, entry.morning_line_odds, entry.jockey, entry.trainer,
       entry.weight, entry.owner, entry.running_style, entry.best_beyer, entry.last_beyer,
       entry.days_since_last, null,
       JSON.stringify(entry.past_performances),
       JSON.stringify(entry.stats)]
    );
    count++;
  }

  const trackName = races.size > 0 ? [...races.values()][0].track : filename;
  const dateVal = races.size > 0 ? [...races.values()][0].date : 'unknown';

  return { races: races.size, entries: count, track: trackName, date: dateVal };
}
