const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const RUNS_DIR = path.join(__dirname, 'runs');
if (!fs.existsSync(RUNS_DIR)) fs.mkdirSync(RUNS_DIR);

// Save state
app.post('/api/state', (req, res) => {
  const statePath = path.join(__dirname, 'public', 'state.json');
  fs.writeFileSync(statePath, JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

// Get state
app.get('/api/state', (req, res) => {
  const statePath = path.join(__dirname, 'public', 'state.json');
  if (fs.existsSync(statePath)) {
    res.json(JSON.parse(fs.readFileSync(statePath, 'utf8')));
  } else {
    res.json({});
  }
});

// Save an analysis run
app.post('/api/runs', (req, res) => {
  const { raceNumber, timestamp, prompt, result } = req.body;
  const filename = `R${raceNumber}_${timestamp.replace(/[: ]/g, '-')}.json`;
  const data = { raceNumber, timestamp, prompt, result };
  fs.writeFileSync(path.join(RUNS_DIR, filename), JSON.stringify(data, null, 2));
  res.json({ ok: true, filename });
});

// Get all runs for a race
app.get('/api/runs/:raceNumber', (req, res) => {
  const rNum = req.params.raceNumber;
  const files = fs.readdirSync(RUNS_DIR).filter(f => f.startsWith(`R${rNum}_`) && f.endsWith('.json'));
  const runs = files.map(f => {
    try { return JSON.parse(fs.readFileSync(path.join(RUNS_DIR, f), 'utf8')); }
    catch(e) { return null; }
  }).filter(Boolean).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(runs);
});

// Get all runs (all races)
app.get('/api/runs', (req, res) => {
  const files = fs.readdirSync(RUNS_DIR).filter(f => f.endsWith('.json'));
  const runs = files.map(f => {
    try { return JSON.parse(fs.readFileSync(path.join(RUNS_DIR, f), 'utf8')); }
    catch(e) { return null; }
  }).filter(Boolean).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(runs);
});

// AI Analysis — calls local Claude Code CLI
app.post('/api/analyze', (req, res) => {
  req.setTimeout(180000);
  res.setTimeout(180000);
  const { race, signals, rules, liveOdds } = req.body;

  const scratches = race.scratches || [];
  const liveHorses = race.horses.filter(h => !scratches.includes(h.number));
  const activeRules = rules.filter(r => r.active);
  const activeSignals = signals.filter(s => s.active);

  const fieldDesc = liveHorses.map(h => {
    const lo = (liveOdds || {})[h.number] || '';
    return `#${h.number} ${h.name} | ML: ${h.ml}${lo ? ' | LIVE ODDS: '+lo : ''} | J: ${h.jockey} | T: ${h.trainer} | ${h.notes || ''}`;
  }).join('\n');

  const rulesDesc = activeRules.map(r => `${r.id}: ${r.name} — ${r.description}`).join('\n');
  const signalsDesc = activeSignals.map(s => {
    let line = `${s.id} (weight +${s.weight}): ${s.name} — ${s.description}`;
    if (s.detection) line += `\n   DETECTION: ${s.detection}`;
    if (s.dataStatus === 'yellow') line += `\n   ⚠️ NEEDS MANUAL INPUT: ${s.dataNote || 'Check live odds'}`;
    if (s.dataStatus === 'red') line += `\n   🚫 NOT AVAILABLE: ${s.dataNote || 'Cannot evaluate from DRF data'}`;
    return line;
  }).join('\n\n');

  const prompt = `You are the Money Machine AI handicapper. Your job is to analyze the DRF past performance data below and execute our betting strategy to produce bet recommendations.

RACE: R${race.number} — ${race.name}
Distance: ${race.distance} | Surface: ${race.surface} | Purse: ${race.purse || 'N/A'}
Condition: ${race.condition || 'N/A'}
Live Runners: ${liveHorses.length}

FIELD (Full DRF Past Performance Data):
${fieldDesc}

=== OUR STRATEGY ===

RULES (hard gates — MUST follow, no exceptions):
${rulesDesc}

SCORING SIGNALS (evaluate every horse — assign points per signal triggered, sum for total score):
${signalsDesc}

=== YOUR TASK ===

Work through the DRF data for EACH horse systematically:

STEP 1 — HORSE-BY-HORSE EVALUATION:
For each horse, read their past performance data and determine:
- Recent form (last 3 races: wins, places, beaten lengths, Beyer figures)
- Surface/distance fit (have they won at this distance? On this surface? D.Fst record?)
- Connections quality (jockey win%, trainer win% at meet, jockey/trainer combo)
- Class movement (moving up, down, or lateral? Purchase price vs claiming price?)
- Running style (speed, stalker, closer — based on race descriptions)

STEP 2 — SIGNAL SCORING:
For each horse, check EVERY active signal. Assign the signal's weight if triggered. Sum total score per horse.

STEP 3 — PACE ANALYSIS:
Who has early speed? Will there be a pace duel or a lone front-runner? Which running styles benefit from the likely pace scenario?

STEP 4 — PICKS (enforcing all RULES):
- WIN: Highest-value horse at 7/2+ odds that is NOT the favorite. Best signal score + form + value combination.
- EXACTA BOX: 3 horses. Must include the favorite.
- TRIFECTA BOX: 4+ horses. Must include ALL exacta horses (Rule R6).

Respond in EXACTLY this JSON format, no other text:
{"win":{"horse":0,"name":"","odds":"","reason":""},"exacta":{"horses":[]},"trifecta":{"horses":[]},"notes":"","analysis":"","signalBreakdown":[{"id":"B1","fired":false,"horses":[],"reasoning":""}]}

- win.horse = post position number
- win.reason = 2-3 sentences: which signals triggered, why this horse over others at a price
- exacta.horses and trifecta.horses = arrays of post position numbers, sorted ascending
- notes = pivot conditions (e.g. "if #1 moves to fav, pivot win to #5")
- analysis = full paragraph covering: pace read, class analysis, and why the final picks represent the best value
- signalBreakdown = array with one entry PER active signal: {"id":"B1","fired":true/false,"horses":[numbers of horses it fired on],"reasoning":"what you found in the data and why it did or didn't fire"}`;

  const claudePath = '/Users/matt.martone/.local/bin/claude';
  const child = spawn(claudePath, ['-p', '--output-format', 'json', '--model', 'sonnet'], {
    env: { ...process.env }
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', d => { stdout += d.toString(); });
  child.stderr.on('data', d => { stderr += d.toString(); });

  // Write prompt to stdin and close
  child.stdin.write(prompt);
  child.stdin.end();

  child.on('close', (code) => {
    if (code !== 0) {
      console.error('Claude exit code:', code, stderr.substring(0, 500));
      return res.status(500).json({ error: 'Claude failed (exit ' + code + ')', raw: stderr.substring(0, 500) });
    }

    try {
      let parsed;
      // Claude --output-format json returns {"type":"result","result":"..."}
      const wrapper = JSON.parse(stdout);
      if (wrapper && wrapper.result) {
        const jsonMatch = wrapper.result.match(/\{[\s\S]*"win"[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } else if (wrapper && wrapper.win) {
        parsed = wrapper;
      }

      if (!parsed || !parsed.win) {
        const jsonMatch = stdout.match(/\{[\s\S]*"win"[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      }

      if (!parsed || !parsed.win) {
        return res.status(500).json({ error: 'Could not parse AI response', raw: stdout.substring(0, 800) });
      }

      res.json(parsed);
    } catch (parseErr) {
      console.error('Parse error:', parseErr.message);
      res.status(500).json({ error: 'Parse failed: ' + parseErr.message, raw: stdout.substring(0, 800) });
    }
  });

  child.on('error', (err) => {
    console.error('Spawn error:', err.message);
    res.status(500).json({ error: 'Failed to start Claude: ' + err.message });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Money Machine live on port ${PORT}`);
});
