const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export async function notify(message) {
  console.log(`[ASSOCIATE] ${message}`);
  if (!SLACK_WEBHOOK_URL) return;

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `*[Associate]* ${message}` })
    });
  } catch (e) {
    console.error('[ASSOCIATE] Slack post failed:', e.message);
  }
}
