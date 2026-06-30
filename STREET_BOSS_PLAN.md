# The Street Boss — Autonomous Decision Engine

## Status: PLANNED (start after Sunday 6/22 race day)

---

## What This Is

A Heroku worker that runs the full FTC handicapping model autonomously via Claude API. Loads data, analyzes fields, makes picks, monitors scratches/odds, settles results, reports P/L — all without Matt attached. Queryable from mobile.

This is a research project first. Every race day produces training data. The system must run continuously, accumulate decisions, measure performance against its own operating costs, and self-correct over time. The goal is a closed-loop system that funds itself.

---

## Current State — How It Works Today

### What Exists

| Component | Status | What It Does |
|-----------|--------|-------------|
| FTC Site (Vercel) | Live | React app, member auth, Today page, Race Detail, Strategies marketplace |
| Vercel Cron | Live | Runs every 5 min — pulls live odds (T-60), checks scratches (T-50), sends pre-race email (T-35), pulls results (T+15) |
| Supabase Postgres | Live | Full schema: races, entries, horses, bets, results, strategy_activations, pipeline_events, strategies |
| Racing API | Active ($63/mo) | Live odds, scratches, post times, results — polled by cron and CLI scripts |
| Brisnet Parser | Built (CLI) | `parse_drf_full.mjs` — takes .DRF files, inserts races/horses/entries with full PPs, Beyers, positions |
| Racing API Pull | Built (CLI) | `pull_racing_api.mjs` — enriches DB with jockeys, trainers, post times, ML odds |
| Results Pull | Built (CLI) | `pull_results.mjs` — fetches results, normalizes payouts, settles bets |
| Resend Email | Working | Pre-race alerts, member notifications via noreply@org64.com |
| Model (CLAUDE.md) | Codified (5000+ lines) | Full Phase 1-5 execution sequence, 11 signals, all hard rules, bet construction |

### What Matt Does Manually (Per Race Day)

| Step | Time | Matt's Work |
|------|------|-------------|
| Buy Brisnet files | Day before | Go to brisnet.com, purchase .DRF for each track ($1.50 each) |
| Parse files | Morning | Run `node parse_drf_full.mjs ~/Downloads/SAR0621.DRF` per track |
| Pull Racing API | Morning | Run `node pull_racing_api.mjs 2026-06-21` |
| Run analysis | 2-3 hours | Open Claude Code session, provide Brisnet data, run Phase 1-5 conversationally |
| Insert bets | After analysis | Claude inserts picks into `bets` table during the session |
| Monitor scratches | Race day | Cron handles this now, but Matt reviews emails and decides override |
| Settle results | Post-race | Run `node pull_results.mjs 2026-06-21` or check manually |
| Post-mortem | Evening | Another Claude session analyzing what hit/missed, updating strategy weights |

**Total Matt time per race day: ~4-5 hours active work**

### The Bottleneck

The analysis itself (Phase 1-5) lives entirely in a Claude Code session. It requires:
- Matt to be at his computer
- A conversational back-and-forth providing data and confirming picks
- Manual judgment calls on edge cases (borderline qualifications, ambiguous S1 scoring)
- Matt's presence for the entire analysis window

The cron handles race-day monitoring well, but the BRAIN — the thing that looks at horses and decides who wins — requires Matt in the loop.

---

## Future State — How It Works After This Build

### What Changes

| Step | Today | After Street Boss |
|------|-------|-------------------|
| Buy Brisnet | Matt manually | Matt manually (until Equibase responds with flat-rate option) |
| Parse files | Matt runs CLI | Matt drops files → agent auto-ingests |
| Pull Racing API | Matt runs CLI | Agent pulls automatically at 6 AM |
| Run analysis (Phase 1-5) | Matt + Claude Code, 2-3 hrs | Agent runs autonomously via Claude API, ~15 min |
| Insert bets | During session | Agent inserts directly after analysis |
| Monitor scratches/odds | Vercel cron + Matt reviews | Agent monitors, decides, acts — notifies Matt only when material |
| Re-analyze on changes | Matt decides, re-runs manually | Agent decides and re-runs when pace map changes |
| Settle results | Matt runs CLI | Agent settles automatically |
| Post-mortem | Matt opens another session | Agent runs end-of-day, proposes strategy updates |
| Ask questions mid-day | Not possible | Matt opens /agent on phone, asks anything |
| Track costs | Not tracked | Every API call logged, daily P/L includes operating costs |

**Total Matt time per race day: ~5 minutes (supply Brisnet files Wednesday, glance at morning email, check phone if curious)**

### The Closed Loop

```
                    ┌─────────────────────────────────────┐
                    │                                     │
 Brisnet (Wed) ──► │  STREET BOSS (Heroku)               │
                    │                                     │
                    │  6 AM: Pull Racing API              │
                    │  7 AM: Phase 1-4 (deterministic)    │
                    │  8 AM: Phase 5 (Claude API)         │
                    │  8:15: Publish picks, email Matt    │
                    │  Race day: Monitor, decide, act     │
                    │  Post-race: Settle, measure, learn  │
                    │  EOD: Report P/L, propose updates   │
                    │                                     │
                    │  ← Matt asks from phone anytime     │
                    │  → Matt gets notified only when     │
                    │    something material happens       │
                    │                                     │
                    └────────────────┬────────────────────┘
                                    │
                                    ▼
                         Track operating costs
                         Track betting P/L
                         Net = self-sustaining?
```

### What Stays Manual (For Now)

1. **Buying Brisnet files** — no API for purchase (waiting on Equibase reply)
2. **Placing actual bets** — no ADW has an API; Mike still places manually from the picks
3. **Strategy rule changes** — agent proposes, Matt approves (model updates are deliberate)

---

## What Matt Needs to Supply

1. **Claude API key** — the `sk-ant-...` string (for Heroku config var)
2. **Heroku app name** — what to call it (e.g., `ftc-agent`, `street-boss`, etc.)
3. **Brisnet .DRF files** — dropped somewhere accessible (uploaded via site or local path)
4. That's it. Everything else exists in the codebase already.

---

## Architecture (Single Heroku Dyno)

```
MATT'S PHONE (Safari)
      |
      v
FTC SITE (Vercel) → /agent chat UI
      |
      v (proxy)
HEROKU DYNO ($7/mo)
├── Express server (chat API)
└── Worker loop (autonomous brain)
      |
      +→ Claude API (reasoning — Sonnet)
      +→ Racing API (live odds, scratches, results)
      +→ Supabase (all state)
      +→ Resend (emails)
```

---

## Hybrid Model: Code vs. Claude

**Deterministic (free, in TypeScript):**
- Phase 1: qualify (field size, maiden, bullring, lone speed)
- Phase 2: tag running styles, build pace map
- Phase 3: score signals S2-S11
- Phase 4: build bets (ceiling sort, top 4, stakes)
- Scratch classification (consequential = drop, non-consequential = rebuild box)
- Results settlement

**Claude API (costs ~$1-2/race):**
- Phase 3: S1 (jockey interpretation)
- Phase 5: synthesis (narrative, conviction, vulnerability thesis)
- Re-analysis when pace map fundamentally changes
- Pre-race email composition
- Post-mortem + strategy proposals
- Chat responses

---

## Daily Lifecycle

| Time | Action |
|------|--------|
| 6 AM | Pull Racing API (fields, post times) |
| 7 AM | Phase 1-4 (deterministic) |
| 8 AM | Phase 5 (Claude) → picks finalized |
| 8:15 AM | Morning card email to Matt |
| Race day | Monitor per race: T-60 odds, T-50 scratches, T-35 pre-race email, T+15 results |
| After last | Post-mortem → P/L report → recap email |

---

## Decision Logic (When to Re-Run)

**Mechanical (no Claude call):**
- Non-consequential scratch → rebuild box from next Beyer ceiling
- Odds move that doesn't change top-scored horse → just update DB

**Triggers Claude re-analysis:**
- Win pick scratched → drop race (code decides, Claude composes the notification)
- Surface change → fundamentally different pace analysis
- Pace map changes (speed horse scratched changes E count materially)

---

## Mobile Chat

Matt opens `/agent` on his phone:
- "What's the play in Race 7?" → full context response
- "Why'd you drop Race 3?" → decision log + reasoning
- "How's the day going?" → running P/L + upcoming races

---

## Cost Tracking

Every Claude call logged with tokens + cost. End-of-day report:

```
Wagered: $1,411 | Collected: $2,180 | Betting P/L: +$768
Operating: $12 (Claude $8, API $2, infra $2)
NET: +$756
```

Monthly floor: ~$220 (Heroku $7, Racing API $63, Brisnet ~$100, Claude ~$50)

---

## New DB Tables

- `agent_decisions` — trigger, reasoning, action taken
- `agent_state` — current phase, heartbeat, next action
- `agent_conversations` — chat history
- `agent_costs` — per-call cost log
- `agent_pl` — daily P/L rollup

---

## Build Sequence (5 days)

1. Create Heroku app + env vars + project scaffold
2. Port Brisnet parser + Racing API to TypeScript
3. Implement deterministic Phase 1-4 scoring
4. Wire Claude API client with cost tracking + Phase 5
5. Build autonomous loop (phase detection, monitoring, settling)
6. Build chat endpoint + mobile UI
7. Create DB tables
8. Deploy, validate against June 14 data
9. First live run on next available race day

---

## Migration

- Week 1: Heroku runs analysis, Vercel cron still handles monitoring
- Week 2: Heroku takes over monitoring + settlement
- Week 3: Vercel cron disabled, Heroku owns everything

---

## Success Criteria

- Produces same picks as manual analysis (validated against 6/14 card)
- Handles all scratch scenarios correctly per documented rules
- Logs every decision with reasoning
- Costs tracked accurately
- Chat responds with correct context from mobile
- Runs a full race day with zero intervention from Matt
