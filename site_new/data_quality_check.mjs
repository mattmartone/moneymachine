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

const date = process.argv[2] || new Date().toISOString().split('T')[0];
const ELIGIBLE_TRACKS = ['Churchill Downs', 'Belmont at the Big A', 'Gulfstream Park', 'Laurel Park', 'Prairie Meadows', 'Monmouth Park', 'Saratoga', 'Del Mar', 'Santa Anita', 'Canterbury Park', 'Delaware Park', 'Colonial Downs', 'Parx Racing', 'Emerald Downs', 'Hawthorne', 'Keeneland', 'Oaklawn Park'];

async function run() {
  const client = await pool.connect();
  const failures = [];
  const warnings = [];

  // --- CHECK 1: Count reconciliation ---
  // Get races for eligible tracks only
  const { rows: trackRaces } = await client.query(`
    SELECT track, COUNT(*) as race_count
    FROM races WHERE date = $1 AND track = ANY($2)
    GROUP BY track ORDER BY track
  `, [date, ELIGIBLE_TRACKS]);

  if (trackRaces.length === 0) {
    failures.push('FATAL: No races found for any eligible track on ' + date);
    report(failures, warnings);
    client.release();
    await pool.end();
    process.exit(1);
  }

  // Check for race number gaps (e.g. races 1-8, 10-11 but no 9)
  for (const tr of trackRaces) {
    const { rows: raceNums } = await client.query(`
      SELECT race_number FROM races
      WHERE date = $1 AND track = $2
      ORDER BY race_number
    `, [date, tr.track]);
    const nums = raceNums.map(r => r.race_number);
    const expected = Array.from({ length: nums[nums.length - 1] - nums[0] + 1 }, (_, i) => nums[0] + i);
    const missing = expected.filter(n => !nums.includes(n));
    if (missing.length > 0) {
      warnings.push(`${tr.track}: Missing race numbers ${missing.join(', ')} (have ${nums.join(',')})`);
    }
  }

  // --- CHECK 2: Data completeness per entry ---
  const { rows: completeness } = await client.query(`
    SELECT r.track, r.race_number,
      COUNT(*) as total,
      SUM(CASE WHEN e.best_beyer IS NOT NULL THEN 1 ELSE 0 END) as has_beyer,
      SUM(CASE WHEN e.morning_line_odds IS NOT NULL THEN 1 ELSE 0 END) as has_ml,
      SUM(CASE WHEN e.running_style IS NOT NULL THEN 1 ELSE 0 END) as has_style,
      SUM(CASE WHEN e.jockey IS NOT NULL THEN 1 ELSE 0 END) as has_jockey,
      SUM(CASE WHEN e.trainer IS NOT NULL THEN 1 ELSE 0 END) as has_trainer
    FROM entries e
    JOIN races r ON r.id = e.race_id
    WHERE r.date = $1 AND r.track = ANY($2)
    GROUP BY r.track, r.race_number
    ORDER BY r.track, r.race_number
  `, [date, ELIGIBLE_TRACKS]);

  // Determine which tracks have Brisnet data (at least one entry with best_beyer)
  const { rows: brisnetTracks } = await client.query(`
    SELECT DISTINCT r.track FROM entries e
    JOIN races r ON r.id = e.race_id
    WHERE r.date = $1 AND e.best_beyer IS NOT NULL
  `, [date]);
  const hasBrisnet = new Set(brisnetTracks.map(r => r.track));

  let tracksWithNoBeyers = new Set();
  let racesWithNoML = [];

  for (const row of completeness) {
    const total = parseInt(row.total);
    const beyer = parseInt(row.has_beyer);
    const ml = parseInt(row.has_ml);
    const style = parseInt(row.has_style);

    // Only fail on Beyer gap if we expect this track to have Brisnet data
    // Track individual races missing Beyers — only fail the track if ALL its races have zero
    if (beyer === 0 && hasBrisnet.has(row.track)) tracksWithNoBeyers.add(row.track + '|R' + row.race_number);
    if (ml === 0 && hasBrisnet.has(row.track)) racesWithNoML.push(`${row.track} R${row.race_number}`);
    if (style === 0 && hasBrisnet.has(row.track)) warnings.push(`${row.track} R${row.race_number}: Zero running styles (${total} entries)`);
  }

  // Group by track — only fail if EVERY race for that track has zero Beyers
  const beyerGapsByTrack = {};
  for (const key of tracksWithNoBeyers) {
    const track = key.split('|')[0];
    if (!beyerGapsByTrack[track]) beyerGapsByTrack[track] = 0;
    beyerGapsByTrack[track]++;
  }
  const brisnetTrackRaceCounts = {};
  for (const row of completeness) {
    if (hasBrisnet.has(row.track)) {
      brisnetTrackRaceCounts[row.track] = (brisnetTrackRaceCounts[row.track] || 0) + 1;
    }
  }
  const fullyMissingTracks = Object.entries(beyerGapsByTrack)
    .filter(([track, gapCount]) => gapCount === brisnetTrackRaceCounts[track])
    .map(([track]) => track);
  if (fullyMissingTracks.length > 0) {
    failures.push(`BEYER GAP: ${fullyMissingTracks.length} track(s) have ZERO Beyer figures across ALL races: ${fullyMissingTracks.join(', ')}. Did parse_drf_full.mjs run?`);
  }
  const partialMissing = Object.entries(beyerGapsByTrack)
    .filter(([track, gapCount]) => gapCount < brisnetTrackRaceCounts[track])
    .map(([track, count]) => `${track} (${count} races)`);
  if (partialMissing.length > 0) {
    warnings.push(`PARTIAL BEYER GAPS (some races missing — may be quarter horse): ${partialMissing.join(', ')}`);
  }

  if (racesWithNoML.length > 0) {
    warnings.push(`ML GAPS: ${racesWithNoML.length} races missing all ML odds (Brisnet tracks only): ${racesWithNoML.join(', ')}`);
  }

  // --- CHECK 3: Source agreement ---
  // Check entries where Racing API field_size disagrees with actual entry count
  const { rows: fieldSizeCheck } = await client.query(`
    SELECT r.track, r.race_number, r.field_size,
      (SELECT COUNT(*) FROM entries e WHERE e.race_id = r.id AND e.scratched IS NOT TRUE) as actual_entries
    FROM races r
    WHERE r.date = $1 AND r.track = ANY($2) AND r.field_size IS NOT NULL
    ORDER BY r.track, r.race_number
  `, [date, ELIGIBLE_TRACKS]);

  for (const row of fieldSizeCheck) {
    const declared = parseInt(row.field_size);
    const actual = parseInt(row.actual_entries);
    if (declared > 0 && actual > 0 && Math.abs(declared - actual) > 2) {
      warnings.push(`${row.track} R${row.race_number}: Field size mismatch — declared ${declared}, actual ${actual} entries`);
    }
  }

  // --- CHECK 4: Races with no entries at all ---
  const { rows: emptyRaces } = await client.query(`
    SELECT r.track, r.race_number
    FROM races r
    WHERE r.date = $1 AND r.track = ANY($2)
      AND NOT EXISTS (SELECT 1 FROM entries e WHERE e.race_id = r.id)
    ORDER BY r.track, r.race_number
  `, [date, ELIGIBLE_TRACKS]);

  if (emptyRaces.length > 0) {
    failures.push(`EMPTY RACES: ${emptyRaces.length} race(s) with zero entries: ${emptyRaces.map(r => r.track + ' R' + r.race_number).join(', ')}`);
  }

  // --- CHECK 5: Duplicate entries (same horse in same race) ---
  const { rows: dupes } = await client.query(`
    SELECT r.track, r.race_number, h.name, COUNT(*) as dupes
    FROM entries e
    JOIN races r ON r.id = e.race_id
    JOIN horses h ON h.id = e.horse_id
    WHERE r.date = $1 AND r.track = ANY($2)
    GROUP BY r.track, r.race_number, h.name
    HAVING COUNT(*) > 1
  `, [date, ELIGIBLE_TRACKS]);

  if (dupes.length > 0) {
    failures.push(`DUPLICATE ENTRIES: ${dupes.length} horse(s) appear multiple times: ${dupes.map(d => d.name + ' in ' + d.track + ' R' + d.race_number).join(', ')}`);
  }

  report(failures, warnings);
  client.release();
  await pool.end();

  if (failures.length > 0) {
    console.log('\n❌ GATE BLOCKED — fix failures before scoring');
    process.exit(1);
  } else {
    console.log('\n✅ GATE PASSED — clear to score');
    process.exit(0);
  }
}

function report(failures, warnings) {
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  DATA QUALITY CHECK — ${date}`);
  console.log(`${'═'.repeat(50)}\n`);

  if (failures.length > 0) {
    console.log('🚫 FAILURES (must fix):');
    failures.forEach(f => console.log(`   • ${f}`));
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS (review):');
    warnings.forEach(w => console.log(`   • ${w}`));
    console.log('');
  }

  if (failures.length === 0 && warnings.length === 0) {
    console.log('  All checks passed — no issues found.\n');
  }

  console.log(`  Summary: ${failures.length} failure(s), ${warnings.length} warning(s)`);
}

run().catch(e => { console.error(e); process.exit(1); });
