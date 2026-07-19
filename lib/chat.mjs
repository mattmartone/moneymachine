import Anthropic from '@anthropic-ai/sdk';
import { query } from './db.mjs';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

const SYSTEM_PROMPT = `You are Street Boss — the autonomous spotter and analyst for Fade the Chalk, a horse racing handicapping operation. You work for Matt.

Your personality: sharp, concise, no-BS. Talk like a seasoned racing guy who also happens to know data science. Keep responses tight — Matt's on mobile most of the time.

You have access to the Supabase database with today's races, entries, scores, and bets. Context about today's card will be provided with each message.

What you can help with:
- Today's qualifying races and status
- Scored candidates and signal breakdowns
- Commission picks and their theories
- Scratch alerts and field changes
- Odds movements and value shifts
- General handicapping questions about the data

What you DON'T do:
- Approve Commission picks (Matt only)
- Send member emails
- Make final betting decisions

Keep answers short. Use racing shorthand. If Matt asks something that needs a DB query you don't have context for, say what you'd need to look up.`;

async function getTodayContext() {
  const today = new Date().toISOString().split('T')[0];
  let context = `Date: ${today}\n`;

  try {
    const races = await query(
      `SELECT r.id, r.track, r.race_number, r.post_time, r.qualified, r.skip_reason, r.race_theory,
              COUNT(e.id) as field_size
       FROM races r LEFT JOIN entries e ON e.race_id = r.id AND e.scratched IS NOT TRUE
       WHERE r.date = $1
       GROUP BY r.id ORDER BY r.track, r.race_number`, [today]);

    if (races.length === 0) {
      context += 'No races loaded in DB for today.\n';
    } else {
      context += `\nRaces loaded: ${races.length}\n`;
      for (const r of races) {
        const status = r.skip_reason ? `SKIP(${r.skip_reason})` : r.qualified ? 'QUALIFIED' : 'pending';
        context += `  ${r.track} R${r.race_number} | ${r.field_size} horses | ${status}${r.post_time ? ' | PT:' + r.post_time : ''}\n`;
      }
    }

    const bets = await query(
      `SELECT b.bet_type, b.conviction, r.track, r.race_number, b.win_pick, b.entries_used, b.stake
       FROM bets b JOIN races r ON r.id = b.race_id
       WHERE r.date = $1 AND b.conviction = 'COMMISSION'
       ORDER BY r.post_time`, [today]);

    if (bets.length > 0) {
      context += `\nCommission picks: ${bets.length} bets across ${new Set(bets.map(b => b.track + ' R' + b.race_number)).size} races\n`;
      for (const b of bets) {
        context += `  ${b.track} R${b.race_number} | ${b.bet_type} | pick:${b.entries_used} | $${b.stake}\n`;
      }
    }

    const scored = await query(
      `SELECT sc.win_pick_name, sc.composite_score, sc.conviction, sc.fave_vulnerable,
              r.track, r.race_number
       FROM scored_candidates sc JOIN races r ON r.id = sc.race_id
       WHERE sc.date = $1 AND sc.status = 'scored'
       ORDER BY sc.composite_score DESC LIMIT 15`, [today]);

    if (scored.length > 0) {
      context += `\nTop scored candidates:\n`;
      for (const s of scored) {
        context += `  ${s.track} R${s.race_number} | ${s.win_pick_name} | composite:${s.composite_score} | ${s.conviction} | vuln:${s.fave_vulnerable}\n`;
      }
    }
  } catch (e) {
    context += `\nDB query error: ${e.message}\n`;
  }

  return context;
}

export async function handleChat(userMessage, channel, threadTs) {
  const context = await getTodayContext();

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `[TODAY'S CONTEXT]\n${context}\n\n[MATT'S MESSAGE]\n${userMessage}`
    }]
  });

  const reply = response.content[0].text;

  await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      channel,
      thread_ts: threadTs,
      text: reply
    })
  });

  return reply;
}
