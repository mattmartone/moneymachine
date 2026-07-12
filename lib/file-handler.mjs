import { pool, query } from './db.mjs';
import { notify } from './notify.mjs';
import { writeFileSync, mkdirSync, readFileSync, readdirSync } from 'fs';
import { execSync } from 'child_process';

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
      date, track: s(f, 125 + i),
      distance: yardsToDistance(s(f, 315 + i)), distance_yards: n(f, 315 + i),
      surface_condition: s(f, 149 + i), track_type: s(f, 161 + i),
      field_size: n(f, 355 + i), pos_1st_call: s(f, 575 + i),
      pos_finish: s(f, 615 + i), beyer: n(f, 765 + i),
      odds: d(f, 515 + i),
    });
  }
  return pps;
}

async function parseDRFContent(content) {
  const lines = content.split('\n').filter(l => l.trim());
  if (!lines.length) return { races: 0, entries: 0 };

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
    const horseName = s(f, 44);
    const sire = s(f, 51);
    const dam = s(f, 53);
    const weight = n(f, 50);
    const owner = s(f, 37);
    const runStyle = s(f, 209);

    const date = formatDate(dateStr);
    const raceKey = `${trackCode}-${date}-${raceNum}`;
    const trackName = trackLookup[trackCode] || trackCode;

    if (!races.has(raceKey)) {
      races.set(raceKey, { track: trackName, date, race_number: raceNum, conditions, distance: yardsToDistance(distYards), surface: surfaceName(surfCode), purse, field_size: fieldSize });
    }

    const pps = buildPPs(f);
    const bestBeyer = pps.reduce((best, pp) => pp.beyer && pp.beyer > (best || 0) ? pp.beyer : best, null);
    const lastBeyer = pps.length > 0 ? pps[0].beyer : null;
    const daysSince = pps.length > 0 && pps[0].date ? Math.floor((new Date(date) - new Date(pps[0].date)) / 86400000) : null;

    allEntries.push({
      raceKey, horse_name: horseName, post_position: post,
      jockey: jockeyName, trainer: trainerName, sire, dam, owner, weight,
      morning_line_odds: null,
      running_style: ['E', 'E/P', 'P', 'S'].includes(runStyle) ? runStyle : null,
      best_beyer: bestBeyer, last_beyer: lastBeyer, days_since_last: daysSince,
      past_performances: pps, stats: { trainer: { name: trainerName }, jockey: { name: jockeyName } }
    });
  }

  // Force reload if exists
  const firstEntry = allEntries[0];
  if (firstEntry) {
    const trackName = races.get(firstEntry.raceKey).track;
    const dateVal = races.get(firstEntry.raceKey).date;
    const existing = await query('SELECT id FROM races WHERE track = $1 AND date = $2', [trackName, dateVal]);
    if (existing.length > 0) {
      const ids = existing.map(r => r.id);
      await pool.query('DELETE FROM entries WHERE race_id = ANY($1)', [ids]);
      await pool.query('DELETE FROM races WHERE id = ANY($1)', [ids]);
    }
  }

  const raceIdMap = new Map();
  for (const [key, race] of races) {
    const res = await pool.query(
      'INSERT INTO races (track, date, race_number, conditions, distance, surface, purse, field_size) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
      [race.track, race.date, race.race_number, race.conditions, race.distance, race.surface, race.purse, race.field_size]
    );
    raceIdMap.set(key, res.rows[0].id);
  }

  let count = 0;
  for (const entry of allEntries) {
    const raceId = raceIdMap.get(entry.raceKey);
    if (!raceId || !entry.horse_name) continue;
    const horseRes = await pool.query(
      'INSERT INTO horses (name, sire, dam) VALUES ($1,$2,$3) ON CONFLICT (name) DO UPDATE SET sire = COALESCE(EXCLUDED.sire, horses.sire), dam = COALESCE(EXCLUDED.dam, horses.dam) RETURNING id',
      [entry.horse_name, entry.sire, entry.dam]
    );
    await pool.query(
      `INSERT INTO entries (race_id, horse_id, post_position, morning_line_odds, jockey, trainer, weight, owner, running_style, best_beyer, last_beyer, days_since_last, lifetime_earnings, past_performances, stats)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT (race_id, horse_id) DO UPDATE SET past_performances = EXCLUDED.past_performances, stats = EXCLUDED.stats, running_style = EXCLUDED.running_style, best_beyer = EXCLUDED.best_beyer, last_beyer = EXCLUDED.last_beyer, days_since_last = EXCLUDED.days_since_last`,
      [raceId, horseRes.rows[0].id, entry.post_position, entry.morning_line_odds, entry.jockey, entry.trainer, entry.weight, entry.owner, entry.running_style, entry.best_beyer, entry.last_beyer, entry.days_since_last, null, JSON.stringify(entry.past_performances), JSON.stringify(entry.stats)]
    );
    count++;
  }

  return { races: races.size, entries: count };
}

export async function handleSlackFiles(files) {
  const token = process.env.SLACK_BOT_TOKEN;
  let totalRaces = 0, totalEntries = 0;

  mkdirSync('/tmp/ftc-uploads', { recursive: true });

  for (const file of files) {
    const url = file.url_private_download || file.url_private;
    if (!url) continue;

    // Download file from Slack
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    const buffer = Buffer.from(await res.arrayBuffer());
    const filename = file.name || 'unknown.zip';
    const filepath = `/tmp/ftc-uploads/${filename}`;
    writeFileSync(filepath, buffer);

    if (filename.endsWith('.zip')) {
      // Unzip
      const dir = `/tmp/ftc-uploads/${filename.replace('.zip', '')}`;
      mkdirSync(dir, { recursive: true });
      execSync(`unzip -o "${filepath}" -d "${dir}"`);
      const drfFiles = readdirSync(dir).filter(f => f.endsWith('.DRF'));
      for (const drf of drfFiles) {
        const content = readFileSync(`${dir}/${drf}`, 'utf-8');
        const result = await parseDRFContent(content);
        totalRaces += result.races;
        totalEntries += result.entries;
      }
    } else if (filename.endsWith('.DRF')) {
      const content = readFileSync(filepath, 'utf-8');
      const result = await parseDRFContent(content);
      totalRaces += result.races;
      totalEntries += result.entries;
    }
  }

  return { totalRaces, totalEntries };
}
