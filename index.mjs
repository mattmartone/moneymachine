import express from 'express';
import cron from 'node-cron';
import { query } from './lib/db.mjs';

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
// 6:00 AM — Pull Racing API
cron.schedule('0 6 * * *', async () => {
  console.log('[CRON 6:00 AM] Pulling Racing API...');
  // TODO: Sprint 1 Step 3
}, { timezone: 'America/New_York' });

// 7:00 AM — Score all qualified races
cron.schedule('0 7 * * *', async () => {
  console.log('[CRON 7:00 AM] Scoring card...');
  // TODO: Sprint 1 Step 5
}, { timezone: 'America/New_York' });

// 7:05 AM — Run insights
cron.schedule('5 7 * * *', async () => {
  console.log('[CRON 7:05 AM] Running insights...');
  // TODO: Sprint 1 Step 6
}, { timezone: 'America/New_York' });

app.listen(PORT, () => {
  console.log(`Street Boss listening on port ${PORT}`);
  console.log('Crons scheduled: 6:00 AM (API), 7:00 AM (Score), 7:05 AM (Insights)');
});
