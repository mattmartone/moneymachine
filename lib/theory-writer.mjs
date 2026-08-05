import { pool } from './db.mjs';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You write race theories for a horse racing handicapping service called Fade the Chalk. Your audience is both beginners (who need plain English) and veterans (who should respect the analysis).

Rules:
- 3-5 sentences max
- Name the horses by name, not just post position
- Explain what is physically going to happen on the track
- Explain WHY — what data points to this conclusion
- No jargon without immediate explanation
- No abbreviations (say "speed figure" not "Beyer", say "post position 1" or "the rail" not "PP1")
- The tone is confident and direct — you're explaining what WILL happen, not what might
- Never say "our model" or "the system" — just state the thesis as fact`;

export async function writeTheories(date) {
  // Get Commission races with full data
  const { rows: candidates } = await pool.query(`
    SELECT sc.*, r.track, r.race_number, r.conditions, r.distance, r.field_size, r.purse
    FROM scored_candidates sc
    JOIN races r ON r.id = sc.race_id
    WHERE sc.date = $1 AND sc.conviction = 'HIGH' AND sc.status = 'scored'
    ORDER BY sc.composite_score DESC
    LIMIT 10
  `, [date]);

  if (candidates.length === 0) {
    console.log('[THEORIES] No Commission candidates to write theories for');
    return { written: 0 };
  }

  console.log(`[THEORIES] Writing theories for ${candidates.length} races...`);

  let written = 0;
  for (const c of candidates) {
    // Get full field for this race
    const { rows: entries } = await pool.query(`
      SELECT e.post_position, h.name, e.running_style, e.best_beyer, e.last_beyer,
             e.morning_line_odds, e.jockey, e.trainer, e.days_since_last, e.scratched
      FROM entries e JOIN horses h ON h.id = e.horse_id
      WHERE e.race_id = $1 AND (e.scratched IS NULL OR e.scratched = false)
      ORDER BY e.post_position
    `, [c.race_id]);

    const fieldSummary = entries.map(e =>
      `PP${e.post_position} ${e.name} (${e.running_style || '?'}, Beyer ${e.best_beyer || '?'}/${e.last_beyer || '?'}, ML ${e.morning_line_odds || '?'}, ${e.jockey || '?'}, ${e.trainer || '?'}, ${e.days_since_last || '?'} days off)`
    ).join('\n');

    const prompt = `Write a race theory for this race:

Track: ${c.track} Race ${c.race_number}
Conditions: ${c.conditions}
Distance: ${c.distance} | Field: ${c.field_size} horses | Purse: $${(c.purse/1000).toFixed(0)}K

Vulnerability: ${c.vulnerability_reason}
Pace scenario: ${c.pace_scenario}
Favorite: ${c.fave_name} (post ${c.fave_pp}, style: ${c.fave_style})
Our pick: ${c.win_pick_name} (post ${c.win_pick_pp}, style: ${c.win_pick_style}, ML ${c.win_pick_ml}, best speed figure ${c.win_pick_beyer})
Box: ${(c.box_names || []).join(', ')}

Signals firing: ${[c.s1_fired?'Elite jockey on longshot':'', c.s4_fired?'Speed figure at distance ceiling':'', c.s5_fired?'Stretching out in distance':'', c.s6_fired?'Best recent speed figure':'', c.s9_fired?'Class edge/distance leader':''].filter(Boolean).join(', ') || 'none'}

Full field:
${fieldSummary}

Write the theory. Explain what will happen on the track and why the favorite is vulnerable. Name horses. 3-5 sentences.`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }]
      });

      const theory = response.content[0]?.text?.trim();
      if (theory) {
        await pool.query(`UPDATE races SET race_theory = $1 WHERE id = $2`, [theory, c.race_id]);
        written++;
        console.log(`[THEORIES] ${c.track} R${c.race_number}: done`);
      }
    } catch (err) {
      console.error(`[THEORIES] ${c.track} R${c.race_number} failed: ${err.message}`);
      // Fallback to template theory
      const fallback = `${c.field_size} horses, ${c.distance}. The favorite ${c.fave_name} (${c.fave_style} style) is vulnerable: ${c.vulnerability_reason}. ${c.win_pick_name} at ${c.win_pick_ml} has a ${c.win_pick_beyer} speed figure and is positioned to capitalize.`;
      await pool.query(`UPDATE races SET race_theory = $1 WHERE id = $2`, [fallback, c.race_id]);
      written++;
    }
  }

  console.log(`[THEORIES] Written ${written}/${candidates.length} theories`);
  return { written };
}
