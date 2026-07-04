import express from 'express';
import cron from 'node-cron';
import { query } from './lib/db.mjs';
import { notify } from './lib/notify.mjs';
import { scanCard, formatCardAlert } from './lib/racing-api.mjs';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
  try {
    const [{ now }] = await query('SELECT NOW() as now');
    res.json({ status: 'ok', time: now, version: '1.0.0' });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// Test notification
app.post('/test-notify', async (req, res) => {
  await notify('System Test', 'Verifying Slack connection', 'Street Boss is alive and connected.');
  res.json({ status: 'sent' });
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

// Manual trigger: score a date
app.post('/score', async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  res.json({ status: 'queued', date, message: 'Scoring not yet implemented — Sprint 1 Step 5' });
});

// Manual trigger: pull racing API
app.post('/pull-api', async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  res.json({ status: 'queued', date, message: 'Racing API pull not yet implemented — Sprint 1 Step 3' });
});

// Scheduled jobs (ET timezone)
// 9:00 AM — Scan card and alert Matt
cron.schedule('0 9 * * *', async () => {
  const date = new Date().toISOString().split('T')[0];
  try {
    const summaries = await scanCard(date);
    const msg = formatCardAlert(date, summaries);
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: msg })
    });
    console.log(`[CRON 9:00 AM] Card scan complete: ${summaries.length} tracks, ${summaries.reduce((s, t) => s + t.qualifying, 0)} qualifying`);
  } catch (e) {
    await notify('Card Scan Failed', 'Scheduled 9:00 AM', e.message);
  }
}, { timezone: 'America/New_York' });

// 7:00 AM — Score all qualified races
cron.schedule('0 7 * * *', async () => {
  await notify('Scoring Card', 'Scheduled 7:00 AM — run Phase 1-5 on all qualified races', 'Starting...');
  // TODO: Sprint 1 Step 5
  await notify('Scoring Card', 'Complete', 'Not yet implemented');
}, { timezone: 'America/New_York' });

// 7:05 AM — Run insights
cron.schedule('5 7 * * *', async () => {
  await notify('Insights', 'Scheduled 7:05 AM — signal combos, day confidence', 'Starting...');
  // TODO: Sprint 1 Step 6
  await notify('Insights', 'Complete', 'Not yet implemented');
}, { timezone: 'America/New_York' });

app.listen(PORT, () => {
  console.log(`Street Boss listening on port ${PORT}`);
  console.log('Crons scheduled: 6:00 AM (API), 7:00 AM (Score), 7:05 AM (Insights)');
});
