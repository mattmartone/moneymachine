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
7. **Phase 2-3 scoring** — tag styles, map pace, assess vulnerability, score signals.
8. **Present HIGH candidates ranked by composite** — Matt picks ~10 for Commission.
9. **Tag approved as COMMISSION** — only Matt-approved picks. Delete non-Commission bets.

## Hard Rules (Track Exclusions)

| Rule | Tracks | Reason |
|------|--------|--------|
| No Bullring Tracks | CT, BTP, DED, EVD, FMT, MNR, TDN, FL | ≤1mi circumference, model edge neutralized |
| No Texas Tracks | LS (Lone Star), HOU (Sam Houston), Retama | Not legal to bet from NJ |
| No Wyoming Downs | WYO | No Racing API coverage, no ML, no scratches |
| No Woodbine (current) | WO | No Racing API coverage = no autonomous execution. May revisit if secondary data source found. |

## Race Day Hard Rules (Live)

| Rule | Action |
|------|--------|
| Pick becomes chalk (below 5/2 live) | Kill win bet, play exotics only. Value is gone. Do NOT invoke Cosa Nostra. |
| Thesis-critical scratch | DROP race entirely. Set conviction=COMMISSION, stake=$0, skip_reason='thesis_critical_scratch'. |
| Dropped race in DB | Keep as COMMISSION with $0 stakes + skip_reason. Shows on card, doesn't affect math. |
| Commission requires Matt approval | NEVER auto-tag races as COMMISSION. Model proposes, Matt approves. |

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

## Postmortem Standards

After every race day, Phase 7 includes:
- **Model vs Random** — run 1000 random simulations on same races/structure. Track "% random beats model." Target: <30%. Store in `postmortem_metrics` table.
- **Strategy performance update** — for each Commission bet, check strategy_activations, determine hit/miss, update strategy_performance table.
- **Verify strategy_activations tagging** — must be accurate and complete. Powers pattern recognition over time.

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

## Settlement Display Rules

When showing race results on the site:

**Payout formula:**
```
collected = track_payout_per_base × (our_per_combo_cost / base_amount)
```

**Standard combo costs:**
- Win: full stake ($25/$50/$100)
- Exacta box: $5/combo
- Trifecta box: $1/combo  
- Superfecta box: $0.10/combo

**HIT/MISS rules (box is unordered):**
- Win: our pick finished 1st
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
- Sent via Resend (`re_L3cnNm7K_6Fu7rVh8Num5gULJemTdoK9y`)
- From: `noreply@org64.com`
- Rate limit: 5/sec — add delay between sends or retry 429s
- NEVER send without Matt's approval

## Build Backlog

1. **Fix entries_used type mismatch** — box stores strings ["8","2","6","4"], finish positions are integers. `box.includes(2)` fails. Cast with `box.map(Number).includes(pos)` everywhere hit/miss is checked. Verified broken: LRL R7 6/20 shows trifecta as miss when it hit.
2. **Fix results display calculations** — exacta collected is multiplied extra times, superfecta incorrectly marked as miss. See settlement math in Key Patterns above.
3. **Calendar date change doesn't update net value** — top-right P/L badge stays stale when switching dates
4. **URL doesn't change on date selection** — should update to `/mobile?date=YYYY-MM-DD` for bookmarkability
5. **Performance trend chart** — plot model vs random (% days model beats random) over time from `postmortem_metrics` table
6. **Clean historical bets** — tag COMMISSION vs CANDIDATE for all dates. Match site truth (40 lifetime races through 6/14).
7. **Backfill results** — pull results for 5/24, 6/6, 6/7, 6/11, 6/13 from Racing API or session files
8. **6-horse box pricing formula** — compute combos dynamically: n*(n-1) for exacta, n*(n-1)*(n-2) for tri, etc. Don't hardcode $60/$100.
9. **Store conviction on all scored races** — not just Commission. Add `conviction` column to races table or separate scored_races table.
10. **Live odds from horse_data_pools** — API `live_odds` field is always null, but `horse_data_pools[].fractional_odds` has real-time tote. Parse that in the cron.
11. **Auto-update strategy performance after settlement** — once type mismatch (#1) is fixed, after results are logged: query strategy_activations for each settled bet, determine hit/miss, update strategy_performance table (fires, W/P/S/L, win_rate, itm_rate, trend). Should run automatically as part of the settlement flow.
12. **Payout base normalization at ingestion** — DB stores all payouts normalized to $1 base. When ingesting from API (which reports various bases: $2 ex, $0.50 tri, $0.10 super), divide by base before storing. Track-specific bases: Churchill/PRM = $2 ex/$0.50 tri/$0.10 super; Gulfstream/Laurel = $1 ex; Woodbine = $1 ex/$0.20 tri/$0.20 super. See session 6/20 for full table.
13. **Faster results service** — Racing API takes 15-30 min to post finals. Find a faster source (direct track feeds, Equibase, scraper) so settlement can happen automatically within minutes.

## Principles

- Matt (via Capo) gives the command, this agent executes
- Always commit and push to deploy — don't leave changes local
- Test the build locally before pushing when possible (`npm run build`)
- Never modify betting logic, scoring, or pick selection — that's the model's domain
- When in doubt about a calculation or display rule, ask before shipping
