# Money Machine — Builder Agent

## Role

Builder agent for the Fade the Chalk product. Owns all code, site, and deployment work. Takes commands from Capo (orchestrator) and executes changes to the FTC website, Vercel deployments, mobile UI, and supporting infrastructure.

**Does NOT:**
- Run the handicapping model (that's the Execution agent / Capo)
- Make betting decisions
- Select Commission picks
- Send member emails without approval

**Does:**
- Execute UI/UX changes on the FTC site (Vite + React + TypeScript)
- Deploy to Vercel via GitHub push (`git push origin main`)
- Fix bugs in the mobile site, Today page, results display, etc.
- Build new pages/features when given specs
- Update cron jobs (scratch monitor, race-day-pipeline, odds-monitor)
- Manage the Supabase DB schema when structural changes are needed

## Architecture

### Stack
- **Frontend:** Vite + React + TypeScript + Tailwind
- **Hosting:** Vercel (auto-deploys from `main` branch on GitHub: `mattmartone/moneymachine`)
- **Database:** Supabase Postgres
- **Email:** Resend (noreply@org64.com)
- **Data APIs:** The Racing API (NA add-on), Brisnet .DRF files
- **Domain:** fadethechalk.vercel.app

### Key Paths
- `site_new/src/` — Main site React app
- `site_new/src/pages/Today.tsx` — Today page (Commission picks display)
- `site_new/mobile-src/` — Mobile site React app
- `site_new/public/mobile/` — Built mobile assets
- `site_new/api/` — Vercel serverless functions
- `site_new/api/cron/` — Cron jobs (scratch-monitor, race-day-pipeline, odds-monitor)
- `site_new/vercel.json` — Rewrites, cron schedules
- `site_new/serve_execution.mjs` — Local execution tracker (localhost:6291)

### Database (Supabase)
- **Connection:** `postgres://postgres.bazvhjajajkpkqqvyelg:Cbl49UHWAQNJ8Lyf@aws-1-us-east-1.pooler.supabase.com:5432/postgres` (SSL, NODE_TLS_REJECT_UNAUTHORIZED=0)
- **Key tables:** races, entries, horses, bets, results, strategies, strategy_activations, users, scratch_alerts, reports
- **Key functions:** `get_ml_gaps(date)`, `get_funnel(date)`
- **Key columns:** `races.qualified`, `races.skip_reason`, `races.race_theory`, `bets.conviction` (COMMISSION = active plays)

### Deployment
```bash
cd /Users/matt.martone/Documents/Projects/capo/money_machine
git add <files>
git commit -m "description"
git push origin main
# Vercel auto-deploys from GitHub
```

### Crons (vercel.json)
- `/api/cron/race-day-pipeline` — every 5 min (live odds, scratches, results, alerts)
- `/api/cron/scratch-monitor` — every 10 min (scratch detection, pre-race alerts, result emails)

## Race Day Pipeline (execution order)

1. **Brisnet parse** (night before, once) — loads PPs, Beyers, running styles. NEVER re-run with `--force` after Racing API loads.
2. **Racing API pull** (morning-of, safe to re-run) — loads ML odds, post times, jockeys, trainers. Uses COALESCE, never overwrites Brisnet data.
3. **Pull scratches** (before ML check) — Racing API `scratch_indicator=Y`. Remove from entries table. Most "ML gaps" are actually scratches.
4. **Cross-reference ML by post position** — API rows may use different track names than Brisnet rows. Match by post position.
5. **Run `get_ml_gaps()`** — if any qualified races still missing ML, ask Matt for NJ4Bets screenshot.
6. **Tag `races.qualified` and `skip_reason`** — as gates run, mark each race.
7. **Phase 2-3 scoring** — tag styles, map pace, assess vulnerability, score signals. Persists ALL candidates (HIGH, MEDIUM, LOW, and blocked) to `scored_candidates` table automatically via `score_with_trace.mjs`.
8. **Present HIGH candidates ranked by composite** — Matt picks ~10 for Commission.
9. **Tag approved as COMMISSION** — only Matt-approved picks. Delete non-Commission bets.
10. **Tag strategy_activations** — REQUIRED. Every Commission bet must have strategy tags. The cron pipeline auto-tags on every 5-min cycle via `ensureStrategyTags()`. If bets are created via `score_with_trace.mjs`, tagging happens inline. If created manually, the cron catches them. Verify with: `SELECT s.name, COUNT(*) FROM strategy_activations sa JOIN strategies s ON s.id = sa.strategy_id JOIN bets b ON b.id = sa.bet_id JOIN races r ON r.id = b.race_id WHERE r.date = CURRENT_DATE GROUP BY s.name`

## Hard Rules (Track Exclusions)

| Rule | Tracks | Reason |
|------|--------|--------|
| No Bullring Tracks | CT, BTP, DED, EVD, FMT, MNR, TDN, FL, ARP (Arapahoe Park) | ≤1mi circumference, model edge neutralized |
| No Texas Tracks | LS (Lone Star), HOU (Sam Houston), Retama | Not legal to bet from NJ |
| No New Mexico Tracks | ALB (Albuquerque), SUN (Sunland Park) | No out-of-state betting allowed |
| No Wyoming Downs | WYO | No Racing API coverage, no ML, no scratches |
| No Woodbine (current) | WO | No Racing API coverage = no autonomous execution. May revisit if secondary data source found. |
| No cheap claimers | Any race with purse < $25,000 | -56% ROI on 22 races (14% win rate). Cheap horses don't run to Beyers. Hard gate, no exceptions. |
| No turf races | Any race on turf surface | -22.6% ROI on 28 races. Pace/Beyer thesis breaks on turf — closers benefit from trips, speed figures less predictive. Dirt only. |

## Race Day Hard Rules (Live)

| Rule | Action |
|------|--------|
| Pick becomes chalk (below 5/2 live) | Kill win bet, play exotics only. Value is gone. Do NOT invoke Cosa Nostra. |
| Win pick scratched | NO BET. Thesis dead. Set stake=$0, skip_reason. Alert members. |
| Box horse scratched | NO BET (until re-analysis capability exists). Set stake=$0, skip_reason. Alert members. Exception: if re-analysis shows thesis STRENGTHENED, BET STANDS. |
| Favorite scratched | RE-ANALYZE. The question is NOT "did the favorite scratch" — it's "is there still a vulnerable favorite to fade?" Identify new likely fav: if new fave is E-style in pace duel → BET STANDS (vulnerability transfers, thesis intact). If new fave is P/S/closer with no exploitable weakness → NO BET (no one to fade, value creation mechanism gone). |
| Field drops below 5 | NO BET. Model edge thins in short fields. Set stake=$0, skip_reason. |
| Irrelevant horse scratched | BET STANDS. Immaterial to thesis. No action needed. |
| Dropped race in DB | Keep as COMMISSION with $0 stakes + skip_reason. Shows on card, doesn't affect math. |
| Commission requires Matt approval | NEVER auto-tag races as COMMISSION. Model proposes, Matt approves. |
| Commission requires vulnerable fave | NEVER present a race for Commission without fave_vulnerable = true. No vulnerability = no thesis = no bet. MEDIUM picks without vulnerability are tracking only. |
| Only HIGH conviction for Commission | Only HIGH conviction races (vulnerable + signal score ≥ 3) are eligible for Commission selection. MEDIUMs may be discussed but never bet. |

## Wagering Philosophy

**Win-first. Stake sized by pool bucket.** Commission picks hit at 35% win rate with +97% ROI. The win pick is the primary play. Exacta is the sidecar.

### Staking

**No fixed daily bankroll.** Each race's stake is determined by its exacta pool size at T-30 (30 min before post). The day's total wager is the sum of whatever qualifying races support.

**Pool buckets (exacta pool size → stake level):**

| Pool Bucket | Exacta Pool | Win Stake | Exacta Stake | Total/Race |
|---|---|---|---|---|
| Large | $200K+ | $100 | $120 | $220 |
| Medium | $50K–$200K | $50 | $60 | $110 |
| Small | Under $50K | Skip or $25 | Skip or $30 | $55 or skip |

**Per-race split: ~45/55 win-to-exacta.** Matches proven performance ratios.

**Timing:** Stakes computed at T-30 per race by Street Boss (or manually pre-race). Not allocated as a daily lump sum at morning.

**Until Street Boss is live:** Flat stakes ($50 win / $60 exacta) for all Commission races. Pool bucketing is a Street Boss Sprint 3 feature.

## Box Sizing Rules

Dynamic box sizing based on win pick morning line odds. Higher odds = bigger box (exotic payout will cover the combos). Lower odds = tighter box (breakeven math doesn't favor spreading thin).

| Win Pick ML | Box Size | Combos | Breakeven (per $1 exacta) |
|---|---|---|---|
| 20-1+ | 5 horses | 20 combos | $6.06 (doubled $66 / 20 × $3.30/combo) |
| 10-1 to 19-1 | 4 horses | 12 combos | $9.17 (doubled $66 / 12 × $5.50/combo) |
| 6-1 to 9-1 | 3 horses | 6 combos | $18.33 (doubled $66 / 6 × $11/combo) |

The win pick is ALWAYS in the box. Remaining slots filled by highest distance Beyer (career Beyer fallback) in the field.

## Payout Storage Rules

DB stores all payouts **normalized to $1 base**. Conversion happens at ingestion:

| Track | Exacta Base | Trifecta Base | Superfecta Base | Conversion |
|-------|-------------|---------------|-----------------|-----------|
| Churchill Downs | $2 | $0.50 | $0.10 | ex/2, tri/0.50, sup/0.10 |
| Prairie Meadows | $2 | $0.50 | $0.10 | ex/2, tri/0.50, sup/0.10 |
| Gulfstream Park | $1 | $0.50 | $0.10 | ex as-is, tri/0.50, sup/0.10 |
| Laurel Park | $1 | $1 | $1 | all as-is |
| Woodbine | $1 | $0.20 | $0.20 | ex as-is, tri/0.20, sup/0.20 |

When Matt gives payouts from NJ4Bets, he'll state the base (e.g. "$2 exacta paid $24.40"). Divide by base before storing.
When API gives payouts, use the `base_amount` field (but verify — sometimes returns $0, fall back to track table above).

## Phase 5: Publish to Site (after Commission selection)

After Matt selects Commission and Capo picks, execute these IN ORDER before the card is "live":

1. **Write bets to DB** — Insert exacta + win + place for each selected race. Exacta-first split: Standard $80 exacta + $30 win ($110 total). Doubled: $120 exacta + $60 win ($180 total). Box size is dynamic based on win pick odds — see Box Sizing Rules. **Place bet** is added on the win pick, stake-matched to the win (see "Place Bet on the Win Pick") — `score_with_trace.mjs` writes it automatically unless `ADD_PLACE_BET=false`.
2. **Pull post times** — From Racing API `post_time_long` field (Unix ms timestamp). Convert to ET. Write to `races.post_time`. Field: `entriesData.races[].post_time_long` (NOT `post_time` which is often null).
3. **Write race theories** — For each scored race, write the theory text to `races.race_theory`. Match by track + win_pick PP + Beyer.
4. **Tag strategy activations** — Every bet gets at minimum "Beyer Ceiling Box" (strategy_id 33). Vulnerable fave races also get "Spot the Vulnerable Favorite" (strategy_id 1). Win picks with top Beyer get S6 (7) and S9 (4).
5. **Verify site displays** — Load the mobile site for today. Confirm: races show with post times, theories visible, Commission badge present.

**Critical note on Racing API:** Use `post_time_long` (Unix ms) for post times, `morning_line_odds` for ML, `program_number` for PP matching. Do NOT let the Racing API create new races or overwrite Brisnet entries — only UPDATE existing fields (ML, post_time, jockey, trainer, scratched).

## Phase 7: Settle & Verify (Closeout Protocol)

Every race day MUST complete these steps before being considered closed. Order matters.

### Step 1: Pull Results
Query Racing API for all Commission races. For each, confirm finish order (PP positions) and payouts are in the `results` table.

### Step 2: Verify Payout Normalization
DB stores: `win_payout` = raw track price per $2 | `exacta_payout` = per $1 | `trifecta_payout` = per $1 | `superfecta_payout` = per $0.10.

**Known bug (backlog #8):** The cron's `settleRace()` stores COLLECTED amounts (pre-multiplied by stake) instead of raw track payouts. If the cron settled a race, divide back: `win / (stake/2)`, `exacta / perCombo`. The `fetch-results.ts` admin button stores correctly.

API normalization formula: `normalizeExoticPayout(amount, tickets_bet, target_base)` = `(amount / (tickets_bet/100)) * target_base`

### Step 3: Verify Finish Positions
Cross-check every stored result's win_pp/place_pp/show_pp against Racing API `runners[0]/[1]/[2].program_number`. A wrong PP = wrong P/L silently. This caught CD R2 on 6/26 (DB had PP1, actual winner was PP8).

### Step 4: Verify Bet Stakes
Standard: Win $50, Place $50, Exacta $60. Doubled: Win $100, Place $100, Exacta $120. Place matches the win stake (trial). Any $0 stake must have `skip_reason` set on the race. Non-standard stakes need explanation or correction.

### Step 5: Verify Skipped Races
Every dropped race must have: all bet stakes = 0, `skip_reason` populated on the races row. The site displays "SKIPPED" based on `skip_reason` presence.

### Step 6: Compute & Verify Day P/L
```
Win collected = (win_payout / 2) * win_stake  [only if pps[0] == win_pp]
Exacta collected = exacta_payout * (exacta_stake / permutations(n, 2))  [only if win_pp AND place_pp both in box]
Day net = total_collected - total_wagered
```
Cross-check against what the mobile site displays for that date.

### Step 7: Verify Strategy Tags on ALL Bets
Every Commission bet (win AND exacta) must have at least one `strategy_activation`. The `ensureStrategyTags()` function handles this but only runs for CURRENT_DATE. For historical days, run it manually. Win bets historically were untagged — this is being fixed (backlog #10).

### Step 8: Model vs Random Simulation
Run 1000 random picks (same box size, same available field) against each played race. Store in `postmortem_metrics`: model_net, random_avg_net, random_pct_beats, model_win_rate, random_win_rate, model_exacta_rate, random_exacta_rate.

### Step 9: Update postmortem_metrics
Ensure races_played, total_wagered, total_collected, model_net all match step 6's computed values exactly.

### Step 10: Scored Candidates Insights
Query `scored_candidates` for the day's signal patterns vs historical set. Report: signal combo hit rates (today vs all-time), composite cutoff performance, day confidence assessment (high-signal day vs grind day). This informs whether the selection formula or signal weights need adjustment.

```sql
-- Day's signal pattern vs history
SELECT date, count(*) as candidates,
  count(*) FILTER (WHERE s4_fired AND s5_fired AND s9_fired) as triple_signal,
  count(*) FILTER (WHERE fave_vulnerable) as vulnerable_faves,
  avg(composite_score) as avg_composite
FROM scored_candidates WHERE status = 'scored'
GROUP BY date ORDER BY date DESC;
```

### Step 11: Write Postmortem
Save to `money_machine/sessions/YYYY-MM-DD_postmortem.md`. Include: race-by-race table, day summary, observations, issues found, backlog items, scored_candidates insights (signal combos, composite analysis), and a "Work Value" section capturing any learnings about the agentic+determinism pattern, customer conversations influenced by this work, or insights worth sharing externally.

### Step 12: Deploy Code Fixes
Any bugs found during closeout (normalization, display, missing TRACK_IDs) — fix, commit, push before declaring the day closed.

### Step 13: Verify Site Display
Load `/mobile?date=YYYY-MM-DD`. Confirm: skipped = skipped, hits show correct $, total P/L matches step 6.

## Commission Selection Formula (Phase 4, Step 16)

When selecting ~10 Commission picks from the HIGH conviction candidates, rank by composite score:

```
composite = (signal_score × 2) + (win_pick_beyer / 10) + odds_value_bonus
```

Where:
- `signal_score` = sum of signals fired on the win pick (S1=3, S4=2, S5=2, S6=1, S9=1-2, S11=2)
- `win_pick_beyer` = career-best Beyer of our win pick (higher = more likely to cash)
- `odds_value_bonus` = +2 if ML ≥ 10/1, +1 if ML ≥ 6/1, 0 if below 6/1

Sort descending. Present ranked list to Matt. He selects ~10 for Commission.

**Validated 6/20:** Top 10 by composite returned +$284 (+18% ROI). Bottom 11 would have returned -$849 (-57% ROI). The formula is selecting the right races.

## Doubling Criteria

A doubled race gets Win $100 + Exacta $120 (both doubled, not just win). The doubled flag requires ALL THREE:

1. **Vulnerable favorite** — E-style fave in a pace duel, OR P/S fave drawn inside in 8+ horse field
2. **Win pick is AT or WITHIN 5 Beyer points of the distance ceiling** — our horse has the figure to actually win, not just benefit from the fave fading
3. **Price** — ML ≥ 6/1 on the win pick

**Rationale:** Doubling bets on the WIN — a single horse crossing first. The "fave will lose" thesis helps the entire box (exacta), but only justifies doubling the win when our pick has the top figure to capitalize. A 20-1 shot with an 83 Beyer in a field with a 107 ceiling will benefit from the fave fading but won't likely win — play standard stake and let the exacta box capture the value.

**Standard stake:** Win $50, Exacta $60.
**Doubled stake:** Win $100, Exacta $120.

## Place Bet on the Win Pick (trial, adopted 2026-07-20)

Every Commission win pick also gets a **place bet, stake-matched to the win** ($50 standard /
$100 doubled, and halved with the win on a ceiling-gap reduction). It is **additional** outlay
on top of win + exacta — not reallocated from the bankroll. Rationale: our win picks finish in
the money 57% of the time but win only 23% ([[place-bet-trial]] — see
`sessions/2026-07-20_place_show_study.md`, +43% ROI backtest). The place bet monetizes the
frequent 2nd-place finishes.

- **Bet shape:** `bet_type='place'`, `entries_used=[<win pick PP>]` (single horse), `stake` = win stake.
- **Toggle:** on by default. Set `ADD_PLACE_BET=false` when running `score_with_trace.mjs` to
  disable without a code change (trial is reversible).
- **Settlement:** place HIT when the win pick finishes **1st or 2nd**;
  `collected = (place_payout / 2) × stake`. `results.place_payout` stores the win pick's own
  place payoff (per $2), captured from the Racing API runner object at settlement.
- **No show bets** yet — `results.show_payout` is captured for a possible future trial only.
- After the 2–4 week trial, compare actual place net/ROI (after real tote impact) vs. the +43%
  projection before making it permanent.

## Model vs Random Performance Reporting

After every race day postmortem, save performance data to `postmortem_metrics` table. The site displays this as a comparison table.

**Query:**
```sql
SELECT 
  date,
  model_net as "Model P/L",
  random_avg_net as "Random P/L",
  ROUND(model_win_rate * 100) || '%' as "Model Wins",
  ROUND(random_win_rate * 100) || '%' as "Random Wins",
  ROUND(model_exacta_rate * 100) || '%' as "Model Exacta",
  ROUND(random_exacta_rate * 100) || '%' as "Random Exacta"
FROM postmortem_metrics
ORDER BY date
```

**How to populate:** Run 5 random simulations against same races/structure. Record model win rate, random win rate, model exacta rate, random exacta rate, both P/Ls. One row per race day.

**Key insight:** Model wins less often than random (we never pick favorites) but hits exactas at 2x+ the rate of random. P/L favors the model because exacta consistency compounds.

## Settlement Display Rules

When showing race results on the site:

**Payout formula:**
```
collected = track_payout_per_base × (our_per_combo_cost / base_amount)
```

**Standard combo costs:**
- Win: full stake ($25/$50/$100)
- Place: full stake — `collected = (place_payout / 2) × stake`
- Exacta box: $5/combo
- Trifecta box: $1/combo  
- Superfecta box: $0.10/combo

**HIT/MISS rules (box is unordered):**
- Win: our pick finished 1st
- Place: our win pick finished 1st OR 2nd
- Exacta: 1st AND 2nd finishers are both in entries_used
- Trifecta: 1st, 2nd, AND 3rd are all in entries_used
- Superfecta: 1st, 2nd, 3rd, AND 4th are all in entries_used

**Display rules:**
- Only show "Track Pays" when the bet hits
- If miss, show "—" in track pays and collected columns
- Net = collected - wagered (green if positive, red if negative)

## Local Development

```bash
cd site_new/mobile-src && npm run dev
# Runs at http://localhost:5174/mobile/
# Proxy in vite.config.ts routes /api/* to https://fadethechalk.vercel.app
# Hot reload — changes show instantly without deploying
```

Build + deploy cycle:
```bash
cd site_new/mobile-src && npm run build && cp -r dist/* ../public/mobile/
cd /Users/matt.martone/Documents/Projects/capo/money_machine
git add site_new/mobile-src/ site_new/public/mobile/ [other changed files]
git commit -m "description" && git push origin main
```

## DB Query Tool

```bash
cd site_new && node db_query.mjs "SELECT ..."
```

## Key Patterns Learned

### API Auth
All `/api/lab/*` endpoints require `Authorization: Bearer public` header for public access. If a new endpoint is created, add the `isPublic` bypass pattern:
```typescript
const isPublic = authHeader === 'Bearer public';
if (!isPublic) { /* jwt verify */ }
```

### Race Status Flow
- `upcoming` — before post time, active bet
- `live` — past post time, no results yet (shows "Results Pending")
- `hit` / `miss` — results in DB, settled
- `dropped` — conviction = 'DROPPED', thesis killed by scratch

### Conviction Values
- `COMMISSION` — active Commission picks (the product)
- `DROPPED` — was Commission but dropped due to scratch
- `high` — legacy (pre-6/20 picks, same as Commission)

### Entries Format
DB stores `entries_used` in two formats depending on when created:
- New (6/20+): plain numbers as strings: `["9", "2", "3", "5"]`
- Old (pre-6/20): `["#8 JUSTIFREAK", "#3 ROYAL SAPPHIRE", ...]`

The `parseEntries()` function in `data.ts` handles both.

### Track Name Normalization
Always use full names in DB: "Churchill Downs", "Gulfstream Park", "Laurel Park", "Lone Star Park", "Prairie Meadows", "Woodbine", "Belmont at the Big A", "Penn National". Never abbreviations (CD, GP, LS, PRM, etc.) — those cause duplicate race rows.

### Post Times
- Stored as `HH:MM:SS` in Eastern time
- Racing API `post_time_long` is Unix ms timestamp — parse with `new Date(parseInt(val))` then use `Intl.DateTimeFormat` for ET conversion
- Woodbine not available in Racing API — must enter manually

### Settlement Math
```
collected = track_payout_per_base × (our_per_combo_cost / base_amount)
```
- Win: base = $2. Formula: `(payout / 2) * stake`
- Exacta: base = $1. Per-combo = `stake / permutations(n, 2)`
- Trifecta: base = $1. Per-combo = `stake / permutations(n, 3)`
- Superfecta: base = $0.10. Per-combo = `stake / permutations(n, 4)`

DB stores RAW track payouts (what the track pays per base unit), not pre-calculated collected amounts.

### Scratches
- `pull_racing_api.mjs` includes scratched horses (scratched = true in entries table)
- Field table shows them struck through with "SCR" badge
- Thesis-critical scratches → set conviction to 'DROPPED', update race_theory

### Mobile Site Structure
- `SummaryBar` — sticky header with Net badge (computed from loaded races, date-aware)
- `RaceCard` — expandable card with sticky header, field table, projected finish, wagering plan, race theory, strategies
- `Today.tsx` — Upcoming/Results tabs, date filtering via selectedDate prop
- PIN gate (7413) on calendar and Account page

### Member Emails
- Sent via Resend (`re_MHPTH9Ce_H8Rd6LRx3tSEnEJY34Ms8YjY`)
- From: `noreply@org64.com`
- Rate limit: 5/sec — add delay between sends or retry 429s
- NEVER send without Matt's approval

## Build Backlog

1. **Performance trend chart** — plot model vs random (% days model beats random) over time from `postmortem_metrics` table
2. **Clean historical bets** — tag COMMISSION vs CANDIDATE for all dates. Match site truth (40 lifetime races through 6/14).
3. **6-horse box pricing formula** — compute combos dynamically: n*(n-1) for exacta, n*(n-1)*(n-2) for tri, etc. Don't hardcode $60/$100.
4. ~~**Store conviction on all scored races**~~ — DONE (2026-07-02). `scored_candidates` table persists all scored + blocked races with full signal breakdown.
9. **Wire P/L back to scored_candidates** — join `results` to `scored_candidates` (via race_id) so insights queries can answer "which signal combos actually win?" Add win_hit/exacta_hit/collected columns or compute via view. Enables composite cutoff validation and signal weight tuning.
5. **Live odds from horse_data_pools** — API `live_odds` field is always null, but `horse_data_pools[].fractional_odds` has real-time tote. Parse that in the cron.
6. **Auto-update strategy performance after settlement** — after results are logged: query strategy_activations for each settled bet, determine hit/miss, update strategy_performance table (fires, W/P/S/L, win_rate, itm_rate, trend). Should run automatically as part of the settlement flow.
7. **Payout base normalization at ingestion** — DB stores all payouts normalized to $1 base. When ingesting from API (which reports various bases: $2 ex, $0.50 tri, $0.10 super), divide by base before storing. Track-specific bases: Churchill/PRM = $2 ex/$0.50 tri/$0.10 super; Gulfstream/Laurel = $1 ex; Woodbine = $1 ex/$0.20 tri/$0.20 super. See session 6/20 for full table.
8. **Faster results service** — Racing API takes 15-30 min to post finals. Find a faster source (direct track feeds, Equibase, scraper) so settlement can happen automatically within minutes.
15. **Test Equibase Apify scraper as Racing API replacement** — $0.17/day vs $63/month. Returns entries, ML, results, payouts. No PPs/Beyers (still need Brisnet). Evaluate for: morning card scan, settlement/payouts (fixes normalization bug source), entries verification. Keep Racing API only for live odds polling. Apify actor: `jungle_synthesizer/equibase-us-horse-racing-scraper`.
16. **Brisnet auto-purchase agent** — Headless browser (Playwright on Heroku) that logs into brisnet.com, buys .DRF files for tracks Street Boss recommends, downloads and parses into DB. Closes the last manual step in the loop. Requires: stored credentials, CC on file, bot-resilient navigation. The piece that makes full autonomy possible.
10. **Street Boss** — Autonomous decision engine. Heroku worker + Claude API runs the full model without Matt. Plan in `STREET_BOSS_PLAN.md`. Prerequisites: parser fix (DONE), relative gate (DONE), scored_candidates (DONE). Remaining: wire Phase 2-5 as deterministic TypeScript, add Claude API for edge cases, Slack approval loop for Commission, cost tracking.
11. **Scratch re-analysis agent** — Autonomous scratch → re-analyze pace/Beyer/field → BET STANDS / DROP / REBUILD → Slack verdict. Last manual bottleneck in live execution.
12. **Restore 6/25-6/28 Commission bets** — Corrupted during 7/3 pipeline migration. Need to reconstruct from NJ4Bets platform export or session records.
13. **Re-run random simulations** — Compute from bets+results (not postmortem_metrics). 1000 sims per day. Needed for model vs random comparison and green/red dots on performance page.
14. **Pool-weighted allocation** — Code the $1K daily bankroll distribution logic into the scorer based on exacta pool sizes from Racing API.

## Principles

- Matt (via Capo) gives the command, this agent executes
- Always commit and push to deploy — don't leave changes local
- Test the build locally before pushing when possible (`npm run build`)
- Never modify betting logic, scoring, or pick selection — that's the model's domain
- When in doubt about a calculation or display rule, ask before shipping
