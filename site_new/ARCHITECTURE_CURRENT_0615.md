# Fade the Chalk — Current Architecture (6/15/2026)

## Services

| Service | Role | Stack | Location |
|---------|------|-------|----------|
| **FTC Site** | Member-facing product — landing page, Today page, race detail, strategies marketplace, reports, member accounts | Vite + React + TypeScript + Tailwind | `site_new/` → deployed on Vercel (`fadethechalk.vercel.app`) |
| **Vercel Serverless API** | Backend for the site — auth, race data, bets, results, performance, reports, payments | TypeScript serverless functions | `site_new/api/` → Vercel auto-deploys |
| **Supabase Postgres** | Single source of truth — races, entries, horses, bets, results, strategies, strategy_activations, users, reports, member_comms | Postgres on Supabase (aws-1-us-east-1) | Connection via `api/db.ts` or local `db_query.mjs` |
| **Racing API** | External data — fields, post times, live odds, scratches, results | REST, Basic Auth | `api.theracingapi.com/v1/north-america` |
| **Brisnet** | Past performances — Beyer figures, positions at each call, workouts, trip comments, earnings | `.DRF` flat files, $1.50/track/day | Downloaded manually, parsed by `parse_drf_full.mjs` |
| **Resend** | Email delivery — auth magic links, pre-race alerts, scratch verdicts, post-mortem reports, member comms | REST API, `noreply@org64.com` | Key in env vars |
| **Claude (The Don)** | Race analysis — Phase 0-5 execution, scratch re-analysis, post-mortem, strategy updates | Claude Code CLI (local) + Claude API (planned for automation) | Local sessions in `money_machine/` |
| **Vercel Cron** | Scheduled automation — scratch monitor, odds monitor, results collection, pre-race emails | Vercel cron config | `api/cron/scratch-monitor.ts`, `api/cron/odds-monitor.ts` |
| **GitHub** | Source control, CI/CD trigger | Push-to-deploy via Vercel | `github.com/mattmartone/moneymachine` |

---

## Local CLI Tools

| Script | Purpose | Usage |
|--------|---------|-------|
| `db_query.mjs` | Direct SQL access to Supabase | `node db_query.mjs "SELECT ..."` |
| `parse_drf_full.mjs` | Parse Brisnet .DRF files into DB (races, horses, entries) | `node parse_drf_full.mjs ~/Downloads/SAR0614.DRF` |
| `pull_racing_api.mjs` | Pull fields, post times, jockeys, trainers from Racing API into DB | `node pull_racing_api.mjs 2026-06-14` |
| `pull_results.mjs` | Pull results + payouts from Racing API, settle bets | `node pull_results.mjs 2026-06-14 [TRACK] [--force]` |
| `odds_monitor.mjs` | Pull live odds for races with bets | `node odds_monitor.mjs` |

---

## Database Schema (Key Tables)

| Table | Role |
|-------|------|
| `races` | Track, date, race_number, conditions, class, distance, surface, field_size, qualified, post_time |
| `horses` | Name (unique), sire, dam |
| `entries` | race_id FK, horse_id FK, post_position, ML odds, live_odds, jockey, trainer, running_style, best_beyer, last_beyer, scratched |
| `bets` | race_id FK, bet_type, stake, doubled, entries_used (array), conviction |
| `results` | race_id FK (unique), win/place/show/fourth_entry_id FKs, payouts (win/ex/tri/super), settled_at |
| `strategies` | name, type, description, description_full, prompt, active |
| `strategy_activations` | bet_id FK, strategy_id FK, entry_id, rationale |
| `strategy_performance` | VIEW — computed starts, wins, ITM, win%, ROI per strategy |
| `users` | email, name, tokens, role |
| `reports` | title, track, date, races_analyzed, roi_pct, summary, content_url |

---

## Race Day Flow — Start to Finish

### Phase 0 — Data Load (Morning, pre-card)

**Actor:** The Don (Claude via CLI)
**Trigger:** Matt provides Brisnet .DRF files for target tracks

1. `parse_drf_full.mjs` loads races, horses, entries into Supabase
2. `pull_racing_api.mjs` enriches with post times, jockeys, trainers
3. Matt verifies fields on the Races page (`/races`)
4. Corrections applied (field count validation, scratches already known)

**Output:** Races table populated, entries complete, ready for analysis.

---

### Phase 1-5 — Analysis (Morning/Early Afternoon)

**Actor:** The Don (Claude via CLI)
**Input:** Populated DB + Brisnet PPs (read from DRF PDF)

1. **Phase 1 — Qualify:** Short field gate, maiden gate, inside lone speed gate
2. **Phase 2 — Tag & Map:** Running styles, pace map, favorite vulnerability
3. **Phase 3 — Score:** Signal scoring (S1-S11) on each entry
4. **Phase 4 — Build Bets:** Win pick (never fave, 7/2+), ceiling box (top 4-5 Beyers), stake sizing
5. **Phase 5 — Synthesize:** Pace narrative, vulnerability thesis, conviction level, final picks

**Output:** Commission Card — 5-8 high-conviction picks. Bets inserted into DB. PDF generated.

---

### Phase 6 — Publish (Pre-Race)

**Actor:** The Don + Resend
**Trigger:** Card finalized

1. PDF uploaded to `/public/reports/`
2. Report record inserted into DB
3. Member email sent via Resend (card summary, link to PDF)
4. Bets visible on Today page for logged-in members
5. Scratch monitor activated with watched races

**Output:** Members have the card. Site shows today's plays. Monitor is live.

---

### Race Day — Live Monitoring (Automated, Cron-Driven)

**Actor:** Vercel Cron (`api/cron/`)
**Schedule:** Every 10 minutes for active race day

#### Odds Collection (T-60 min before each race)
1. Racing API polled for live odds
2. Stored in `entries.live_odds`
3. If S2/S3 signals change → flag for re-score (planned: auto Claude API call)

#### Scratch Detection (T-50 min)
1. Racing API polled for scratches
2. If scratch hits our card:
   - Classify: CONSEQUENTIAL (win pick gone) or NON-CONSEQUENTIAL (box horse)
   - If non-consequential: rebuild ceiling box mechanically
   - Generate revised ticket OR drop notice

#### Pre-Race Email (T-35 min) — PLANNED
1. Email to all members for each Commission race
2. Contents: live odds, scratch verdict, revised ticket (or drop), results from earlier races
3. Clear instruction: PLACE REVISED BET or RACE DROPPED

#### Results Collection (T+15 min after each race)
1. Racing API polled for results
2. Finish order + payouts inserted into `results` table
3. Bets auto-settled
4. Performance panel updates in real-time on Today page

---

### Phase 7 — Settle & Learn (Post-Race Day)

**Actor:** The Don (Claude via CLI) + `pull_results.mjs`
**Trigger:** All races final

1. `pull_results.mjs --force` pulls/updates all results with correct payouts
2. Performance reconciled against Mike's actual returns
3. Strategy activations inserted (which strategies fired on each bet)
4. `strategy_performance` view auto-updates (lifetime earnings, win%, ROI per strategy)

**Output:** DB fully settled. Performance data current.

---

### Post-Mortem (Same Evening or Next Day)

**Actor:** The Don (Claude via CLI)
**Trigger:** All races settled, Matt initiates review

1. Race-by-race analysis: why wins worked, why losses missed
2. Pattern identification (stale ceilings, box errors, surface breaks, etc.)
3. Scratch response review (consequential vs non-consequential, execution gap)
4. Commission Card vs Added Plays split (product performance vs personal plays)
5. Strategy form chart updates
6. New strategies proposed / existing strategies modified
7. Post-mortem PDF generated + uploaded to site
8. Member email sent with recap + lifetime update
9. Landing page performance table updated
10. CLAUDE.md updated with new rules, retired strategies, backlog changes

**Output:** Full post-mortem published. Model updated. Landing page current. Members informed.

---

## Information Flow Diagram

```
Brisnet (.DRF files)     Racing API (fields, odds, scratches, results)
        |                              |
        v                              v
  parse_drf_full.mjs          pull_racing_api.mjs / cron jobs
        |                              |
        +———————————+——————————————————+
                    |
                    v
           SUPABASE POSTGRES
           (races, entries, horses, bets, results, strategies)
                    |
        +-----------+-----------+
        |           |           |
        v           v           v
  Claude (The Don)  Vercel API   Vercel Cron
  Phase 1-5 analysis  serves site   monitors odds/scratches/results
  post-mortems        reads/writes DB  triggers emails
  strategy updates                  
        |           |           |
        v           v           v
   Bets inserted   Today page    Pre-race emails
   PDF generated   Race Detail   Scratch verdicts
   Reports uploaded Performance   Results auto-settle
                    |
                    v
              RESEND (email)
              - Card drops
              - Scratch alerts
              - Post-mortem recaps
              - Auth magic links
                    |
                    v
              MEMBERS (phone/desktop)
              - Receive emails
              - View Today page
              - Place bets
              - Read reports
```

---

## Auth & Access

| Role | Access |
|------|--------|
| **Admin (Matt)** | Full site + inline odds editing + scratch management + results entry + /db SQL browser + member management |
| **Member** | Today page (locked races), Reports, Strategies Marketplace, Build Your Bets, Account |
| **Public** | Landing page only |

Auth: Resend magic link email → JWT token stored in localStorage.

---

## Deployment

- **Push to `main`** → Vercel auto-deploys (build + serverless functions + cron)
- **Env vars on Vercel:** `POSTGRES_URL`, `JWT_SECRET`, `RESEND_API_KEY`, `RACING_API_USER`, `RACING_API_PASS`
- **Local dev:** `npm run dev` → Vite on localhost:5173, API proxied to Vercel dev server

---

## Planned Architecture Changes (Priority 1)

1. **Claude API integration** — Vercel cron calls Claude API for scratch re-analysis and live-odds re-scoring. Removes Matt from the loop for mechanical rebuilds.
2. **Post-time-driven scheduling** — Cron fires relative to each race's stored post_time, not on fixed intervals.
3. **4th place from payoff winning_numbers** — Parse superfecta order from Racing API payoff data instead of relying on runners array (which only returns top 3).
4. **Mobile-first email templates** — Pre-race emails designed for phone consumption. One-tap copy of bet ticket.

---
