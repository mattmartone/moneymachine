# Fade the Chalk — Roadmap

## Goal: Next Race Day (6/14 or 6/15) Runs on DB

By next weekend, the race day workflow writes to and reads from Postgres. No more flat files, no more markdown table edits. Parse once, analyze from DB, results land in DB, post-mortem queries the DB.

## Phase 1 — DB Foundation (this week)

**Milestone:** Schema designed, Vercel Postgres merged with local prototype, backfill complete.

- [ ] Pull Vercel Postgres schema (what's there today for FTC site)
- [ ] Pull local SQLite schema (`money_machine/data/money_machine.db` from 6/6)
- [ ] Design unified schema:
  - `races` — race_id, track, date, number, name, distance, surface, purse, conditions, field_size
  - `horses` — horse_id, race_id, post, name, ml_odds, live_odds, jockey, trainer, sire, dam, beyer, lifetime_record, style, notes
  - `signals` — signal_id, name, weight, trigger_description, active, created_date
  - `signals_fired` — race_id, horse_id, signal_id, triggered (bool)
  - `scoring` — race_id, horse_id, total_score, win_pick (bool), in_exacta, in_tri, in_super
  - `bets` — bet_id, race_id, bet_type (win/ex/tri/super), horses (array), unit, cost, collected, net
  - `results` — race_id, finish_order (array), exacta_paid, tri_paid, super_paid
  - `strategies` — strategy_id, name, fires, wins, places, shows, itm_pct, roi, trend, best_conditions
- [ ] Backfill: 5/24 Churchill, 6/6 Saratoga, 6/7 Saratoga (all from session files)
- [ ] Push schema + seed data to Vercel Postgres

## Phase 2 — Wire the Race Day Workflow (this week)

**Milestone:** Next race day, parse writes to DB, analysis reads from DB, results go to DB.

- [ ] Parse step writes to `races` + `horses` tables (replaces races.js)
- [ ] Analysis step reads from DB, writes to `scoring` + `signals_fired`
- [ ] Bet construction writes to `bets`
- [ ] Results settlement writes to `results`, updates `bets.collected`
- [ ] Post-mortem queries: signal hit rates, P/L, strategy form charts — all from DB
- [ ] CLAUDE.md lifetime record and form charts become READ views of the DB (not manually edited)

## Phase 3 — Site Reads from DB (next week)

**Milestone:** FTC site on Vercel shows live race data, picks, results, form charts.

- [ ] Race day page: today's card with fields, picks, wagering plan
- [ ] Results page: settled races with P/L
- [ ] Strategy form charts: live hit rates computed from DB
- [ ] Signal reference: all 11 signals with performance data
- [ ] Lifetime scoreboard

## Phase 4 — Agent on Site via Claude API (after Phase 3)

**Milestone:** Users upload a DRF PDF on the site and get analysis back.

- [ ] PDF upload endpoint → parse → write to DB
- [ ] Claude API call with CLAUDE.md methodology as system prompt
- [ ] Agent reads race data from DB, runs Phase 1-5, writes analysis
- [ ] Output: branded report (PDF or web view)
- [ ] Token metering: track usage per user, charge per ECONOMICS.md rates

## Phase 5 — Conversation Layer

**Milestone:** Users can chat with the agent about their races in real time.

- [ ] Chat UI on site
- [ ] Agent has full race context from DB
- [ ] Handles: scratches, odds shifts, "what if" questions, custom bet construction
- [ ] Every conversation logs to DB (for pattern mining later)

## Phase 6 — Marketplace

**Milestone:** Contributors add strategies, users select which to run, revenue share.

- [ ] Strategies as DB rows with visible form charts (the form chart IS the sales page)
- [ ] User selects strategies at checkout → tokens charged per strategy per race
- [ ] Contributor dashboard: see usage, earnings, performance
- [ ] Hot strategies priced higher (dynamic based on hit rate)

## Vision

**What it is:** An AI handicapping agent that turns raw racing data into actionable, scored picks — delivered as branded reports or via real-time conversation. Powered by a signal-based scoring model that evolves with every race.

**What it isn't:** A tipping service. It's a strategy platform. Users choose strategies (from us and from contributors), see transparent form charts, and pay only for what they use.

**The brand:** Fade the Chalk. 1980s NJ/NY mafia voice. The Commission. Made men. The form chart is the sales page.

## Economic Model

### Token Economics
- **3 FTC tokens = 1 Claude API token** (direct multiplier covering compute + data + margin)
- **$10/month = 1,000,000 FTC tokens** (resets monthly)
- **~300,000 FTC tokens per full card analysis** (user gets ~3 full analyses per month on base plan)
- **15,000 FTC tokens per strategy selected** (fewer strategies = lower cost = more analyses)

### Unit Economics Per Analysis
| Component | Claude Tokens | USD |
|-----------|--------------|-----|
| Input (PDF parse) | ~80,000 | ~$0.24 |
| Output (analysis) | ~30,000 | ~$0.45 |
| **Total cost** | **~110,000** | **~$0.69** |
| **Revenue (300K FTC)** | | **$3.00** |
| **Gross margin** | | **$2.31 (77%)** |

### Monthly Per Subscriber
| Metric | Value |
|--------|-------|
| Revenue | $10.00 |
| Cost (if full usage, 3.3 analyses) | ~$2.28 |
| **Margin** | **~$7.72 (77%)** |

### Revenue Streams
1. **Subscriptions** — $10/month base, higher tiers for more tokens
2. **Strategy marketplace** — contributor revenue share on token spend per strategy used
3. **Overage tokens** — buy more beyond monthly allotment
4. **Premium strategies** — hot strategies (high hit rate) priced higher via dynamic token cost

## Market Opportunity

### Addressable Market
- **US horse racing handle:** ~$12B annually (legal, on-track + ADW/online)
- **Active US bettors:** ~10M (estimated from ADW account data, track attendance, OTB)
- **Handicapping tools market:** ~$500M (DRF, TimeForm, Brisnet, STATS Race Lens, track-specific products)
- **Global racing handle:** ~$115B annually (UK, Australia, Hong Kong, Japan, France, Ireland, UAE, US)
- **Global active bettors:** ~50-100M

### Our Slice
- **Beachhead:** Serious US handicappers who already buy DRF ($30-50/month on data) and want an edge = ~500K people
- **Wedge:** AI-native bettors who want a handicapping partner, not a spreadsheet = growing fast
- **Expansion:** International racing (same model, different data feeds), sports betting crossover
- **At $10/month, 10K subscribers = $100K MRR.** That's the Year 1 target.
- **At scale (50K subs + marketplace):** $500K-$1M MRR with 75%+ margins

### Competitive Landscape
| Competitor | What they do | Our edge |
|-----------|-------------|----------|
| DRF / Brisnet | Raw data (PPs, figures) | We deliver picks + reasoning, not just data |
| TimeForm | Ratings + speed figures | We're conversational, adaptive, strategy-selectable |
| STATS Race Lens | AI speed figures | No wagering plan, no exotic construction, no agent |
| Tipster services | "Bet this horse" | No transparency, no methodology, no form charts |
| ChatGPT + racing prompts | Generic LLM | No racing-specific signal model, no DRF parsing, no track record |

### Defensibility
1. **The model improves with every race** — signal weights, strategy form charts, and hit rates evolve from real results
2. **Marketplace network effects** — more contributors = more strategies = more users = more data = better strategies
3. **Proprietary signal library** — S1-S11 (and growing) with validated performance records
4. **Brand** — Fade the Chalk has personality. Tipping services are commodities; we're a club.

## Non-Negotiables

- One DB. Everything reads from and writes to the same Postgres.
- Same prompts/methodology whether running locally in Claude Code or via API on the site.
- Signals and strategies are data (DB rows), not hardcoded in prompts.
- Parse once. Never re-enter race data manually.
- The model keeps improving: Signal Evolution rule fires from DB queries, not manual review.
