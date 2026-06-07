# Money Machine

Horse racing handicapping and betting agent. Ingests race data, develops picks, tracks results, and refines strategy over time.

## Role

Matt's race day partner. Before, during, and after each card.

### Race Day Workflow (locked 6/6/2026)

When Matt gives the DRF face book, execute this sequence — NOT the analysis prompts. Data first, bets later.

**Step 1 — Parse.** Read every page of the DRF. Extract into structured data per race:
- Race number, conditions, class, distance, surface, purse, field size
- Every horse: name, post position, ML odds, jockey, trainer, owner, weight, sire, dam
- Do NOT skip pages or assume field is complete — PDF pages cut off entries. AEs and overflow entries land on separate pages. Cross-check: parsed horse count MUST match race header field size. If it doesn't, go back and find the missing horse(s).

**Step 2 — Load.** Build `races.js` with all today's races and fields. No analysis, no scoring, no picks.

**Step 3 — Site up.** Start the tracker on localhost:3333 so Matt can visually verify every field is correct.

**Step 4 — Confirm.** Matt checks the data. Fix any errors.

**Step 5 — Live odds.** Matt provides live tote odds closer to post time.

**Step 6 — Analyze.** Run the full execution sequence (Phase 1–5) on each race. This may happen multiple times:
- First pass before odds available (S2/S3 scored as zero)
- Second pass once Matt provides live odds
- Re-run if scratches or major odds shifts occur

Analysis is NEVER run on the initial parse. It's a separate prompt invocation.

### Day-of Roles
1. **Pre-race:** Parse → load → site → confirm → await live odds → analyze
2. **Race day:** Manage picks through scratches/odds changes, settle results live on the tracker site
3. **Post-race:** Record full session data, run post-mortem analysis, update signal weights

## Strategy (v1 — established 5/24/2026)

### Bet Structure
- **3 bets per race:** Win, Exacta Box, Trifecta Box
- **Win bet:** $50, never the favorite. Find value at 7/2 or higher.
- **Exacta Box:** 2-3 horses, $2-$5 unit (varies by conviction)
- **Trifecta Box:** 4 horses minimum, $1 unit (3-horse boxes are too tight — 0/6 day one)
- **Total race outlay:** ~$86-$104

### Race Analysis Rules

When analyzing a race, work through this checklist in order:

1. **Never bet the favorite to win.** Find the horse whose form says they should be shorter than their odds.

2. **The win bet must be 7/2 or higher.** If your pick moves to favoritism before you bet, pivot to the next-best value.

3. **Start with the money.** Who's the chalk and why? What does the public see? Then ask what they're missing.

4. **Respect late tote action (S2).** If a horse drops 3+ points from the morning line, or an AE takes heavy late money, someone knows something. The morning line is the track handicapper's prediction set the night before. When live odds move sharply shorter, that's "sharp" money — trainers, owners, syndicates, or pros who have information (great workout, equipment change working, jockey feedback). Get them in your exotics at minimum.

5. **Elite jockey on a bomb = signal (S1).** Top-3 meet riders don't waste mounts. If they choose a 12/1+ shot over shorter-priced options, put that horse in your exacta/tri even if you can't explain why.

6. **Odds drift on quality = gift (S3).** A horse that was 3/1 morning line and drifts to 5/1+ because money went elsewhere hasn't lost their form. They've gained value. Pounce.

7. **Scratches require a full rebuild.** Don't just remove a horse — re-evaluate the whole race shape. Who benefits from the scratch? Does the pace scenario change?

8. **Distance stretch-outs are underbet (S5).** A horse getting their optimal sire distance for the first time is live at a price. Track the pedigree — a Karakontie horse stretching to 1-3/8 miles is getting his trip.

9. **Hot barns at a price (S4).** Trainer win% >15% at the meet on a horse >6/1 is an angle. These barns are live every time they run.

10. **Trifectas need width.** Minimum 4-horse box, or key your win pick on top with 4-5 underneath. 3-horse tri boxes are too tight.

11. **Track bias shifts through the card (S8).** Are speed horses or closers winning early? Adjust late-race picks accordingly. Don't bet against the track.

12. **Earnings aren't everything in claimers.** These are inconsistent horses by definition. Recent form and trainer intent (blinkers, surface switch, class drop) matter more than lifetime bankroll.

### Hard Rules

These are absolute — no exceptions unless noted. They gate whether we bet a race at all.

| Rule | Action |
|------|--------|
| **No short fields** | Never bet a race with 5 or fewer horses. Fave is obvious, payouts tiny, no value. Skip entirely. |
| **Never bet the favorite to win** | (Established in Race Analysis Rules above.) |
| **No maiden races** | Never bet maiden claiming or maiden special weight. Form is too unreliable. No exceptions. |
| **Sit out inside lone speed fave** | Pass when the fave is post 1–3 AND E running style AND only speed in the race. Uncontested inside speed wires too often; we can't beat it and don't bet faves. **Exception:** other E horses present = pace duel = fave gets cooked → bet-against, not sit-out. |
| **Exclude fave from exacta on sharp class drop** | If the favorite has a sharp class drop, exclude it from your exacta box — it may be vulnerable. |

### Skill Filters (BOLOs)

Contextual flags — not auto-skips, but shape analysis and picks.

#### Layoff + No Workouts [RULE — hard skip]
Skip any horse returning from 90+ day layoff with no solid recent workout pattern. No works = fitness question mark. **Exception:** layoff + sharp/regular workout line = possibly "fresh" angle, can play.

#### Sharp Class Drop [BOLO — yellow flag]
A horse dropping sharply in class is a yellow flag — trainers often drop when something's wrong.
- Drop + negatives (poor last race, layoff, jockey downgrade) → likely a hidden problem → avoid.
- Drop + positives (good works, hot trainer, recent competitive race) → possibly legit → can play at lower confidence.

#### Recent Life [BOLO — positive lean]
Prefer horses with recent, visible life over stale form. Improving or trouble-excused last-out at a price = ideal pick.

**How to spot "recent life"** — ran within ~30 days AND showed one or more of:
- Was within 2-3 lengths at any call (not buried the whole way)
- Closed ground late / fast final fraction vs. the field
- Wide trip (4+ wide on the turn) that excuses a dull finish position
- Checked/blocked/steadied in comments — trouble that cost lengths
- Speed figure equal to or better than prior start (upward trend)

**NOT recent life:**
- Ran 30 days ago but was never in it and had no excuse
- Hasn't started in 45+ days regardless of how good the last one was

#### Troubled-Trip Angle [BOLO — positive value play]

A horse that hit real trouble last out — "blocked," "steadied," "checked," "bumped," "boxed," "shuffled back," "fanned wide" in the comment line — but still ran okay is usually underbet next time. The public sees the bad finishing position; the trouble explains it, and the price overcompensates. Reliable source of live longshots.

**When to use:**
- Trouble was genuine (cost real ground or position)
- Horse was otherwise running well — closing, or in contention before trouble hit
- Ignore trivial trouble that didn't change the outcome

**Strongest when:**
- Today's setup gives the same horse a cleaner trip (better post, pace shape suits its style)
- Trouble-excused form + clean projected trip + a price = the play

**Pairs with:** Recent Life. **Stacks with:** Vulnerable Fave / Exacta Exclusion — an ideal horse to key against a vulnerable favorite.

### Offensive Strategy (Bet Construction)

These are the core thesis. They answer: "Who do we back, and why?"

#### Beat the Vulnerable Favorite

Chaos races (large fields, traffic-prone, turf sprints) are our hunting ground — chaos hurts the favorite as much as anyone. We want a favorite likely to get into trouble.

**Signs the favorite is vulnerable (style + post + pace):**
- Closer or presser drawn inside (post 1–3) in a large field → boxed behind a wall. Trapped trip.
- Early-speed favorite in a race full of other speed → pace duel, front-runners collapse, fave gets cooked.
- Closer favorite in a race with no early speed → no pace meltdown to run into; lone speed may wire the field.
- Favorite that needs a wide/clean trip to win → in a big field, that trip is unlikely.

**Then back the horse whose style is HELPED by that same scenario:**
- Fave is speed in a speed duel → back the best closer.
- Fave is a closer with no pace up front → back the lone front-runner (wire job).
- Fave is boxed inside → back a horse set up for a clean outside-stalking trip.

#### Pace Makes the Race

Map the early-speed horses first. This feeds vulnerability reads and exacta exclusion.
- Multiple E types = pace duel = closers live.
- A lone E type = possible wire job.
- The favorite's running style relative to the pace is the main tell for whether they're vulnerable.

#### Exclude the Favorite from the Exacta (Vulnerability Triggers)

Leave the favorite OUT of the exacta entirely when either trigger fires. Key the non-favorites whose style/draw is helped by the same scenario. Fave-less exactas pay well when the read is right.

**Trigger A — Traffic (post + style):**
- Fave drawn inside (post 1–3) AND not a front-runner (E/P, P, or S → runs from behind → rail-trapped behind a wall).
- A front-runner (E) on the rail is the OPPOSITE — advantaged. Do NOT exclude on this basis.
- Strongest for closers (S) and stalkers (P); softer for pressers (E/P) who have early speed to grab a forward spot — still excludeable, lower conviction.
- Field size amplifies: bigger field = more wall = stronger read.

**Trigger B — Pace (style vs pace shape):**
- Speed (E) fave in a pace duel (2+ E horses) → cooked early.
- Closer (S) fave in a lone-speed race → no meltdown to run into.

**Conviction:** Lower hit rate, high payout. Favorites can overcome trouble. Fire only when a trigger is strong, not marginal.

**Reinforces:** Never-bet-fave rule / Vulnerable Fave thesis / S1 — the same read drives the win bet against the fave and the stake size.

### Field-Size Glossary

| Term | Definition | Action |
|------|-----------|--------|
| Short field | 5 or fewer horses | Never bet — skip entirely |
| Long field | 10 or more horses | Triggers double-stake sizing when fave is vulnerable |

### Running-Style Personas

Tag every horse in the field table after analysis. Read from past running lines.

| Tag | Style | Description |
|-----|-------|-------------|
| E | Speed / front-runner | Wants the lead, goes straight to the front. Inside post is an advantage. |
| E/P | Presser | Some early speed, sits just off the leader. |
| P | Stalker | Mid-pack, makes one run on the turn. |
| S | Closer | Drops to the back early, comes from way behind late. |

**Front-runner = E.** "Not a front-runner" = E/P, P, or S (runs from behind → can get buried).

Used by: inside lone speed gate, pace mapping, vulnerability assessment.

### Signal Scoring System

Every horse gets scored against these signals. Sum all triggered signals, compare across the field.

**Threshold:** 3+ points = must be in exotics. 5+ points = win bet candidate.

| # | Signal | Weight | Trigger |
|---|--------|--------|---------|
| S1 | Elite jockey on bomb | +3 | Top-3 meet rider chooses a >12/1 horse over shorter-priced options |
| S2 | Late tote action | +3 | Horse drops 3+ points from ML by post time, or AE takes heavy money. Sharp money = information. |
| S3 | Odds drift on quality | +2 | Was fav or co-fav on ML, now drifted to 4/1+. Form didn't change, just money flow. |
| S4 | Trainer win% >15% at meet | +2 | Hot barn running a horse at >6/1. Barn is cashing regardless of public perception. |
| S5 | Distance stretch-out to sire sweet spot | +2 | Horse getting their sire's optimal distance for the first time. Pedigree says they want this trip. |
| S6 | Best last-race Beyer in field | +1 | Highest speed figure among live starters. Proven they can run fast. |
| S7 | Blinkers change (on or off) | +1 | Trainer making an equipment move = intent. Something's different today. |
| S9 | Earnings leader in class | +1 | Most $ earned among starters at this class level. Has proven they belong. |
| S10 | First-time starter + expensive pedigree | +1 | Sire wins >15% with debuters, or horse was $100K+ purchase. Connections expect a run. |

### How to Score a Race (Execution Sequence)

This is the prompt workflow — every step is a gate. Do not skip steps or proceed past a failing gate.

**PHASE 1 — QUALIFY THE RACE**

1. **Parse the field** — all horses, odds, connections, form.
2. **Verify horse count.** Race header states field size. Confirm match. Check next PDF page for AEs. Do not proceed until count matches.
3. **Short field gate:** Count entries in the race. 5 or fewer → **SKIP RACE.**
   - *Read from:* Race header (field size) or count individual horse entries on the page.
4. **Maiden gate:** Check race conditions line in the header. Contains "Maiden Claiming" (MCL) or "Maiden Special Weight" (MSW) → **SKIP RACE.**
   - *Read from:* Race conditions/class line at the top of the race.
5. **Inside lone speed gate:** Is the favorite (lowest ML odds) drawn post 1–3 AND tagged E AND the only E in the field? → **SKIP RACE.** Exception: other E horses present = proceed.
   - *Read from:* ML odds (identify fave), post position number, running style tag (determined in step 6 but pre-scan the fave's PPs here: was it on the lead at the first call in most recent races? → E).

**PHASE 2 — TAG, MAP & FILTER THE FIELD**

6. **Tag running styles.** Assign E / E/P / P / S to every horse. Show in field table.
   - *Read from:* Position-at-call columns in the PPs (1st call, 2nd call). Look at the last 3-4 races:
     - On the lead (1st or 2nd) at the 1st call consistently → **E**
     - Near the lead (2nd-4th) at 1st call, pressing → **E/P**
     - Mid-pack (4th-7th) early, moves up later → **P**
     - Back of the pack early (8th+), closing late → **S**
   - Use the most recent races at today's distance/surface when available.

7. **Map the pace.** Count all E-tagged horses. Determine:
   - 0 E horses = no speed → closers disadvantaged, no one to run into
   - 1 E horse = lone speed → possible wire job
   - 2+ E horses = pace duel → closers/stalkers live
   - *Read from:* Running style tags assigned in step 6.

8. **Assess favorite vulnerability.** Identify the fave (lowest ML odds on page). Cross-reference:
   - Fave's running style tag (from step 6)
   - Fave's post position number
   - Pace map (from step 7)
   - Tag: VULNERABLE or PROTECTED. If vulnerable, note WHY and WHO benefits.
   - *Read from:* ML odds, post position, running style, pace map — all already parsed.

9. **Layoff filter:** Calculate days since last race. 90+ days AND no workout line (or sparse/irregular works) → mark EXCLUDED.
   - *Read from:* Last race date in PPs vs. today's date. Workout line below PPs (dates, distances, times). Look for at least 3-4 works with consistent spacing.
   - *Exception:* 90+ days but 4+ sharp works (bullet works, consistent times) = can play as "fresh."

10. **Class drop flag:** Compare today's race conditions/claiming price to the horse's last 2-3 starts.
    - *Read from:* Today's class (race conditions header) vs. class column in PPs. A jump from ALW/OC to MCL, or a claiming price drop of 50%+ = sharp drop.
    - Note whether drop comes with positives (recent works, hot trainer %, competitive last) or negatives (poor last, layoff, jockey downgrade).
    - *Jockey downgrade:* Compare today's jockey to the jockey in recent PPs — name change from a top rider to a lower-tier rider = negative.

11. **Recent life flag:** Check last race date and last-race performance:
    - *Read from:* Last race date (within 30 days?), positions at each call (within 2-3 lengths?), beaten-lengths column, final time/Beyer figure, comment line.
    - Within 30 days AND one of: close at any call, closing fraction gained ground, "wide" / "checked" / "blocked" in comments, Beyer ≥ prior start → tag RECENT LIFE.
    - Over 45 days since last start regardless of quality → NOT recent life.

12. **Troubled trip flag:** Read the comment line of the last race.
    - *Read from:* Trip/comment line in PPs. Look for: "blocked," "steadied," "checked," "bumped," "boxed," "shuffled back," "fanned wide," "wide on turn," "5-6 wide."
    - Confirm trouble was real: horse was in contention or closing before trouble (check positions at earlier calls), and finished worse than position at prior calls suggests.
    - If today's post is outside (higher number) and/or pace map suits their style better → STRONGER play.
    - Trivial trouble (bumped at start but recovered, wide by choice on lead) → don't flag.

**PHASE 3 — SCORE**

13. **Score each remaining live horse against signals.** For each horse not EXCLUDED, evaluate:

    | Signal | How to read from the DRF |
    |--------|--------------------------|
    | **S1 — Elite jockey on bomb** | Check jockey name on a horse with ML 12/1+. Is this jockey one of the top-3 riders at the current meet (win% or standings)? If yes and they chose this mount over shorter-priced options on the card → +3. *Read from:* Jockey name, ML odds. Cross-reference jockey standings (known from meet context). |
    | **S2 — Late tote action** | Requires live odds. If Matt has provided current tote odds: compare to ML — horse drops 3+ points from ML → +3. If no live odds available yet, skip — do not guess. |
    | **S3 — Odds drift on quality** | Requires live odds. If Matt has provided current tote odds: a horse that was ≤3/1 ML now showing 5/1+ live → +2. If no live odds available yet, skip — do not guess. |
    | **S4 — Trainer win% at meet** | Check trainer name. Is this trainer winning >15% at the current meet/track AND the horse is 6/1+ on the ML? → +2. *Read from:* Trainer name, ML odds. Cross-reference trainer stats (often printed on DRF page or known from meet context). |
    | **S5 — Distance stretch-out** | Is today's distance longer than any distance in the horse's PPs? Check sire line — does the sire produce winners at today's distance? → +2. *Read from:* Today's distance (race header) vs. distance column in PPs. Sire name (top of horse's section). |
    | **S6 — Best last-race Beyer** | Compare last-race Beyer/speed figure across all live horses in the field. Highest = +1. *Read from:* Beyer speed figure column, most recent race line for each horse. |
    | **S7 — Blinkers change** | Look for "B" or blinkers notation in today's equipment vs. last race equipment. On → off or off → on = +1. *Read from:* Equipment line (today) vs. equipment shown in most recent PP line. |
    | **S9 — Earnings leader** | Compare lifetime or current-year earnings across the field at this class level. Highest = +1. *Read from:* Earnings line in the horse's header section. |
    | **S10 — First-time starter + pedigree** | Horse has no PP lines (first start). Check sire — does sire win >15% with first-time starters? Or was purchase price $100K+? → +1. *Read from:* Empty PPs = debut. Sire name + sale price if listed. |

14. **Rank by total score.** S2 and S3 score zero unless Matt has provided live odds. If live odds arrive later, re-score and adjust picks if rankings change.

**PHASE 4 — BUILD BETS**

15. **Win bet (vulnerability-driven):** Highest-scored horse at 7/2+ ML whose style BENEFITS from the fave's vulnerability.
    - Fave is vulnerable speed in a duel → lean closers/stalkers (P/S tags with high scores).
    - Fave is boxed closer → lean outside stalkers or lone speed.
    - Never bet the fave. If the highest-scored horse IS the fave, go to next-highest at 7/2+.
    - *Read from:* Score rankings, ML odds (must be 7/2 or higher), running style tags, vulnerability assessment from step 8.

16. **Win stake sizing:** Count entries. 10+ horses AND fave tagged VULNERABLE in step 8 → DOUBLE the win stake ($100 instead of $50). Long field alone is not enough — must have confirmed vulnerability.
    - *Read from:* Field size (step 3), vulnerability tag (step 8).

17. **Exacta box:** Top 3-4 scored horses. Apply exclusion gates on the favorite:
    - **Class drop gate:** Fave flagged YELLOW in step 10 → EXCLUDE from exacta.
    - **Traffic trigger:** Fave's post is 1–3 (read from post position) AND fave's style is NOT E (read from step 6 tag) → EXCLUDE. Strongest for S/P, softer for E/P.
    - **Pace trigger:** Fave is E AND pace map shows 2+ E horses (step 7) → EXCLUDE. OR fave is S AND pace map shows lone speed (step 7) → EXCLUDE.
    - When excluding fave, replace with the non-favorites whose style/draw is helped by the same scenario.
    - *Read from:* Score rankings, post positions, running style tags, pace map, class drop flag.

18. **Trifecta box:** 4+ horses minimum. Include any horse scoring 3+ not already in your box.
    - *Read from:* Score rankings.

19. **Final check:** Any horse scoring 3+ that isn't in your exotics = red flag, reconsider.

**PHASE 5 — SYNTHESIZE**

20. **Pace scenario narrative.** How does the race set up? Who benefits from the likely pace shape?
21. **Favorite vulnerability thesis.** State the fave's weakness and who profits.
22. **Key angles.** Call out recent-life and troubled-trip horses at a price — these are the core value plays.
23. **Conviction level.** Strong trigger (clear vulnerability + style match + price) or marginal? Exacta exclusion is a conviction play — fire only when strong.
24. **Final picks with reasoning.** One sentence per bet explaining WHY.

### Signal Evolution
Weights adjust over time based on actual hit rate:
- Signal cashes at >25% → weight UP by 1
- Signal cashes at <10% over 20+ samples → weight DOWN by 1
- New patterns that hit 3+ times → add as S11, S12, etc.

## Architecture

### Race Day Site
Built via Deckster in `deckster/sites/race-day/`. Express server on port 3333.
- `races.js` — full field data, picks, results
- `app.js` — bankroll tracking, settle workflow
- `index.html` / `styles.css` — dark theme tracker UI

### Session Records
Stored in `money_machine/sessions/` — one file per race day with full P/L, picks, results, and post-mortem.

## Lifetime Record

| Date | Track | Races | W-L | Wagered | Collected | P/L | ROI |
|------|-------|-------|-----|---------|-----------|-----|-----|
| 2026-05-24 | Churchill Downs | 6 (R5-R10) | 2-4 | $554 | $611.40 | +$57.40 | +10.4% |

## Signal Hit Log

| Date | Race | Signal | Horse | Odds | Result |
|------|------|--------|-------|------|--------|
| 5/24 | R6 | S2 | Immortalize | 3/2 | WON |
| 5/24 | R6 | S3 | Pretty Tapit | 6/1 | 2nd |
| 5/24 | R8 | S4 | Anna's Promise | 4/1 | WON |
| 5/24 | R9 | S1 | Hillandale | 20/1 | WON (missed) |
| 5/24 | R9 | S5 | Hillandale | 20/1 | WON (missed) |
| 5/24 | R9 | S6 | Write Off Jerry | 6/1 | LOST |
| 5/24 | R7 | S7 | Frosted Bull | 5/2 | 3rd |
| 5/24 | R7 | S9 | Muir Woods | 12/1 | LOST |

## Next Steps
- **Build signal database (SQLite)** — track every bet, outcome, and signal fired. Tables: races, bets, signals_fired, comparisons (model vs Mike). Enables strategy-as-horse analysis.
- **Strategy form charts** — treat each signal/BOLO/trigger like a horse with its own PPs. Track W/P/S rate, ROI when fired, conditions where it performs (sprint/route, dirt/turf, field size). Weight up strategies in peak form, retire ones that stop cashing. Signal Evolution rule ("cash >25% → weight UP, <10% → weight DOWN") becomes queryable, not guesswork.
- Auto-parse DRF PDFs into structured race data
- Generate picks with confidence scores based on signal overlap
- Track jockey/trainer patterns across race days
- Add track bias detection (early-race results → late-race adjustments)
