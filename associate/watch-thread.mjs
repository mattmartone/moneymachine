// Always-on day-thread watcher.
//
//   node --env-file=.env watch-thread.mjs
//
// Every poll it computes the current local date, ensures that day's Slack thread
// exists (posting the root message the first time — this is the midnight rollover),
// and ingests any new .DRF/.zip files uploaded into it. Designed to run 24/7 via a
// LaunchAgent; errors in a tick are logged and never crash the loop.
import { ensureDayThread, ingestThreadFiles } from './lib/slack_ingest.mjs';

const POLL_MS = parseInt(process.env.INGEST_POLL_MS) || 15000;

const handleByDate = new Map(); // date -> { ts, channel }
const seenByDate = new Map();   // date -> Set(file ids)

function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function tick() {
  const date = localDate();
  try {
    if (!handleByDate.has(date)) {
      // New day (or first run): create/find the thread and start watching it.
      const handle = await ensureDayThread(date);
      handleByDate.set(date, handle);
      seenByDate.set(date, new Set());
      console.log(`[ASSOCIATE] ${new Date().toISOString()} — watching day thread for ${date} (ts=${handle.ts}).`);
    }
    const handle = handleByDate.get(date);
    const seen = seenByDate.get(date);
    const { results } = await ingestThreadFiles(handle, date, seen);
    if (results.length) {
      console.log(`[ASSOCIATE] ${date}: ingested ${results.map(r => `${r.name}(${r.races}r/${r.entries}e)`).join(', ')}`);
    }
  } catch (e) {
    console.error(`[ASSOCIATE] ${new Date().toISOString()} tick error (${date}):`, e.message);
  }
}

console.log(`[ASSOCIATE] Day-thread watcher started. Poll ${POLL_MS / 1000}s. Auto-rolls over to the new day thread at midnight (local time).`);
await tick();
setInterval(tick, POLL_MS);
