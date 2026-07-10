import { readFileSync, statSync } from 'fs';
import { basename } from 'path';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;   // xoxb-... (image upload + approvals)
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID; // e.g. C0XXXXXXX

const APPROVE_EMOJI = 'white_check_mark'; // ✅
const REJECT_EMOJI = 'x';                 // ❌

// --- Low-level Slack Web API helpers (bot token) ---
async function slack(method, body, asJson = true) {
  const headers = { Authorization: `Bearer ${SLACK_BOT_TOKEN}` };
  let payload;
  if (asJson) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  else { headers['Content-Type'] = 'application/x-www-form-urlencoded'; payload = new URLSearchParams(body); }
  const res = await (await fetch(`https://slack.com/api/${method}`, { method: 'POST', headers, body: payload })).json();
  if (!res.ok) throw new Error(`${method}: ${res.error}`);
  return res;
}

let _botUserId = null;
async function botUserId() {
  if (_botUserId) return _botUserId;
  const auth = await slack('auth.test', {}, false);
  _botUserId = auth.user_id;
  return _botUserId;
}

// --- Plain text notification via the incoming webhook ---
export async function notify(message) {
  console.log(`[ASSOCIATE] ${message}`);
  if (!SLACK_WEBHOOK_URL) return;
  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `*[Associate]* ${message}` }),
    });
  } catch (e) {
    console.error('[ASSOCIATE] Slack post failed:', e.message);
  }
}

// --- Upload an image (cart screenshot) to Slack; webhook text fallback ---
export async function notifyImage(filePath, comment = '') {
  console.log(`[ASSOCIATE] (image) ${comment} -> ${filePath}`);
  if (!SLACK_BOT_TOKEN || !SLACK_CHANNEL_ID) {
    await notify(`${comment} (screenshot saved locally: ${filePath} — set SLACK_BOT_TOKEN + SLACK_CHANNEL_ID to post the image)`);
    return;
  }
  try {
    const bytes = readFileSync(filePath);
    const length = statSync(filePath).size;
    const filename = basename(filePath);
    const up = await slack('files.getUploadURLExternal', { filename, length: String(length) }, false);
    const putRes = await fetch(up.upload_url, { method: 'POST', body: bytes });
    if (!putRes.ok) throw new Error(`upload PUT failed: ${putRes.status}`);
    await slack('files.completeUploadExternal', { files: [{ id: up.file_id, title: filename }], channel_id: SLACK_CHANNEL_ID, initial_comment: comment });
    console.log('[ASSOCIATE] Screenshot posted to Slack.');
  } catch (e) {
    console.error('[ASSOCIATE] Slack image upload failed:', e.message);
    await notify(`${comment} (⚠️ image upload failed: ${e.message}. Screenshot saved: ${filePath})`);
  }
}

// --- Interactive approval via emoji reactions ---
// Posts the screenshot + an approval prompt, seeds ✅/❌ for one-tap, and returns
// the prompt message's timestamp so we can watch it.
export async function requestApproval(imagePath, promptText) {
  if (!SLACK_BOT_TOKEN || !SLACK_CHANNEL_ID) {
    await notify(`${promptText} (⚠️ Slack approvals need SLACK_BOT_TOKEN + SLACK_CHANNEL_ID)`);
    return null;
  }
  await notifyImage(imagePath, '🛒 Cart pending approval:');
  const msg = await slack('chat.postMessage', { channel: SLACK_CHANNEL_ID, text: promptText });
  // Seed the reaction options so the user can just tap one (ignore if scope missing).
  for (const emoji of [APPROVE_EMOJI, REJECT_EMOJI]) {
    try { await slack('reactions.add', { channel: SLACK_CHANNEL_ID, timestamp: msg.ts, name: emoji }, false); }
    catch (e) { console.log(`[ASSOCIATE] (could not seed :${emoji}: — ${e.message})`); }
  }
  console.log(`[ASSOCIATE] Approval requested (ts=${msg.ts}). Waiting for your ✅ / ❌ in Slack.`);
  return { ts: msg.ts, channel: SLACK_CHANNEL_ID };
}

// Reply in-thread on the approval message (keeps the ack attached to the request).
export async function replyInThread(handle, text) {
  if (!handle || !SLACK_BOT_TOKEN) { await notify(text); return; }
  try { await slack('chat.postMessage', { channel: handle.channel, thread_ts: handle.ts, text }); }
  catch (e) { console.error('[ASSOCIATE] thread reply failed:', e.message); await notify(text); }
}

// Add a reaction (e.g. an acknowledgement) to the approval message.
export async function react(handle, emoji) {
  if (!handle || !SLACK_BOT_TOKEN) return;
  try { await slack('reactions.add', { channel: handle.channel, timestamp: handle.ts, name: emoji }, false); }
  catch (e) { console.log(`[ASSOCIATE] (react :${emoji}: failed: ${e.message})`); }
}

// Polls the prompt message until a REAL user (not the bot) reacts ✅ or ❌.
// Returns 'approved' | 'rejected' | 'timeout'.
export async function waitForApproval(handle, { timeoutMs = 180000, pollMs = 5000 } = {}) {
  if (!handle) return 'timeout';
  const bot = await botUserId();
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, pollMs));
    try {
      const res = await slack('reactions.get', { channel: handle.channel, timestamp: handle.ts }, false);
      const reactions = res.message?.reactions || [];
      const approved = reactions.find(r => r.name === APPROVE_EMOJI && (r.users || []).some(u => u !== bot));
      const rejected = reactions.find(r => r.name === REJECT_EMOJI && (r.users || []).some(u => u !== bot));
      if (approved) return 'approved';
      if (rejected) return 'rejected';
    } catch (e) {
      console.log(`[ASSOCIATE] (approval poll error: ${e.message})`);
    }
  }
  return 'timeout';
}
