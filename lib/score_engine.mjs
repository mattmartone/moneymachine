import { pool } from './db.mjs';
import { generateRunId, distanceToYards } from './trace_lib.mjs';
import { writeScoredCandidate } from './scored_candidates_lib.mjs';

// Lightweight no-op tracer — same interface, no DB writes
class NoOpTracer {
  constructor() { this.blocked = false; this.hasWarning = false; }
  async start() { return 0; }
  async step(phase, name, gateType, fn) {
    const { result, status } = await fn();
    if (gateType === 'hard_block' && status === 'failed') this.blocked = true;
    if (gateType === 'warning' && status === 'warning') this.hasWarning = true;
    return result;
  }
  async complete() { return this.blocked ? 'blocked' : 'passed'; }
}

let DATE = new Date().toISOString().split('T')[0];
let SLOW = false;
let CANDIDATES_ONLY = false;
let RUN_ID = generateRunId();
const sleep = ms => new Promise(r => setTimeout(r, ms));

function parseOdds(ml) {
  if (!ml) return null;
  const s = String(ml);
  if (s.includes('/')) { const [n, d] = s.split('/').map(Number); return d ? n / d : null; }
  if (s.includes('-')) { const [n, d] = s.split('-').map(Number); return d ? n / d : parseFloat(s); }
  return parseFloat(s);
}

function determineRunStyle(pps) {
  if (!pps || pps.length === 0) return { style: null, reasoning: 'No PPs available' };
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
  if (total === 0) return { style: null, reasoning: 'No 1st call positions parseable' };

  let style;
  if (eCount / total >= 0.5) style = 'E';
  else if ((eCount + epCount) / total >= 0.5) style = 'E/P';
  else if (sCount / total >= 0.5) style = 'S';
  else style = 'P';

  return { style, reasoning: `E:${eCount} E/P:${epCount} P:${pCount} S:${sCount} from ${total} recent races` };
}

function scoreSignals(entry, entries, raceYards) {
  let score = 0;
  const signals = [];
  const ml = parseOdds(entry.morning_line_odds);

  if (ml && ml >= 12) {
    const jockey = entry.jockey || '';
    const topJockeys = ['Prat F', 'Ortiz I Jr', 'Ortiz J L', 'Saez L', 'Velazquez J R', 'Gaffalione T', 'Rosario J', 'Castellano J', 'Franco M'];
    if (topJockeys.some(j => jockey.includes(j.split(' ')[0]))) {
      score += 3; signals.push({ id: 'S1', desc: 'Elite jockey on bomb', weight: 3 });
    }
  }

  if (ml && ml >= 6 && entry.trainer) {
    score += 2; signals.push({ id: 'S4', desc: `Trainer angle at ${ml.toFixed(1)}/1`, weight: 2 });
  }

  const pps = entry.past_performances || [];
  if (raceYards && pps.length > 0) {
    const maxPPDist = Math.max(...pps.map(p => p.distance_yards || 0));
    if (raceYards > maxPPDist && maxPPDist > 0) {
      score += 2; signals.push({ id: 'S5', desc: 'Distance stretch-out', weight: 2 });
    }
  }

  const lastBeyers = entries.filter(e => e.last_beyer).map(e => e.last_beyer);
  if (entry.last_beyer && lastBeyers.length > 0 && entry.last_beyer === Math.max(...lastBeyers)) {
    score += 1; signals.push({ id: 'S6', desc: 'Best last Beyer in field', weight: 1 });
  }

  if (entry.distanceBeyer && entries.length > 0) {
    const fieldDistBeyers = entries.filter(e => e.distanceBeyer).map(e => e.distanceBeyer);
    if (fieldDistBeyers.length > 0 && entry.distanceBeyer === Math.max(...fieldDistBeyers)) {
      score += 2; signals.push({ id: 'S9', desc: 'Distance ceiling leader', weight: 2 });
    }
  }

  if (entry.post_position <= 2 && entry.running_style === 'E' && entry.isTurf && raceYards >= 1760) {
    const otherInsideE = entries.filter(e => e.post_position < entry.post_position && e.running_style === 'E');
    if (otherInsideE.length === 0) {
      score += 2; signals.push({ id: 'S11', desc: 'Inner turf rail speed', weight: 2 });
    }
  }

  return { score, signals };
}

async function scoreRace(raceId) {
  const tracer = new NoOpTracer();
  await tracer.start();

  // STEP 1: Load Race
  const race = await tracer.step('data', 'Load Race', null, async () => {
    const { rows: [r] } = await pool.query(`SELECT * FROM races WHERE id = $1`, [raceId]);
    const yards = distanceToYards(r.distance);
    return {
      input: { race_id: raceId },
      logic: 'Fetch race conditions from DB',
      result: { track: r.track, race_number: r.race_number, distance: r.distance, distance_yards: yards, surface: r.surface, purse: r.purse, field_size: r.field_size, conditions: r.conditions },
      status: 'passed',
      message: `${r.track} R${r.race_number} — ${r.distance} ${r.surface}`
    };
  });
  if (!race) { await tracer.complete(); return null; }

  const raceYards = race.distance_yards;
  const isTurf = race.surface === 'Turf' || race.surface === 't' || (race.surface || '').toLowerCase().includes('turf');

  // TURF GATE — hard kill, no turf races
  if (isTurf) {
    await writeScoredCandidate(pool, {
      raceId, date: DATE, status: 'blocked', blockedReason: 'turf',
      conviction: 'BLOCKED', fieldSize: race.field_size, runId: RUN_ID
    });
    await tracer.complete({ conviction: 'BLOCKED' });
    return { raceId, status: 'blocked', track: race.track, raceNumber: race.race_number };
  }

  // BULLRING GATE (#29) — hard kill, no edge on tiny tracks
  const BULLRING_TRACKS = ['Canterbury Park', 'Belterra Park', 'Charles Town', 'Delta Downs', 'Evangeline Downs', 'Finger Lakes', 'Mountaineer Park', 'Thistledown', 'Arapahoe Park'];
  if (BULLRING_TRACKS.includes(race.track)) {
    await writeScoredCandidate(pool, {
      raceId, date: DATE, status: 'blocked', blockedReason: 'bullring_track',
      conviction: 'BLOCKED', fieldSize: race.field_size, runId: RUN_ID
    });
    await tracer.complete({ conviction: 'BLOCKED' });
    return { raceId, status: 'blocked', track: race.track, raceNumber: race.race_number };
  }

  // STEP 2: Load Entries
  const entries = await tracer.step('data', 'Load Entries', null, async () => {
    const { rows } = await pool.query(`
      SELECT e.*, h.name as horse_name, h.sire, h.dam
      FROM entries e JOIN horses h ON h.id = e.horse_id
      WHERE e.race_id = $1 AND (e.scratched IS NULL OR e.scratched = false)
      ORDER BY e.post_position
    `, [raceId]);
    return {
      input: { race_id: raceId },
      logic: 'Fetch non-scratched entries with horse names',
      result: rows.map(e => ({ pp: e.post_position, name: e.horse_name, ml: e.morning_line_odds, best_beyer: e.best_beyer })),
      status: 'passed',
      message: `${rows.length} live entries`
    };
  });

  // STEP 3: Load Past Performances
  let allEntries = [];
  await tracer.step('data', 'Load Past Performances', null, async () => {
    const { rows } = await pool.query(`
      SELECT e.*, h.name as horse_name, h.sire, h.dam
      FROM entries e JOIN horses h ON h.id = e.horse_id
      WHERE e.race_id = $1 AND (e.scratched IS NULL OR e.scratched = false)
      ORDER BY e.post_position
    `, [raceId]);

    for (const e of rows) {
      e.past_performances = typeof e.past_performances === 'string' ? JSON.parse(e.past_performances) : (e.past_performances || []);
      e.isTurf = isTurf;
    }

    allEntries = rows;
    const ppCounts = rows.map(e => ({ pp: e.post_position, name: e.horse_name, pps: e.past_performances.length, beyers: e.past_performances.filter(p => p.beyer).length }));
    const avgPPs = rows.length > 0 ? (rows.reduce((s, e) => s + e.past_performances.length, 0) / rows.length).toFixed(1) : 0;

    return {
      input: { entry_count: rows.length },
      logic: 'Parse JSON past_performances per entry, count Beyer coverage',
      result: { entries: ppCounts, avg_pps: avgPPs },
      status: 'passed',
      message: `Avg ${avgPPs} PPs/horse, ${rows.filter(e => e.past_performances.some(p => p.beyer)).length}/${rows.length} have Beyers`
    };
  });

  if (allEntries.length === 0) { await tracer.complete(); return null; }

  // GATE: No FTS-Heavy Maidens (Strategy #47)
  if ((race.conditions || '').toUpperCase().includes('MAIDEN')) {
    const unraced = allEntries.filter(e => !e.best_beyer && !e.running_style);
    if (unraced.length > allEntries.length * 0.5) {
      await writeScoredCandidate(pool, {
        raceId, date: DATE, status: 'blocked', blockedReason: `fts_heavy_maiden (${unraced.length}/${allEntries.length} unraced)`,
        conviction: 'BLOCKED', fieldSize: allEntries.length, runId: RUN_ID
      });
      await tracer.complete({ conviction: 'BLOCKED' });
      return { raceId, status: 'blocked', track: race.track, raceNumber: race.race_number };
    }
  }

  // STEP 4: Running Style Classification
  const styleResults = await tracer.step('analysis', 'Running Style Classification', 'info', async () => {
    const perHorse = [];
    for (const e of allEntries) {
      const { style, reasoning } = determineRunStyle(e.past_performances);
      e.running_style = style || e.running_style;
      perHorse.push({ pp: e.post_position, name: e.horse_name, style: e.running_style, reasoning });
    }
    return {
      input: { horses: allEntries.length },
      logic: 'Classify E/E+P/P/S from first-call positions in last 4 races',
      result: perHorse,
      status: 'passed',
      message: perHorse.map(h => `PP${h.pp} ${h.name}→${h.style || '?'}`).join(', ')
    };
  });

  // STEP 5: Pace Map
  const paceMap = await tracer.step('analysis', 'Pace Map', 'info', async () => {
    const eHorses = allEntries.filter(e => e.running_style === 'E');
    const epHorses = allEntries.filter(e => e.running_style === 'E/P');
    const scenario = eHorses.length === 0 ? 'no_speed' : eHorses.length === 1 ? 'lone_speed' : 'pace_duel';
    return {
      input: { e_count: eHorses.length, ep_count: epHorses.length, total: allEntries.length },
      logic: '0 speed = no_speed, 1 = lone_speed, 2+ = pace_duel',
      result: { scenario, speed_horses: eHorses.map(e => ({ pp: e.post_position, name: e.horse_name })) },
      status: 'passed',
      message: `${scenario.toUpperCase()} — ${eHorses.length} E types: ${eHorses.map(e => e.horse_name).join(', ') || 'none'}`
    };
  });
  const paceScenario = paceMap?.scenario || 'no_speed';

  // STEP 6: Favorite ID
  let fave = null, lowestOdds = Infinity;
  for (const e of allEntries) {
    const odds = parseOdds(e.morning_line_odds);
    if (odds !== null && odds < lowestOdds) { lowestOdds = odds; fave = e; }
  }
  await tracer.step('analysis', 'Favorite Identification', 'info', async () => {
    return {
      input: { entries_with_ml: allEntries.filter(e => parseOdds(e.morning_line_odds) !== null).length },
      logic: 'Lowest ML odds = public favorite',
      result: fave ? { pp: fave.post_position, name: fave.horse_name, ml: fave.morning_line_odds, style: fave.running_style, beyer: fave.best_beyer } : null,
      status: fave ? 'passed' : 'warning',
      message: fave ? `PP${fave.post_position} ${fave.horse_name} (${fave.morning_line_odds}) [${fave.running_style}]` : 'No favorite identifiable'
    };
  });

  // STEP 7: Vulnerability Assessment
  let vulnerable = false, vulnReason = '';
  await tracer.step('analysis', 'Vulnerability Assessment', 'info', async () => {
    if (!fave) return { input: {}, logic: 'No fave to assess', result: { vulnerable: false }, status: 'passed', message: 'No favorite — skip' };

    if (fave.post_position <= 3 && ['P', 'S', 'E/P'].includes(fave.running_style) && allEntries.length >= 8) {
      vulnerable = true;
      vulnReason = `Trigger A: ${fave.running_style} fave drawn PP${fave.post_position} inside in ${allEntries.length}-horse field — traffic trap`;
    }
    if (fave.running_style === 'E' && paceScenario === 'pace_duel') {
      vulnerable = true;
      vulnReason = `Trigger B: E fave in pace duel — gets cooked`;
    }
    if (['S', 'P'].includes(fave.running_style) && paceScenario === 'lone_speed') {
      vulnerable = true;
      vulnReason = `Trigger B: ${fave.running_style} fave in lone-speed race — no pace to run into`;
    }

    return {
      input: { fave_pp: fave.post_position, fave_style: fave.running_style, pace: paceScenario, field_size: allEntries.length },
      logic: 'Trigger A: closer/stalker inside in 8+ field. Trigger B: speed fave in duel OR closer fave in lone-speed.',
      result: { vulnerable, reason: vulnReason },
      status: 'passed',
      message: vulnerable ? `YES — ${vulnReason}` : 'NO — favorite is protected'
    };
  });

  // GATE: Traffic Trap Field Minimum (Strategy #45)
  if (vulnReason.startsWith('Trigger A') && allEntries.length < 8) {
    await writeScoredCandidate(pool, {
      raceId, date: DATE, status: 'blocked', blockedReason: `traffic_trap_field_too_small (${allEntries.length} < 8)`,
      conviction: 'BLOCKED', fieldSize: allEntries.length, runId: RUN_ID
    });
    await tracer.complete({ conviction: 'BLOCKED' });
    return { raceId, status: 'blocked', track: race.track, raceNumber: race.race_number };
  }

  // STEP 8: DISTANCE CEILING (compute per-horse distance Beyers — gate evaluated after win pick selection)
  await tracer.step('analysis', 'Distance Ceiling', 'info', async () => {
    if (!raceYards) {
      return { input: { race_distance: race.distance }, logic: 'Cannot parse race distance to yards', result: {}, status: 'warning', message: `Cannot determine race yards from "${race.distance}"` };
    }

    const tolerance = 220; // 1 furlong
    const perHorse = [];
    for (const e of allEntries) {
      const pps = e.past_performances || [];
      const qualifying = pps.filter(pp => {
        const ppYards = pp.distance_yards;
        return ppYards && Math.abs(ppYards - raceYards) <= tolerance;
      });
      const bestAtDist = qualifying.reduce((best, pp) => (pp.beyer && pp.beyer > (best || 0)) ? pp.beyer : best, null);
      e.distanceBeyer = bestAtDist;
      perHorse.push({
        pp: e.post_position,
        name: e.horse_name,
        overall_best: e.best_beyer,
        best_at_distance: bestAtDist,
        qualifying_races: qualifying.length,
        gap: (e.best_beyer && bestAtDist) ? e.best_beyer - bestAtDist : null
      });
    }

    const withBeyers = perHorse.filter(h => h.overall_best);
    const proven = withBeyers.filter(h => h.best_at_distance !== null);

    return {
      input: { race_distance: race.distance, race_yards: raceYards, tolerance_yards: tolerance },
      logic: `Compute best Beyer at race distance (${raceYards}y) ±${tolerance}y (1F) per horse. Gate applied after win pick/box selection.`,
      result: { per_horse: perHorse, proven_count: proven.length, total_with_beyers: withBeyers.length },
      status: 'passed',
      message: `${proven.length}/${withBeyers.length} entries have proven Beyer at ${race.distance} ±1F`
    };
  });

  // STEP 9: ML Presence
  await tracer.step('analysis', 'ML Presence', 'hard_block', async () => {
    const withML = allEntries.filter(e => parseOdds(e.morning_line_odds) !== null);
    const missing = allEntries.length - withML.length;
    return {
      input: { total: allEntries.length, with_ml: withML.length },
      logic: 'All entries must have morning line odds to identify chalk',
      result: { missing, entries_missing: allEntries.filter(e => !parseOdds(e.morning_line_odds)).map(e => ({ pp: e.post_position, name: e.horse_name })) },
      status: missing > 0 ? 'failed' : 'passed',
      message: missing > 0 ? `BLOCKED — ${missing} entries missing ML odds` : `All ${withML.length} entries have ML odds`
    };
  });

  // STEP 10: Field Size Gate
  await tracer.step('analysis', 'Field Size', 'hard_block', async () => {
    const count = allEntries.length;
    return {
      input: { live_entries: count },
      logic: 'Minimum 5 live entries required for meaningful exotics',
      result: { count },
      status: count >= 5 ? 'passed' : 'failed',
      message: count >= 5 ? `${count} entries — sufficient` : `BLOCKED — only ${count} entries`
    };
  });

  // If blocked, skip remaining analysis and save
  if (tracer.blocked) {
    const blockedReason = allEntries.length < 5 ? 'field_size < 5' : 'no_ml_odds';
    await writeScoredCandidate(pool, {
      raceId, date: DATE, status: 'blocked', blockedReason,
      conviction: 'BLOCKED', fieldSize: allEntries.length, runId: RUN_ID
    });
    await tracer.step('conclusion', 'BLOCKED — Skipping scoring', null, async () => {
      return {
        input: {},
        logic: 'A hard gate failed — race cannot be Commission',
        result: { blocked: true },
        status: 'skipped',
        message: 'Hard gate failure — no bets written'
      };
    });
    await tracer.complete({ conviction: 'BLOCKED' });
    return { raceId, status: 'blocked', track: race.track, raceNumber: race.race_number };
  }

  // STEP 11: Signal Scoring
  const signalResults = await tracer.step('analysis', 'Signal Scoring', 'info', async () => {
    const perHorse = [];
    for (const e of allEntries) {
      const { score, signals } = scoreSignals(e, allEntries, raceYards);
      e.signalScore = score;
      e.signalsFired = signals;
      perHorse.push({ pp: e.post_position, name: e.horse_name, score, signals: signals.map(s => s.id) });
    }
    const maxScore = Math.max(...perHorse.map(h => h.score));
    return {
      input: { entries: allEntries.length },
      logic: 'S1(+3):elite jock bomb, S4(+2):trainer, S5(+2):stretch-out, S6(+1):best last, S9(+2):class leader, S11(+2):turf rail',
      result: perHorse.filter(h => h.score > 0),
      status: 'passed',
      message: `${perHorse.filter(h => h.score > 0).length} horses with signals, max score: ${maxScore}`
    };
  });

  // STEP 12: Win Candidate Ranking
  const winCandidates = allEntries
    .filter(e => {
      const odds = parseOdds(e.morning_line_odds);
      return odds !== null && odds >= 2.5 && e !== fave;
    })
    .sort((a, b) => (b.signalScore - a.signalScore) || ((b.distanceBeyer || 0) - (a.distanceBeyer || 0)) || ((b.best_beyer || 0) - (a.best_beyer || 0)));

  await tracer.step('analysis', 'Win Candidate Ranking', 'info', async () => {
    return {
      input: { candidates: winCandidates.length, min_odds: '5/2' },
      logic: 'Filter: ML ≥ 5/2, not favorite. Sort: signal score DESC, then distance Beyer DESC',
      result: winCandidates.slice(0, 6).map(e => ({
        pp: e.post_position, name: e.horse_name, ml: e.morning_line_odds,
        score: e.signalScore, dist_beyer: e.distanceBeyer, overall_beyer: e.best_beyer, style: e.running_style
      })),
      status: winCandidates.length > 0 ? 'passed' : 'warning',
      message: winCandidates.length > 0
        ? `${winCandidates.length} candidates — top: PP${winCandidates[0].post_position} ${winCandidates[0].horse_name} (score ${winCandidates[0].signalScore})`
        : 'No candidates above 5/2 odds threshold'
    };
  });

  const winPick = winCandidates[0] || null;

  // STEP 13: Win Pick
  await tracer.step('conclusion', 'Win Pick Selection', 'info', async () => {
    if (!winPick) return { input: {}, logic: 'No candidate', result: null, status: 'warning', message: 'No win pick — no qualifying candidates' };
    return {
      input: { candidates_count: winCandidates.length },
      logic: 'Highest signal score + distance Beyer among non-favorites at 5/2+',
      result: { pp: winPick.post_position, name: winPick.horse_name, ml: winPick.morning_line_odds, style: winPick.running_style, score: winPick.signalScore, dist_beyer: winPick.distanceBeyer, overall_beyer: winPick.best_beyer },
      status: 'passed',
      message: `PP${winPick.post_position} ${winPick.horse_name} (${winPick.morning_line_odds}) [${winPick.running_style}] Score:${winPick.signalScore} DistBeyer:${winPick.distanceBeyer || '?'}`
    };
  });

  // STEP 14: Box Construction (distance Beyer preferred, career Beyer fallback, sized by ML)
  const pickML = parseOdds(winPick?.morning_line_odds);
  const maxBoxSize = pickML >= 20 ? 5 : pickML >= 10 ? 4 : 3;
  const byBeyer = [...allEntries].sort((a, b) => ((b.distanceBeyer || b.best_beyer || 0) - (a.distanceBeyer || a.best_beyer || 0)));
  let box = byBeyer.slice(0, maxBoxSize);
  if (fave && !box.find(e => e.post_position === fave.post_position)) { box.pop(); box.push(fave); }
  if (winPick && !box.find(e => e.post_position === winPick.post_position)) { box.pop(); box.push(winPick); }
  // Strategy #43: Fittest Speed In Box — strongest E-type must be in the box
  const eTypes = allEntries.filter(e => e.running_style === 'E' || e.running_style === 'E/P');
  if (eTypes.length > 0) {
    const fittestE = eTypes.sort((a, b) => (b.best_beyer || 0) - (a.best_beyer || 0))[0];
    if (!box.find(e => e.post_position === fittestE.post_position)) {
      const lowestInBox = box.sort((a, b) => (a.distanceBeyer || a.best_beyer || 0) - (b.distanceBeyer || b.best_beyer || 0))[0];
      if (lowestInBox && lowestInBox.post_position !== winPick?.post_position && lowestInBox.post_position !== fave?.post_position) {
        box = box.filter(e => e.post_position !== lowestInBox.post_position);
        box.push(fittestE);
      }
    }
  }
  box = box.slice(0, maxBoxSize);

  await tracer.step('conclusion', 'Box Construction', 'info', async () => {
    return {
      input: { method: 'distance_beyer_with_career_fallback', ml: pickML, max_box: maxBoxSize },
      logic: `Top ${maxBoxSize} by distance Beyer (career fallback). ML ${winPick?.morning_line_odds} → ${maxBoxSize}-horse box. Fave + win pick required.`,
      result: box.map(e => ({ pp: e.post_position, name: e.horse_name, dist_beyer: e.distanceBeyer, overall_beyer: e.best_beyer, ml: e.morning_line_odds })),
      status: 'passed',
      message: `Box: ${box.map(e => `PP${e.post_position} ${e.horse_name} (${e.distanceBeyer || e.best_beyer || '?'}${e.distanceBeyer ? '' : '*'})`).join(', ')}`
    };
  });

  // STEP 15: Distance Ceiling Gate (relative — only blocks when pick is uniquely unproven)
  let fallbackMode = false;
  await tracer.step('conclusion', 'Distance Ceiling Gate', 'hard_block', async () => {
    if (!raceYards) {
      return { input: {}, logic: 'No race yards — skip gate', result: {}, status: 'passed', message: 'Cannot parse distance — gate skipped' };
    }
    if (!winPick) {
      return { input: {}, logic: 'No win pick — nothing to gate', result: {}, status: 'passed', message: 'No win pick — pass by default' };
    }

    const pickHasCeiling = winPick.distanceBeyer !== null;
    const fieldWithCeiling = allEntries.filter(e => e.distanceBeyer !== null).length;
    const pickPPs = (winPick.past_performances || []).length;

    // Gate 2 (absolute): block genuinely green horses (< 3 career races)
    if (pickPPs < 3) {
      return {
        input: { pick_pps: pickPPs },
        logic: 'Absolute gate: win pick has < 3 career races — too green to bet.',
        result: { pick_pps: pickPPs },
        status: 'failed',
        message: `BLOCKED — Win pick has only ${pickPPs} career races (need 3+)`
      };
    }

    // Gate 1 (relative): block if pick is uniquely unproven while 2+ rivals ARE proven
    if (!pickHasCeiling && fieldWithCeiling >= 2) {
      return {
        input: { pick_has_ceiling: false, field_with_ceiling: fieldWithCeiling },
        logic: 'Relative gate: pick has no distance Beyer but 2+ rivals do — pick is the question mark in a room of answers.',
        result: { pick_has_ceiling: false, field_proven: fieldWithCeiling, total: allEntries.length },
        status: 'failed',
        message: `BLOCKED — Win pick unproven at distance, ${fieldWithCeiling}/${allEntries.length} rivals ARE proven`
      };
    }

    // Fallback mode: nobody (or < 2) has distance proof — rank by career Beyer, cap at MEDIUM
    if (fieldWithCeiling < 2) {
      fallbackMode = true;
      return {
        input: { field_with_ceiling: fieldWithCeiling, total: allEntries.length },
        logic: 'Fallback mode: < 2 horses proven at distance — everyone equally unproven. Use career Beyer, cap conviction at MEDIUM.',
        result: { fallback: true, field_proven: fieldWithCeiling },
        status: 'passed',
        message: `FALLBACK — Only ${fieldWithCeiling}/${allEntries.length} proven at distance. Career Beyer ranking, conviction capped.`
      };
    }

    return {
      input: { pick_has_ceiling: pickHasCeiling, field_with_ceiling: fieldWithCeiling },
      logic: 'Pick is proven at distance and rivals have proof too — normal mode.',
      result: { pick_dist_beyer: winPick.distanceBeyer, field_proven: fieldWithCeiling },
      status: 'passed',
      message: `Win pick proven (${winPick.distanceBeyer}) + ${fieldWithCeiling} rivals proven — normal mode`
    };
  });

  if (tracer.blocked) {
    const pickPPs = (winPick?.past_performances || []).length;
    const blockedReason = pickPPs < 3 ? 'too_few_career_races' : 'uniquely_unproven_at_distance';
    await writeScoredCandidate(pool, {
      raceId, date: DATE, status: 'blocked', blockedReason,
      conviction: 'BLOCKED', fieldSize: allEntries.length,
      paceScenario, faveVulnerable: vulnerable,
      favePP: fave?.post_position, faveName: fave?.horse_name,
      faveStyle: fave?.running_style, vulnerabilityReason: vulnReason || null,
      winPickPP: winPick?.post_position, winPickName: winPick?.horse_name,
      winPickML: winPick?.morning_line_odds, winPickStyle: winPick?.running_style,
      winPickBeyer: winPick?.best_beyer, winPickDistanceBeyer: winPick?.distanceBeyer,
      signals: winPick?.signalsFired || [], signalScore: winPick?.signalScore || 0,
      runId: RUN_ID
    });
    await tracer.complete({ conviction: 'BLOCKED' });
    return { raceId, status: 'blocked', track: race.track, raceNumber: race.race_number };
  }

  // STEP 16: Stake Sizing
  const doubled = vulnerable && allEntries.length >= 10;
  let winStake = winPick ? (doubled ? 100 : 50) : 0;
  let stakeNote = '';

  if (winPick && fave && fave.distanceBeyer && winPick.distanceBeyer && (fave.distanceBeyer - winPick.distanceBeyer) >= 8) {
    winStake = Math.round(winStake / 2);
    stakeNote = 'REDUCED — distance ceiling gap ≥8 vs fave';
  }

  await tracer.step('conclusion', 'Stake Sizing', 'warning', async () => {
    return {
      input: { vulnerable, field_size: allEntries.length, fave_dist_beyer: fave?.distanceBeyer, pick_dist_beyer: winPick?.distanceBeyer },
      logic: 'Base $50, doubled if vulnerable+10horses, halved if ceiling gap ≥8',
      result: { win: winStake, exacta: 60, doubled, reduced: !!stakeNote },
      status: stakeNote ? 'warning' : 'passed',
      message: stakeNote || `Win $${winStake}${doubled ? ' (doubled)' : ''} + Exacta $60`
    };
  });

  // STEP 16: Conviction (fallback mode uses career Beyer × 0.9 and caps at MEDIUM)
  const signalScore = winPick?.signalScore || 0;
  const distBeyer = fallbackMode ? Math.round((winPick?.best_beyer || 0) * 0.9) : (winPick?.distanceBeyer || 0);
  const mlOdds = parseOdds(winPick?.morning_line_odds);
  const oddsBonus = mlOdds >= 10 ? 2 : mlOdds >= 6 ? 1 : 0;
  let composite = (signalScore * 2) + (distBeyer / 10) + oddsBonus;

  // Strategy #41: Stale Beyer Penalty
  if (winPick && winPick.days_since_last && winPick.best_beyer && winPick.last_beyer) {
    const dayOff = winPick.days_since_last;
    const beyerGap = winPick.best_beyer - winPick.last_beyer;
    if (dayOff >= 60 && beyerGap >= 15) composite -= 4;
    else if (dayOff >= 45 && beyerGap >= 10) composite -= 2;
  }

  // Strategy #42: Pace Duel Fave Has Best Speed Figure — cap at MEDIUM (fave is less vulnerable)
  let paceDuelFaveBestSpeed = false;
  if (paceScenario === 'pace_duel' && fave) {
    const eTypeEntries = allEntries.filter(e => e.running_style === 'E' || e.running_style === 'E/P');
    const maxEBeyer = Math.max(...eTypeEntries.map(e => e.best_beyer || 0));
    if ((fave.best_beyer || 0) >= maxEBeyer && maxEBeyer > 0) paceDuelFaveBestSpeed = true;
  }

  // Strategy #35: Elite Connections Override
  if (fave && fave.trainer) {
    const eliteTrainers = ['Pletcher', 'Asmussen', 'Cox', 'Baffert', 'Brown Chad', 'Mott'];
    if (eliteTrainers.some(t => (fave.trainer || '').includes(t))) composite -= 2;
  }

  let conviction = (vulnerable && winPick && signalScore >= 3) ? 'HIGH' : (winPick && signalScore >= 2) ? 'MEDIUM' : 'LOW';
  if (fallbackMode && conviction === 'HIGH') conviction = 'MEDIUM';
  if (paceDuelFaveBestSpeed && conviction === 'HIGH') conviction = 'MEDIUM';

  // Strategy #19: Never Bet the Favorite — ML must be 7/2+ for Commission
  const pickOdds = parseOdds(winPick?.morning_line_odds);
  if (pickOdds && pickOdds < 3.5 && conviction === 'HIGH') {
    conviction = 'MEDIUM'; // Too short — no value, can't be Commission
  }

  // Strategy #32: Sprint Closer Penalty — S-type in sprint (≤6.5F) = reduce conviction
  if (winPick?.running_style === 'S' && raceYards && raceYards <= 1430 && conviction === 'HIGH') {
    conviction = 'MEDIUM'; // Closers can't close in sprints
  }

  // Longshot Audit: picks at 20-1+ get 5-point skepticism check
  if (pickOdds && pickOdds >= 20 && conviction === 'HIGH') {
    let auditFlags = 0;

    // 1. Is the Beyer real and recent?
    const daysSince = winPick?.days_since_last || 999;
    const bestBeyer = winPick?.best_beyer || 0;
    const lastBeyer = winPick?.last_beyer || 0;
    if (daysSince >= 45 && (bestBeyer - lastBeyer) >= 10) auditFlags++; // Stale figure
    if (!lastBeyer || lastBeyer === 0) auditFlags++; // No recent figure at all

    // 2. Speed horse at 20-1 in a pace duel = market says they can't run
    if ((winPick?.running_style === 'E' || winPick?.running_style === 'E/P') && paceScenario === 'pace_duel') auditFlags++;

    // 3. Are signals firing on real data or thin field?
    const horsesWithBeyers = allEntries.filter(e => e.best_beyer && e.best_beyer > 0).length;
    if (horsesWithBeyers < allEntries.length * 0.5) auditFlags++; // <50% have figures, scoring in the dark

    // 4. Signal score too low for the price
    if (signalScore < 4) auditFlags++;

    // 5. Best Beyer is not competitive with field ceiling
    const fieldCeiling = Math.max(...allEntries.map(e => e.best_beyer || 0));
    if (bestBeyer < fieldCeiling - 10) auditFlags++; // 10+ points below ceiling

    // Any 2+ flags = fail audit
    if (auditFlags >= 2) {
      conviction = 'MEDIUM'; // Longshot failed audit
    }
  }

  await tracer.step('conclusion', 'Conviction Level', 'info', async () => {
    return {
      input: { signal_score: signalScore, dist_beyer: distBeyer, odds_bonus: oddsBonus },
      logic: 'composite = (signals×2) + (distBeyer/10) + oddsBonus. HIGH: vulnerable+score≥3. MEDIUM: score≥2. LOW: else.',
      result: { composite: composite.toFixed(1), conviction },
      status: 'passed',
      message: `${conviction} — composite ${composite.toFixed(1)} (signals:${signalScore}×2 + beyer:${distBeyer}/10 + odds:${oddsBonus})`
    };
  });

  // STEP 17: Race Theory
  const theory = winPick
    ? `${paceScenario === 'pace_duel' ? 'Hot pace' : paceScenario === 'lone_speed' ? 'Lone speed' : 'No clear pace'} — ${vulnerable ? vulnReason.split(':')[1]?.trim() || 'fav vulnerable' : 'fav protected'}. Fav ${fave?.horse_name || '?'} (${fave?.running_style}, ${fave?.morning_line_odds}). Win pick: ${winPick.horse_name} (Beyer ${winPick.distanceBeyer || winPick.best_beyer || '?'}, ${winPick.running_style}, ${winPick.morning_line_odds}). Box: ${box.map(e => e.horse_name).join(', ')}.`
    : 'No qualified win pick';

  await tracer.step('conclusion', 'Race Theory', 'info', async () => {
    return {
      input: {},
      logic: 'Summarize thesis in natural language',
      result: { theory },
      status: 'passed',
      message: theory
    };
  });

  // Persist scored candidate (all conviction levels)
  await writeScoredCandidate(pool, {
    raceId, date: DATE, status: 'scored', conviction,
    composite, signalScore, oddsBonus,
    signals: winPick?.signalsFired || [],
    winPickPP: winPick?.post_position, winPickName: winPick?.horse_name,
    winPickML: winPick?.morning_line_odds, winPickStyle: winPick?.running_style,
    winPickBeyer: winPick?.best_beyer, winPickDistanceBeyer: winPick?.distanceBeyer,
    boxPPs: box.map(e => e.post_position), boxNames: box.map(e => e.horse_name),
    fieldSize: allEntries.length, paceScenario,
    faveVulnerable: vulnerable, favePP: fave?.post_position,
    faveName: fave?.horse_name, faveStyle: fave?.running_style,
    vulnerabilityReason: vulnReason || null,
    proposedWinStake: winStake, proposedExactaStake: 60, doubled,
    raceTheory: theory, runId: RUN_ID
  });

  // STEP 18: Write Bets (skip if no win pick or LOW conviction or candidates-only mode)
  if (winPick && conviction !== 'LOW' && !CANDIDATES_ONLY) {
    await tracer.step('save', 'Write Bets', null, async () => {
      const winPP = String(winPick.post_position);
      const boxPPs = [winPP, ...box.filter(e => String(e.post_position) !== winPP).map(e => String(e.post_position))];
      const { rows: [winBet] } = await pool.query(
        `INSERT INTO bets (race_id, bet_type, entries_used, stake, doubled, conviction) VALUES ($1, 'win', $2, $3, $4, $5) RETURNING id`,
        [raceId, boxPPs, winStake, doubled, conviction]
      );
      const { rows: [exBet] } = await pool.query(
        `INSERT INTO bets (race_id, bet_type, entries_used, stake, doubled, conviction) VALUES ($1, 'exacta', $2, $3, $4, $5) RETURNING id`,
        [raceId, boxPPs, 60, false, conviction]
      );

      // Tag strategy activations
      const activations = [];
      if (doubled) {
        await pool.query(`INSERT INTO strategy_activations (bet_id, strategy_id, rationale) VALUES ($1, 38, $2)`, [winBet.id, `Vulnerable fave (${vulnReason}) + ${allEntries.length} horses`]);
        activations.push('Doubled — Vulnerable Fave + Big Field');
      }
      if (vulnerable) {
        await pool.query(`INSERT INTO strategy_activations (bet_id, strategy_id, rationale) VALUES ($1, 1, $2)`, [winBet.id, vulnReason]);
        activations.push('Spot the Vulnerable Favorite');
      }
      for (const sig of (winPick.signalsFired || [])) {
        const stratMap = { S1: 6, S4: 3, S5: 10, S6: 7, S9: 4, S11: 25 };
        const stratId = stratMap[sig.id];
        if (stratId) {
          await pool.query(`INSERT INTO strategy_activations (bet_id, strategy_id, rationale) VALUES ($1, $2, $3)`, [winBet.id, stratId, sig.desc]);
          activations.push(sig.id);
        }
      }

      return {
        input: { race_id: raceId, conviction },
        logic: 'Insert win + exacta bets. No trifectas (6/21 rule). Tag strategy activations.',
        result: { win_bet_id: winBet.id, exacta_bet_id: exBet.id, win_stake: winStake, exacta_stake: 60, box: boxPPs, activations },
        status: 'passed',
        message: `Win $${winStake} + Exacta $60 written (bet IDs ${winBet.id}, ${exBet.id})${activations.length ? ' | Strategies: ' + activations.join(', ') : ''}`
      };
    });
  } else {
    await tracer.step('save', 'Write Bets', null, async () => {
      return {
        input: { conviction, has_win_pick: !!winPick },
        logic: 'Skip — no win pick or LOW conviction',
        result: { skipped: true },
        status: 'skipped',
        message: winPick ? 'LOW conviction — no bets written' : 'No win pick — no bets written'
      };
    });
  }

  // Complete trace
  const finalStatus = await tracer.complete({
    conviction,
    composite,
    winPickPP: winPick?.post_position || null,
    boxPPs: box.map(e => e.post_position),
    theory
  });

  return {
    raceId,
    status: finalStatus,
    track: race.track,
    raceNumber: race.race_number,
    conviction,
    composite,
    winPick: winPick ? { pp: winPick.post_position, name: winPick.horse_name, ml: winPick.morning_line_odds } : null,
    box: box.map(e => ({ pp: e.post_position, name: e.horse_name }))
  };
}

/**
 * Score all races for a given date. Exported for use by the pipeline.
 * @param {string} date - YYYY-MM-DD
 * @param {object} options - { candidatesOnly: boolean }
 * @returns {object} - { total, scored, blocked, commission, results }
 */
export async function runScorer(date, options = {}) {
  DATE = date;
  RUN_ID = generateRunId();
  CANDIDATES_ONLY = options.candidatesOnly || false;

  console.log(`\n=== SCORE WITH TRACE — ${DATE} ===`);
  console.log(`Run ID: ${RUN_ID}\n`);

  // Clear previous bets for this date (re-score replaces) — skip in candidates-only mode
  if (!CANDIDATES_ONLY) {
    await pool.query(`DELETE FROM strategy_activations WHERE bet_id IN (SELECT id FROM bets WHERE race_id IN (SELECT id FROM races WHERE date = $1))`, [DATE]);
    await pool.query(`DELETE FROM bets WHERE race_id IN (SELECT id FROM races WHERE date = $1)`, [DATE]);
  }

  // Clear previous scored candidates for this date
  await pool.query(`DELETE FROM scored_candidates WHERE date = $1`, [DATE]);
  console.log(`Cleared previous candidates for ${DATE}\n`);

  // Get qualified races
  const { rows: races } = await pool.query(`
    SELECT id, track, race_number, distance, surface, field_size, qualified, skip_reason
    FROM races WHERE date = $1 AND (qualified = true OR qualified IS NULL)
    ORDER BY track, race_number
  `, [DATE]);

  console.log(`Found ${races.length} races to score\n`);

  const results = [];
  for (const race of races) {
    try {
      console.log(`Scoring ${race.track} R${race.race_number} (${race.distance} ${race.surface})...`);
      const result = await scoreRace(race.id);
      if (result) {
        results.push(result);
        const icon = result.status === 'blocked' ? '🚫' : result.status === 'warning' ? '⚠️' : '✅';
        console.log(`  ${icon} ${result.status.toUpperCase()}${result.conviction ? ` [${result.conviction}]` : ''}${result.winPick ? ` → ${result.winPick.name} (${result.winPick.ml})` : ''}`);
      }
    } catch (err) {
      console.error(`  ❌ ERROR: ${err.message}`);
    }
  }

  const commission = results.filter(r => r.conviction === 'HIGH');
  const blocked = results.filter(r => r.status === 'blocked');

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total: ${results.length} | Passed: ${results.filter(r => r.status === 'passed').length} | Blocked: ${blocked.length}`);
  console.log(`Commission eligible (HIGH): ${commission.length}`);
  for (const r of commission.sort((a, b) => (b.composite || 0) - (a.composite || 0))) {
    console.log(`  ${r.track} R${r.raceNumber} [${r.conviction}] composite:${r.composite?.toFixed(1)} → ${r.winPick?.name} (${r.winPick?.ml})`);
  }

  return {
    total: results.length,
    scored: results.filter(r => r.status === 'passed').length,
    blocked: blocked.length,
    commission: commission.length,
    results
  };
}
