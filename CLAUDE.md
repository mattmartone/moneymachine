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

## Principles

- Matt (via Capo) gives the command, this agent executes
- Always commit and push to deploy — don't leave changes local
- Test the build locally before pushing when possible (`npm run build`)
- Never modify betting logic, scoring, or pick selection — that's the model's domain
- When in doubt about a calculation or display rule, ask before shipping
