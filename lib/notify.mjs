const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export async function notify(action, reason, outcome) {
  let text = `*[Street Boss]* ${action}`;
  if (reason) text += `\n_Why:_ ${reason}`;
  if (outcome) text += `\n_Result:_ ${outcome}`;
  console.log(`[NOTIFY] ${action}${reason ? ` | ${reason}` : ''}${outcome ? ` | ${outcome}` : ''}`);

  if (!SLACK_WEBHOOK_URL) return;

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
  } catch (e) {
    console.error('[NOTIFY] Slack post failed:', e.message);
  }
}
