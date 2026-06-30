import pg from 'pg';
const { Pool } = pg;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const pool = new Pool({
  connectionString: 'postgres://postgres.bazvhjajajkpkqqvyelg:Cbl49UHWAQNJ8Lyf@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: true
});

function parseOdds(ml) {
  if (!ml) return null;
  const s = String(ml);
  if (s.includes('/')) { const [n, d] = s.split('/').map(Number); return n / d; }
  if (s.includes('-')) { const [n, d] = s.split('-').map(Number); return d ? n / d : parseFloat(s); }
  return parseFloat(s);
}

function determineRunStyle(pps) {
  if (!pps || pps.length === 0) return null;
  let eCount = 0, epCount = 0, pCount = 0, sCount = 0;
  const recent = pps.slice(0, 4);
  for (const pp of recent) {
    const pos1 = parseInt(pp.pos_1st_call);
    const fieldSize = parseInt(pp.field_size) || 8;
    if (isNaN(pos1)) continue;
    if (pos1 <= 2) eCount++;
    else if (pos1 <= 4) epCount++;
    else if (pos1 <= Math.ceil(fieldSize * 0.6)) pCount++;
    else sCount++;
  }
  const total = eCount + epCount + pCount + sCount;
  if (total === 0) return null;
  if (eCount / total >= 0.5) return 'E';
  if ((eCount + epCount) / total >= 0.5) return 'E/P';
  if (sCount / total >= 0.5) return 'S';
  return 'P';
}

function checkLayoff(entry) {
  const days = entry.days_since_last;
  if (!days || days < 90) return { excluded: false };
  const workouts = entry.workouts || [];
  if (workouts.length >= 4) return { excluded: false, note: 'Fresh angle — layoff + solid works' };
  return { excluded: true, reason: `${days}-day layoff, ${workouts.length} works` };
}

function checkClassDrop(entry, raceConditions) {
  const pps = entry.past_performances || [];
  if (pps.length === 0) return { drop: false };
  const todayPurse = entry.race_purse;
  const lastPurse = pps[0]?.purse;
  if (todayPurse && lastPurse && todayPurse < lastPurse * 0.6) {
    return { drop: true, from: lastPurse, to: todayPurse };
  }
  return { drop: false };
}

function checkRecentLife(entry) {
  const pps = entry.past_performances || [];
  if (pps.length === 0) return false;
  const last = pps[0];
  const days = entry.days_since_last;
  if (!days || days > 30) return false;
  const posFinish = parseInt(last.pos_finish);
  const beaten = last.beaten_lengths_finish;
  if (beaten !== null && beaten <= 3) return true;
  const comment = (last.comment || '').toLowerCase();
  if (comment.match(/wide|check|block|steady|bump|shuffle|fan/)) return true;
  const lastBeyer = last.beyer;
  const prevBeyer = pps[1]?.beyer;
  if (lastBeyer && prevBeyer && lastBeyer >= prevBeyer) return true;
  return false;
}

function checkTroubledTrip(entry) {
  const pps = entry.past_performances || [];
  if (pps.length === 0) return { troubled: false };
  const last = pps[0];
  const comment = (last.comment || '').toLowerCase();
  const troubleWords = ['blocked', 'steadied', 'checked', 'bumped', 'boxed', 'shuffled', 'fanned wide', 'wide on turn', '5-wide', '6-wide', '4-wide'];
  const found = troubleWords.filter(w => comment.includes(w));
  if (found.length === 0) return { troubled: false };
  return { troubled: true, keywords: found, comment: last.comment };
}

function scoreSignals(entry, entries, race) {
  let score = 0;
  const signals = [];
  const ml = parseOdds(entry.morning_line_odds);
  const stats = entry.stats || {};
  const trainerStats = stats.trainer || {};
  const jockeyStats = stats.jockey || {};

  // S1: Elite jockey on bomb (>12/1 with top jockey)
  if (ml && ml >= 12) {
    const jWin = jockeyStats.wins || 0;
    const jStarts = jockeyStats.starts || 0;
    const jPct = jStarts > 0 ? (jWin / jStarts) * 100 : 0;
    if (jPct >= 18) { score += 3; signals.push('S1 (elite jockey on bomb)'); }
  }

  // S4: Trainer win% >15% at meet AND horse >6/1
  if (ml && ml >= 6) {
    const tWin = trainerStats.wins || 0;
    const tStarts = trainerStats.starts || 0;
    const tPct = tStarts > 0 ? (tWin / tStarts) * 100 : 0;
    if (tPct >= 15 && tStarts >= 5) { score += 2; signals.push(`S4 (trainer ${Math.round(tPct)}% win)`); }
  }

  // S5: Distance stretch-out to sire sweet spot
  const pps = entry.past_performances || [];
  const todayYards = race.distance_yards;
  if (todayYards && pps.length > 0) {
    const maxPPDist = Math.max(...pps.map(p => p.distance_yards || 0));
    if (todayYards > maxPPDist && maxPPDist > 0) {
      score += 2; signals.push('S5 (distance stretch-out)');
    }
  }

  // S6: Best last-race Beyer in field
  const lastBeyers = entries.filter(e => e.last_beyer).map(e => e.last_beyer);
  if (entry.last_beyer && lastBeyers.length > 0 && entry.last_beyer === Math.max(...lastBeyers)) {
    score += 1; signals.push('S6 (best last Beyer)');
  }

  // S9: Earnings leader (using best_beyer as proxy for class)
  const bestBeyers = entries.filter(e => e.best_beyer).map(e => e.best_beyer);
  if (entry.best_beyer && bestBeyers.length > 0 && entry.best_beyer === Math.max(...bestBeyers)) {
    const isGraded = (race.conditions || '').match(/G[123]|Stk|Stakes/i);
    score += isGraded ? 2 : 1;
    signals.push('S9 (class leader)');
  }

  // S11: Inner turf rail speed
  if (entry.post_position <= 2 && entry.running_style === 'E' && 
      (race.surface === 'Turf' || race.surface === 't') && todayYards >= 1760) {
    const otherInsideE = entries.filter(e => e.post_position < entry.post_position && e.running_style === 'E');
    if (otherInsideE.length === 0) {
      score += 2; signals.push('S11 (inner turf rail speed)');
    }
  }

  return { score, signals };
}

async function analyzeRace(raceId) {
  const { rows: [race] } = await pool.query(
    `SELECT r.*, r.field_size FROM races r WHERE r.id = $1`, [raceId]
  );
  if (!race) return null;

  const { rows: entries } = await pool.query(`
    SELECT e.*, h.name as horse_name, h.sire, h.dam
    FROM entries e JOIN horses h ON h.id = e.horse_id
    WHERE e.race_id = $1 ORDER BY e.post_position
  `, [raceId]);

  // Parse PPs from JSON
  for (const e of entries) {
    e.past_performances = typeof e.past_performances === 'string' ? JSON.parse(e.past_performances) : (e.past_performances || []);
    e.stats = typeof e.stats === 'string' ? JSON.parse(e.stats) : (e.stats || {});
    e.workouts = e.stats?.workouts || [];
    e.race_purse = race.purse;
  }

  // PHASE 2: Tag running styles
  for (const e of entries) {
    if (!e.running_style) {
      e.running_style = determineRunStyle(e.past_performances);
    }
  }

  // Pace map
  const eHorses = entries.filter(e => e.running_style === 'E');
  const paceScenario = eHorses.length === 0 ? 'no_speed' : eHorses.length === 1 ? 'lone_speed' : 'pace_duel';

  // Find favorite
  let fave = null, lowestOdds = Infinity;
  for (const e of entries) {
    const odds = parseOdds(e.morning_line_odds);
    if (odds !== null && odds < lowestOdds) { lowestOdds = odds; fave = e; }
  }

  // Assess vulnerability
  let vulnerable = false, vulnReason = '';
  if (fave) {
    // Trigger A: Traffic (closer/stalker inside in big field)
    if (fave.post_position <= 3 && ['P', 'S', 'E/P'].includes(fave.running_style) && entries.length >= 8) {
      vulnerable = true;
      vulnReason = `Trigger A: ${fave.running_style} fave drawn PP${fave.post_position} inside in ${entries.length}-horse field — traffic trap`;
    }
    // Trigger B: Speed fave in pace duel
    if (fave.running_style === 'E' && paceScenario === 'pace_duel') {
      vulnerable = true;
      vulnReason = `Trigger B: E fave in pace duel (${eHorses.length} speed horses) — gets cooked`;
    }
    // Trigger B variant: Closer fave in lone speed race
    if (['S', 'P'].includes(fave.running_style) && paceScenario === 'lone_speed') {
      vulnerable = true;
      vulnReason = `Trigger B: ${fave.running_style} fave in lone-speed race — no pace to run into`;
    }
  }

  // PHASE 2 filters
  const liveEntries = [];
  for (const e of entries) {
    const layoff = checkLayoff(e);
    if (layoff.excluded) { e.excluded = true; e.excludeReason = layoff.reason; continue; }
    e.classDrop = checkClassDrop(e, race.conditions);
    e.recentLife = checkRecentLife(e);
    e.troubledTrip = checkTroubledTrip(e);
    liveEntries.push(e);
  }

  // PHASE 3: Score signals
  for (const e of liveEntries) {
    const { score, signals } = scoreSignals(e, liveEntries, race);
    e.signalScore = score;
    e.signalsFired = signals;
  }

  // PHASE 4: Build bets
  // Win pick: highest-scored at 7/2+ whose style benefits from fave vulnerability
  const winCandidates = liveEntries
    .filter(e => {
      const odds = parseOdds(e.morning_line_odds);
      return odds !== null && odds >= 3.5 && e !== fave;
    })
    .sort((a, b) => (b.signalScore - a.signalScore) || ((b.best_beyer || 0) - (a.best_beyer || 0)));

  const winPick = winCandidates[0] || null;

  // Exotic box: Beyer ceiling top 4
  const byBeyer = [...liveEntries].sort((a, b) => (b.best_beyer || 0) - (a.best_beyer || 0));
  let box = byBeyer.slice(0, 4);

  // Ensure fave in box
  if (fave && !box.find(e => e.post_position === fave.post_position)) {
    box.push(fave);
  }
  // Ensure win pick in box
  if (winPick && !box.find(e => e.post_position === winPick.post_position)) {
    box.push(winPick);
  }

  // Stake sizing — Doubled requires ALL THREE:
  // 1. Vulnerable favorite (pace thesis)
  // 2. Win pick within 5 Beyer points of distance ceiling
  // 3. Price (ML >= 6/1)
  const boxTopBeyer = Math.max(...box.map(e => e.best_beyer || 0));
  const winPickBeyer = winPick?.best_beyer || 0;
  const winPickML = parseOdds(winPick?.morning_line_odds) || 0;
  const withinCeiling = winPickBeyer > 0 && (boxTopBeyer - winPickBeyer) <= 5;
  const hasPrice = winPickML >= 6;
  const doubled = vulnerable && withinCeiling && hasPrice;
  const winStake = winPick ? (doubled ? 100 : 50) : 0;
  const exactaStake = doubled ? 120 : 60;

  // Check Cosa Nostra rule: if win pick scores 3+ AND is 7/2+, bet regardless of fave protection
  const cosaNostro = winPick && winPick.signalScore >= 3 && parseOdds(winPick.morning_line_odds) >= 3.5;

  // Beyer ceiling gap rule: if win pick ceiling is 8+ below fave ceiling, halve stake
  let stakeReduced = false;
  if (winPick && fave && fave.best_beyer && winPick.best_beyer && (fave.best_beyer - winPick.best_beyer) >= 8) {
    stakeReduced = true;
  }

  const finalWinStake = stakeReduced ? Math.round(winStake / 2) : winStake;

  return {
    race,
    entries: liveEntries,
    paceScenario,
    eHorses: eHorses.map(e => ({ pp: e.post_position, name: e.horse_name, ml: e.morning_line_odds })),
    fave: fave ? { pp: fave.post_position, name: fave.horse_name, ml: fave.morning_line_odds, style: fave.running_style, beyer: fave.best_beyer } : null,
    vulnerable,
    vulnReason,
    winPick: winPick ? { pp: winPick.post_position, name: winPick.horse_name, ml: winPick.morning_line_odds, style: winPick.running_style, score: winPick.signalScore, signals: winPick.signalsFired, beyer: winPick.best_beyer, recentLife: winPick.recentLife, troubled: winPick.troubledTrip } : null,
    box: box.map(e => ({ pp: e.post_position, name: e.horse_name, beyer: e.best_beyer, ml: e.morning_line_odds })),
    stakes: { win: finalWinStake, exacta: doubled ? 120 : (box.length <= 4 ? 60 : (box.length === 5 ? 100 : 60)), trifecta: box.length <= 4 ? 24 : 60, superfecta: box.length <= 4 ? 2.40 : 12 },
    doubled,
    stakeReduced,
    cosaNostro,
    conviction: (vulnerable && winPick && winPick.signalScore >= 3) ? 'HIGH' : (winPick && winPick.signalScore >= 2) ? 'MEDIUM' : 'LOW'
  };
}

async function run() {
  const dateArg = process.argv[2] || new Date().toISOString().split('T')[0];
  // Get all qualified race IDs (from Phase 1 — non-bullring, non-maiden, non-short-field, non-lone-speed)
  const { rows: races } = await pool.query(`
    SELECT r.id, r.track, r.race_number, r.conditions, r.distance, r.surface, r.field_size
    FROM races r
    WHERE r.date = $1
      AND r.track IN ('Churchill Downs', 'Gulfstream Park', 'Belmont at the Big A', 'Laurel Park', 'Prairie Meadows', 'Penn National', 'Woodbine', 'Emerald Downs', 'Canterbury Park', 'Monmouth Park', 'Colonial Downs', 'Hawthorne', 'Delaware Park')
    ORDER BY r.track, r.race_number
  `, [dateArg]);

  // Filter: re-apply gates on the Racing API versions (clean data with ML)
  const qualified = [];
  for (const race of races) {
    const { rows: entries } = await pool.query(`
      SELECT e.morning_line_odds, e.running_style, e.post_position
      FROM entries e WHERE e.race_id = $1
    `, [race.id]);

    if (entries.length <= 5) continue;
    const cond = (race.conditions || '').toUpperCase();
    if (cond.includes('MAIDEN')) continue;

    // Hard gate: purse minimum $25K (cheap claimers don't run to Beyers)
    const { rows: purseRow } = await pool.query('SELECT purse, surface FROM races WHERE id = $1', [race.id]);
    const purse = purseRow[0]?.purse || 0;
    if (purse < 25000) continue;

    // Hard gate: dirt only (turf = -22.6% ROI, pace thesis doesn't hold)
    const surface = (purseRow[0]?.surface || '').toLowerCase();
    if (surface.includes('turf') || (surface === 't' && !surface.includes('dirt'))) continue;

    // Lone speed gate
    let fave = null, lowestOdds = Infinity;
    for (const e of entries) {
      const odds = parseOdds(e.morning_line_odds);
      if (odds !== null && odds < lowestOdds) { lowestOdds = odds; fave = e; }
    }
    if (fave && fave.post_position <= 3 && fave.running_style === 'E') {
      const otherE = entries.filter(e => e.running_style === 'E' && e.post_position !== fave.post_position);
      if (otherE.length === 0) continue;
    }

    qualified.push(race);
  }

  console.log(`Running Phase 2-5 on ${qualified.length} qualified races...\n`);

  const results = [];
  for (const race of qualified) {
    try {
      const analysis = await analyzeRace(race.id);
      if (analysis) results.push(analysis);
    } catch (err) {
      console.error(`Error on ${race.track} R${race.race_number}: ${err.message}`);
    }
  }

  // Sort by conviction + field size
  const convOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  results.sort((a, b) => (convOrder[b.conviction] - convOrder[a.conviction]) || (b.entries.length - a.entries.length));

  // Output
  console.log('=== PHASE 2-5 COMPLETE ===\n');
  console.log(`Analyzed: ${results.length} races`);
  console.log(`HIGH conviction: ${results.filter(r => r.conviction === 'HIGH').length}`);
  console.log(`MEDIUM conviction: ${results.filter(r => r.conviction === 'MEDIUM').length}`);
  console.log(`LOW conviction: ${results.filter(r => r.conviction === 'LOW').length}`);
  console.log(`No win pick: ${results.filter(r => !r.winPick).length}\n`);

  for (const r of results) {
    if (!r.winPick) continue;
    console.log(`--- ${r.race.track} R${r.race.race_number} [${r.conviction}] ---`);
    console.log(`  ${r.race.conditions} | ${r.race.distance} ${r.race.surface} | ${r.entries.length} live horses`);
    console.log(`  Pace: ${r.paceScenario} (${r.eHorses.length} speed: ${r.eHorses.map(e => `PP${e.pp} ${e.name}`).join(', ') || 'none'})`);
    console.log(`  Fave: PP${r.fave?.pp} ${r.fave?.name} (${r.fave?.ml}) [${r.fave?.style}] Beyer: ${r.fave?.beyer || '?'}`);
    console.log(`  Vulnerable: ${r.vulnerable ? 'YES — ' + r.vulnReason : 'NO (protected)'}`);
    console.log(`  WIN: PP${r.winPick.pp} ${r.winPick.name} (${r.winPick.ml}) [${r.winPick.style}] Score: ${r.winPick.score} Beyer: ${r.winPick.beyer || '?'}`);
    if (r.winPick.signals.length) console.log(`    Signals: ${r.winPick.signals.join(', ')}`);
    if (r.winPick.recentLife) console.log(`    ✓ Recent Life`);
    if (r.winPick.troubled?.troubled) console.log(`    ✓ Troubled Trip: ${r.winPick.troubled.keywords.join(', ')}`);
    console.log(`  BOX: ${r.box.map(e => `PP${e.pp} ${e.name} (${e.beyer || '?'})`).join(' | ')}`);
    console.log(`  STAKES: Win $${r.stakes.win}${r.doubled ? ' (DOUBLED)' : ''}${r.stakeReduced ? ' (REDUCED — ceiling gap)' : ''} | Ex $${r.stakes.exacta} | Tri $${r.stakes.trifecta} | Super $${r.stakes.superfecta}`);
    console.log(`  Total outlay: $${(r.stakes.win + r.stakes.exacta + r.stakes.trifecta + r.stakes.superfecta).toFixed(2)}`);
    console.log('');
  }

  // Output JSON for email
  const commissionPicks = results.filter(r => r.winPick && r.conviction !== 'LOW');
  console.log('\n=== COMMISSION PICKS (HIGH + MEDIUM) ===');
  console.log(JSON.stringify(commissionPicks.map(r => ({
    track: r.race.track,
    race: r.race.race_number,
    conditions: r.race.conditions,
    distance: r.race.distance,
    surface: r.race.surface,
    fieldSize: r.entries.length,
    conviction: r.conviction,
    pace: r.paceScenario,
    fave: r.fave,
    vulnerable: r.vulnerable,
    vulnReason: r.vulnReason,
    winPick: r.winPick,
    box: r.box,
    stakes: r.stakes,
    doubled: r.doubled,
    totalOutlay: (r.stakes.win + r.stakes.exacta + r.stakes.trifecta + r.stakes.superfecta).toFixed(2)
  })), null, 2));

  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
