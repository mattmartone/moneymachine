// Day-thread hub + DRF file ingestion from Slack.
//
// Flow: one Slack thread per day. You upload .DRF/.zip files into that thread
// (from your phone, after buying on Brisnet). The Associate polls the thread,
// downloads new files with the bot token, parses them into Supabase, and replies
// in-thread with the results.
//
// Requires bot scopes: channels:history (+ groups:history if private), files:read,
// chat:write.
import { mkdirSync, writeFileSync, readdirSync } from 'fs';
import { execSync } from 'child_process';
import { query, pool } from './db.mjs';
import { parseDRFFile } from './parser.mjs';

const TOKEN = process.env.SLACK_BOT_TOKEN;
const CHANNEL = process.env.SLACK_CHANNEL_ID;

async function apiGet(method, params) {
  const url = new URL(`https://slack.com/api/${method}`);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await (await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } })).json();
  if (!r.ok) throw new Error(`${method}: ${r.error}`);
  return r;
}

async function apiPost(method, body) {
  const r = await (await fetch(`https://slack.com/api/${method}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })).json();
  if (!r.ok) throw new Error(`${method}: ${r.error}`);
  return r;
}

// Ensure a single day thread exists for the date; returns { ts, channel }.
export async function ensureDayThread(date) {
  await pool.query(`CREATE TABLE IF NOT EXISTS day_threads (
    date date PRIMARY KEY,
    thread_ts text NOT NULL,
    channel_id text NOT NULL,
    created_at timestamptz DEFAULT now()
  )`);
  const existing = await query('SELECT thread_ts, channel_id FROM day_threads WHERE date = $1', [date]);
  if (existing.length) return { ts: existing[0].thread_ts, channel: existing[0].channel_id };

  const msg = await apiPost('chat.postMessage', {
    channel: CHANNEL,
    text: `🏇 *FTC — ${date}*\nToday's thread. Cart approvals and DRF uploads live here. Drop the day's *.DRF* / *.zip* files as replies and I'll load them into the database.`,
  });
  await pool.query('INSERT INTO day_threads (date, thread_ts, channel_id) VALUES ($1, $2, $3)', [date, msg.ts, CHANNEL]);
  return { ts: msg.ts, channel: CHANNEL };
}

// All files uploaded anywhere in the thread.
export async function listThreadFiles(handle) {
  const r = await apiGet('conversations.replies', { channel: handle.channel, ts: handle.ts, limit: '200' });
  const files = [];
  for (const m of r.messages || []) {
    for (const f of m.files || []) {
      files.push({ id: f.id, name: f.name, url: f.url_private_download || f.url_private, mimetype: f.mimetype });
    }
  }
  return files;
}

async function downloadFile(file, destDir) {
  mkdirSync(destDir, { recursive: true });
  const res = await fetch(file.url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) throw new Error(`download ${file.name}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const dest = `${destDir}/${file.name}`;
  writeFileSync(dest, buf);
  return dest;
}

async function threadReply(handle, text) {
  try { await apiPost('chat.postMessage', { channel: handle.channel, thread_ts: handle.ts, text }); }
  catch (e) { console.error('[ASSOCIATE] thread reply failed:', e.message); }
}

// Download + parse any .DRF/.zip in the thread not already processed.
// Dedupe is persistent (DB table `ingested_files`) so restarts/reboots never
// re-parse or double-post. `seen` is an in-memory fast-path within a run.
export async function ingestThreadFiles(handle, date, seen = new Set()) {
  await pool.query(`CREATE TABLE IF NOT EXISTS ingested_files (
    file_id text PRIMARY KEY,
    filename text, date date, races int, entries int, ok boolean,
    ingested_at timestamptz DEFAULT now()
  )`);
  const files = await listThreadFiles(handle);
  const results = [];
  for (const f of files) {
    if (seen.has(f.id)) continue;
    if (!/\.(drf|zip)$/i.test(f.name)) { seen.add(f.id); continue; }
    const done = await query('SELECT 1 FROM ingested_files WHERE file_id = $1', [f.id]);
    if (done.length) { seen.add(f.id); continue; }
    seen.add(f.id);
    try {
      const path = await downloadFile(f, `downloads/${date}`);
      let races = 0, entries = 0;
      if (/\.zip$/i.test(f.name)) {
        const dir = path.replace(/\.zip$/i, '');
        mkdirSync(dir, { recursive: true });
        execSync(`unzip -o "${path}" -d "${dir}"`);
        for (const drf of readdirSync(dir).filter(x => /\.drf$/i.test(x))) {
          const p = await parseDRFFile(`${dir}/${drf}`);
          races += p.races; entries += p.entries;
        }
      } else {
        const p = await parseDRFFile(path);
        races += p.races; entries += p.entries;
      }
      await pool.query('INSERT INTO ingested_files (file_id, filename, date, races, entries, ok) VALUES ($1,$2,$3,$4,$5,true) ON CONFLICT (file_id) DO NOTHING', [f.id, f.name, date, races, entries]);
      results.push({ name: f.name, races, entries });
      console.log(`[ASSOCIATE] Parsed ${f.name}: ${races} races, ${entries} entries`);
      await threadReply(handle, `✅ Parsed *${f.name}* → ${races} races, ${entries} entries loaded into the DB.`);
    } catch (e) {
      console.error(`[ASSOCIATE] Failed ${f.name}:`, e.message);
      // Record the failure so a permanently-bad file doesn't retry every tick.
      await pool.query('INSERT INTO ingested_files (file_id, filename, date, ok) VALUES ($1,$2,$3,false) ON CONFLICT (file_id) DO NOTHING', [f.id, f.name, date]);
      await threadReply(handle, `❌ Couldn't parse *${f.name}*: ${e.message} (re-upload to retry)`);
    }
  }
  return { seen, results };
}
