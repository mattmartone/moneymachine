import express from 'express';
import cron from 'node-cron';
import { query } from './lib/db.mjs';
import { notify } from './lib/notify.mjs';
import { scanCard, formatCardAlert } from './lib/racing-api.mjs';
import { checkScratches } from './lib/scratch-monitor.mjs';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
  try {
    const [{ now }] = await query('SELECT NOW() as now');
    res.json({ status: 'ok', time: now, version: '2.0.0 — The Spotter' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// Manual trigger: scan today's card
app.post('/scan', async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  try {
    const summaries = await scanCard(date);
    const msg = formatCardAlert(date, summaries);
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: msg })
    });
    res.json({ status: 'sent', tracks: summaries.length, qualifying: summaries.reduce((s, t) => s + t.qualifying, 0) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Manual trigger: run the morning hunt
app.post('/hunt', async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  try {
    await morningHunt(date);
    res.json({ status: 'complete', date });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================
// THE HUNT — Street Boss's daily mission
// ============================================

async function morningHunt(date) {
  // Step 1: What's running today? Sniff out the field.
  const summaries = await scanCard(date);

  if (summaries.length === 0) {
    await notify(
      '🏇 Morning Hunt — Nothing to chase',
      'Checked all target tracks. No qualifying races today (dirt, $25K+, 5+ field).',
      'Sitting. No action needed.'
    );
    return;
  }

  const totalQualifying = summaries.reduce((s, t) => s + t.qualifying, 0);

  // Step 2: Is Brisnet data already loaded for today?
  const races = await query('SELECT count(*) as count FROM races WHERE date = $1', [date]);
  const hasData = parseInt(races[0].count) > 0;

  if (hasData) {
    // Step 3a: Data exists — check if scoring has been done
    const scored = await query('SELECT count(*) as count FROM scored_candidates WHERE date = $1', [date]);
    const hasScored = parseInt(scored[0].count) > 0;

    if (hasScored) {
      // Already scored — report status
      const high = await query("SELECT count(*) as count FROM scored_candidates WHERE date = $1 AND conviction = 'HIGH'", [date]);
      await notify(
        '🏇 Morning Hunt — Card already scored',
        `Data loaded and scored. ${high[0].count} HIGH conviction races ready for Commission.`,
        'Awaiting Matt\'s selection.'
      );
    } else {
      // Data loaded but not scored — ready to score
      await notify(
        '🏇 Morning Hunt — Data loaded, ready to score',
        `Brisnet data found for ${date}. ${totalQualifying} qualifying races across ${summaries.length} tracks.`,
        'Scoring can run. Awaiting command or will auto-score when implemented.'
      );
    }
  } else {
    // Step 3b: No data — tell Matt what's out there
    let msg = `*[Street Boss]* 🏇 Morning Hunt — ${date}\n`;
    msg += `_${summaries.length} tracks scouted, ${totalQualifying} races look bettable._\n\n`;
    msg += `*Conditions are ripe at:*\n`;
    for (const t of summaries) {
      msg += `\n• *${t.track_name}* (${t.track_id}) — ${t.qualifying} qualifying:\n`;
      for (const r of t.qualifyingRaces) {
        const purseK = (r.purse / 1000).toFixed(0);
        msg += `    R${r.race_number}: ${r.conditions} | $${purseK}K | ${r.field_size} horses\n`;
      }
    }
    msg += `\n_Brisnet cost: $${(summaries.length * 1.50).toFixed(2)}_\n`;
    msg += `\nNo data loaded yet. Want me to wait for files, or are we sitting today?`;

    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: msg })
    });
  }
}

// ============================================
// SCHEDULED JOBS
// ============================================

// 7:00 AM — The Hunt begins. What's worth chasing today?
cron.schedule('0 7 * * *', async () => {
  const date = new Date().toISOString().split('T')[0];
  try {
    await morningHunt(date);
  } catch (e) {
    await notify('Morning Hunt Failed', '7:00 AM scheduled run', e.message);
  }
}, { timezone: 'America/New_York' });

// Every 10 min (11 AM - 10 PM) — Watch Commission races for scratches
cron.schedule('*/10 11-22 * * *', async () => {
  const date = new Date().toISOString().split('T')[0];
  try {
    await checkScratches(date);
  } catch (e) {
    console.error('[SCRATCH MONITOR] Error:', e.message);
  }
}, { timezone: 'America/New_York' });

app.listen(PORT, () => {
  console.log(`Street Boss v2.0 — The Spotter`);
  console.log(`Listening on port ${PORT}`);
  console.log(`Daily hunt at 7:00 AM ET. Scratch monitor 11 AM - 10 PM ET.`);
});
