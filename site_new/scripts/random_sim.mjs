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

const DATE = process.argv[2] || new Date().toISOString().split('T')[0];
const SIMS = parseInt(process.argv[3]) || 1000;

function factorial(n) { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
function permutations(n, k) { return factorial(n) / factorial(n - k); }

async function run() {
  // Get our Commission bets for the date
  const { rows: ourBets } = await pool.query(`
    SELECT b.race_id, b.entries_used, b.stake,
      r.track, r.race_number,
      e_win.post_position as winner_pp, e_place.post_position as place_pp,
      res.win_payout, res.exacta_payout
    FROM bets b
    JOIN races r ON r.id = b.race_id
    JOIN results res ON res.race_id = r.id
    JOIN entries e_win ON e_win.id = res.win_entry_id
    JOIN entries e_place ON e_place.id = res.place_entry_id
    WHERE r.date = $1 AND b.conviction = 'COMMISSION' AND b.bet_type = 'win'
  `, [DATE]);

  if (!ourBets.length) { console.log('No Commission bets found for ' + DATE); await pool.end(); return; }

  const numRaces = ourBets.length;

  // Our model P/L
  let modelCollected = 0, modelWagered = 0;
  for (const race of ourBets) {
    const pps = race.entries_used.map(Number);
    const n = pps.length;
    modelWagered += race.stake + 60;
    if (pps[0] === race.winner_pp && race.win_payout > 0) {
      modelCollected += (race.win_payout / 2) * race.stake;
    }
    if (pps.includes(race.winner_pp) && pps.includes(race.place_pp) && race.exacta_payout > 0) {
      modelCollected += race.exacta_payout * (60 / permutations(n, 2));
    }
  }
  const modelNet = modelCollected - modelWagered;

  // Get ALL scored races with results (the full pool)
  const { rows: allRaces } = await pool.query(`
    SELECT sc.race_id, r.track, r.race_number, r.field_size,
      e_win.post_position as winner_pp, e_place.post_position as place_pp,
      res.win_payout, res.exacta_payout
    FROM scored_candidates sc
    JOIN races r ON r.id = sc.race_id
    JOIN results res ON res.race_id = r.id
    JOIN entries e_win ON e_win.id = res.win_entry_id
    JOIN entries e_place ON e_place.id = res.place_entry_id
    WHERE sc.date = $1 AND sc.status = 'scored'
  `, [DATE]);

  // Get fields for each race
  const raceFields = {};
  for (const race of allRaces) {
    if (!raceFields[race.race_id]) {
      const { rows: entries } = await pool.query(
        'SELECT post_position FROM entries WHERE race_id = $1 AND (scratched IS NULL OR scratched = false)',
        [race.race_id]
      );
      raceFields[race.race_id] = entries.map(e => e.post_position);
    }
  }

  // Run simulations: pick N random races, random horses
  const randomNets = [];
  for (let sim = 0; sim < SIMS; sim++) {
    const shuffledRaces = [...allRaces].sort(() => Math.random() - 0.5).slice(0, numRaces);
    let simCollected = 0, simWagered = 0;

    for (const race of shuffledRaces) {
      const field = raceFields[race.race_id];
      if (!field || field.length < 3) continue;

      const boxSize = Math.min(4, field.length);
      const shuffledField = [...field].sort(() => Math.random() - 0.5);
      const randomPick = shuffledField[0];
      const randomBox = shuffledField.slice(0, boxSize);

      simWagered += 50 + 60;
      if (randomPick === race.winner_pp && race.win_payout > 0) {
        simCollected += (race.win_payout / 2) * 50;
      }
      if (randomBox.includes(race.winner_pp) && randomBox.includes(race.place_pp) && race.exacta_payout > 0) {
        simCollected += race.exacta_payout * (60 / permutations(boxSize, 2));
      }
    }
    randomNets.push(simCollected - simWagered);
  }

  const sorted = [...randomNets].sort((a, b) => a - b);
  const avgRandom = randomNets.reduce((s, n) => s + n, 0) / SIMS;
  const medianRandom = sorted[Math.floor(SIMS / 2)];
  const modelBeats = randomNets.filter(n => modelNet > n).length;
  const pctBeats = ((modelBeats / SIMS) * 100).toFixed(1);

  console.log(`\n=== MODEL VS RANDOM (full card) — ${DATE} ===`);
  console.log(`Our races: ${numRaces} | Pool: ${allRaces.length} scored with results | Sims: ${SIMS}`);
  console.log(``);
  console.log(`Model:   net $${modelNet.toFixed(0)} (wagered $${modelWagered}, collected $${modelCollected.toFixed(0)})`);
  console.log(`Random:  avg $${avgRandom.toFixed(0)} | median $${medianRandom.toFixed(0)}`);
  console.log(``);
  console.log(`Model beats ${pctBeats}% of random simulations`);
  console.log(`Edge vs median: $${(modelNet - medianRandom).toFixed(0)}`);

  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
