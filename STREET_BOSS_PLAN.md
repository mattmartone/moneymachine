# The Street Boss — Autonomous Decision Engine

## Status: READY TO BUILD (prerequisites completed 7/3)

---

## What This Is

A Heroku worker that runs the full FTC handicapping model autonomously via Claude API. Loads data, analyzes fields, presents candidates for Commission approval, monitors scratches/odds, settles results, reports P/L — all without Matt attached. Queryable from mobile.

**Key insight (7/3):** Matt's Commission selection is the alpha (+97% win ROI, 35% hit rate). The model's blind output is +7% win rate. Street Boss operates in **approval mode** — it presents candidates, Matt picks Commission from his phone, THEN it executes.

---

## What's Been Built (as of 7/3)

| Component | Status | Notes |
|-----------|--------|-------|
| Brisnet Parser | ✅ FIXED | `parse_drf_full.mjs` — field 315 (race distances), was reading field 137 (workouts) |
| Deterministic Scoring | ✅ DONE | `score_with_trace.mjs` — full Phase 1-5, all 11 signals, relative gate, tiebreaks |
| Scored Candidates Table | ✅ DONE | Persists ALL candidates (HIGH/MEDIUM/LOW/blocked) with signal breakdown |
| Relative Gate + Fallback | ✅ DONE | Only blocks uniquely unproven picks; fallback to career Beyer; conviction cap |
| Distance Ceiling (correct) | ✅ DONE | Parser fix → model sees 3.75x more races |
| Tiebreak Hierarchy | ✅ DONE | distance_beyer → best_beyer when signal scores tie |
| Racing API Pull | ✅ DONE | `pull_racing_api.mjs` — ML, post times, jockeys, scratches |
| Results Pull | ✅ DONE | `pull_results.mjs` — finish order, normalized payouts |
| Vercel Cron (monitoring) | ✅ LIVE | Odds, scratches, pre-race emails, results every 5 min |
| Strategy Tagging | ✅ DONE | `ensureStrategyTags()` in cron auto-tags on every cycle |
| Insights Script | ✅ DONE | `scripts/insights.mjs` — signal combos, day patterns, composite analysis |
| FTC Site + Mobile | ✅ LIVE | Today page, Performance, modal system, email capture |

### What Matt Still Does Manually

| Step | Time | Can Street Boss Do It? |
|------|------|----------------------|
| Buy Brisnet files | Day before | ❌ No API (Equibase inquiry pending) |
| Parse files | 2 min | ✅ Auto-ingest on file drop |
| Pull Racing API | 1 min | ✅ Scheduled (6 AM) |
| Score all candidates | 15 min | ✅ `score_with_trace.mjs` runs autonomously |
| Select Commission (~10) | 5 min | ❌ Matt's judgment = alpha. Slack approval. |
| Monitor scratches | Race day | ✅ Cron handles; Street Boss re-analyzes |
| Place bets | 2 min | ❌ Mike places from picks (no ADW API) |
| Settle results | 1 min | ✅ Auto-settles post-race |
| Post-mortem | 15 min | ✅ Auto-runs insights + random sim |

**Matt's total time under Street Boss: ~7 min (buy Brisnet + approve Commission on phone)**

---

## Architecture

```
MATT'S PHONE (Slack)
      |
      v (approve/reject)
HEROKU DYNO ($7/mo)
├── Express server (Slack webhook + chat API)
├── Worker loop (scheduled phases)
│     +→ Supabase (all state — bets, races, entries, scored_candidates)
│     +→ Racing API (odds, scratches, results)
│     +→ Resend (member emails)
│     +→ Claude API (Phase 5 synthesis, scratch re-analysis, postmortem)
└── CLAUDE.md loaded as system prompt for all Claude API calls

FTC SITE (Vercel) → reads from same Supabase
├── Mobile Today page (Commission picks, results)
├── Performance (live from bets+results)
└── /agent chat (proxied to Heroku)
```

### System Prompt Strategy

Street Boss loads `CLAUDE.md` content at startup and passes it as the `system` field on Claude API calls. Same methodology, same rules, same voice — just running in the cloud instead of a local terminal session. Updates to CLAUDE.md propagate on next Heroku restart.

---

## Two Wagering Modes

| Mode | When | Staking | Win Bet? |
|------|------|---------|----------|
| **Commission (Matt approves)** | Every race day | 70/30 win-to-exacta, pool-weighted $1K | Yes — Matt's picks hit 35% |
| **Autonomous (no approval)** | If Matt unavailable | Exacta-only, capped at MEDIUM conviction | Only on S4+S5+S9 triple |

Default is Commission mode. Autonomous is fallback only.

---

## Daily Lifecycle

| Time (ET) | Action | Type |
|-----------|--------|------|
| 6:00 AM | Pull Racing API (fields, post times, ML) | Deterministic |
| 6:05 AM | Parse any new Brisnet files (if Matt dropped them) | Deterministic |
| 7:00 AM | Run `score_with_trace.mjs` → scored_candidates populated | Deterministic |
| 7:05 AM | Run `insights.mjs` → day confidence assessment | Deterministic |
| 7:10 AM | Post to Slack: ranked candidates + day assessment | Deterministic |
| 7:10-8:00 | **Matt reviews on phone, taps to approve ~10 for Commission** | Human |
| 8:00 AM | Tag approved as COMMISSION, compute pool-weighted stakes | Deterministic |
| 8:05 AM | Write bets to DB, publish to site | Deterministic |
| 8:10 AM | Claude API: write race theories for Commission picks | Claude ($) |
| 8:15 AM | Send morning card email to members | Deterministic |
| T-60 | Pull live odds | Cron |
| T-50 | Check scratches, re-analyze if thesis-critical | Deterministic + Claude ($) |
| T-35 | Pre-race email to members | Deterministic |
| T+15 | Pull results, settle bets | Deterministic |
| After last | Auto-postmortem: P/L, signal analysis, insights, random sim (1000x) | Deterministic + Claude ($) |
| EOD | Email recap to Matt | Deterministic |

---

## Slack Approval Flow

1. Street Boss posts to Slack channel: ranked candidates with composite, signals, vulnerability, race theory preview
2. Each candidate has a thumbs-up reaction target
3. Matt reacts to ~10 he wants for Commission
4. Street Boss reads reactions, tags COMMISSION, computes stakes, publishes
5. If no approval by 30 min before first post time → autonomous mode kicks in (exacta-only on top composites)

---

## Hybrid Model: Code vs. Claude

**Deterministic (free, TypeScript — already built):**
- Phase 1-4: qualify, style, pace, signals, win pick, box, conviction
- Scratch classification (consequential vs non-consequential)
- Box rebuild on non-consequential scratch
- Results settlement + P/L computation
- Strategy tagging
- Pool-weighted stake allocation

**Claude API (~$0.50-$1/race, Sonnet):**
- Phase 5: race theory narrative synthesis
- Scratch re-analysis when pace map fundamentally changes (favorite scratched → new vulnerability assessment)
- Postmortem observations (pattern recognition across the day)
- Chat responses from /agent
- CLAUDE.md = system prompt for all calls

---

## What Matt Needs to Supply

1. **Claude API key** — `sk-ant-...` for Heroku config var
2. **Heroku app name** — e.g., `street-boss` or `ftc-agent`
3. **Slack webhook URL** — for the approval channel (or we use existing FTC pipeline channel)
4. **Brisnet delivery method** — drop .DRF files somewhere Street Boss can grab them (upload endpoint on the site, or a watched S3 bucket)
5. **One decision confirmed:** Approval mode is default (✅ confirmed 7/3 — your selection is the alpha)

---

## Sprints

### Sprint 1: Foundation (Days 1-2)
**Goal:** Street Boss exists in the cloud and can score a card autonomously.

- [ ] Matt supplies: Claude API key, Heroku app name
- [ ] Create Heroku app, env vars, Express scaffold, deploy hello world
- [ ] Port `score_with_trace.mjs` to run as a scheduled job (6 AM trigger)
- [ ] Add Brisnet file upload endpoint (Matt drops .DRF → auto-parses)
- [ ] Racing API pull runs on schedule (no manual CLI)
- [ ] Verify: drop a Brisnet file, next morning scored_candidates is populated

**Deliverable:** Matt drops Brisnet files, wakes up to scored candidates in DB.

---

### Sprint 2: Communication (Days 3-4)
**Goal:** Street Boss talks to Matt via Slack and takes direction.

- [ ] Matt supplies: Slack webhook URL
- [ ] Post ranked candidates to Slack each morning (composite, signals, theory preview)
- [ ] Read Slack reactions → tag approved races as COMMISSION
- [ ] Fallback: if no approval by T-30, run autonomous mode (exacta-only on top composites)
- [ ] Wire Claude API for race theory generation (system prompt = CLAUDE.md)
- [ ] Cost tracking: log every Claude call with tokens + cost

**Deliverable:** Matt approves Commission from his phone in 5 minutes.

---

### Sprint 3: Race Day Intelligence (Days 5-6)
**Goal:** Street Boss handles live race day decisions without Matt.

- [ ] Scratch re-analysis agent: detect → assess → BET STANDS / DROP / REBUILD → post verdict to Slack
- [ ] Odds monitoring: if win pick goes below 5/2, kill win bet automatically, alert Matt
- [ ] Pool-weighted stake allocation: pull pool sizes, distribute $1K bankroll
- [ ] Auto-settlement: results pulled, bets settled, P/L computed
- [ ] Postmortem automation: insights script + random sim (`scripts/random_sim.mjs` — 1000 sims, random race AND horse selection from full scored pool, compare vs model net, report % beaten + edge vs median) + recap email

**Deliverable:** Full race day runs with Matt's only input being morning Slack approvals.

---

### Sprint 4: Refinement Session Support (Days 7-8)
**Goal:** Matt's Claude Code session is pre-loaded and focused.

- [ ] /agent chat endpoint on Heroku (query candidates, ask about pace maps, compare picks)
- [ ] Pre-session brief: when Matt opens Claude Code, scored_candidates + day assessment already in context
- [ ] Session handoff: anything Matt changes during the session (overrides, drops, adds) Street Boss picks up and executes
- [ ] Validate against 6/19 and 6/20 historical data — same picks as manual sessions?

**Deliverable:** Matt's morning session goes from 4 hours to 45 minutes.

---

### Sprint 5: Go Live (Days 9-10)
**Goal:** Production confidence.

- [ ] Shadow mode: Street Boss runs alongside manual session for 2-3 race days. Compare outputs.
- [ ] Reconcile: any differences between Street Boss picks and manual picks → tune thresholds
- [ ] Go live: Matt approves from phone, Street Boss executes, session is refinement only
- [ ] Monitor: cost per day, accuracy vs manual, edge vs random

**Deliverable:** Race day is 5 min approval + 45 min optional refinement. Everything else autonomous.

---

## Migration Plan

- **Week 1:** Street Boss runs in shadow mode — scores, proposes, but Matt still runs manual session. Compare outputs.
- **Week 2:** Street Boss proposes via Slack, Matt approves from phone. Manual session as backup only.
- **Week 3:** Full handoff. Matt supplies Brisnet on Wednesday, approves Commission on race day morning. Done.

---

## New DB Tables

- `agent_decisions` — trigger, reasoning, action taken, timestamp
- `agent_state` — current phase, heartbeat, next scheduled action
- `agent_costs` — per-call: model, tokens_in, tokens_out, cost_usd, purpose

(Chat and P/L already covered by existing tables)

---

## Matt's Expectations (collected during build)

- ONLY present HIGH conviction races (fave_vulnerable = true + signal score ≥ 3) as Commission candidates. MEDIUM without vulnerable fave = never bet, tracking only.
- Every action Street Boss takes → Slack notification with action, reason, outcome
- 9 AM daily card scan → alert Matt which tracks are running + qualifying race count → Matt decides if it's a race day
- If Brisnet files already uploaded → Street Boss recognizes it's a race day automatically (no need to wait for approval)
- Street Boss creates the execution tracker page for the day and sends Matt the link
- Collaboration happens over Slack (Matt approves, asks questions, overrides) — same as terminal collab but on phone
- Street Boss does everything the manual pipeline does: parse, pull API, scratch, score, present candidates, settle, postmortem
- The back-and-forth refinement session remains (Matt's judgment = alpha) — Street Boss pre-loads everything so the session is 45 min not 4 hours

## Success Criteria

- Produces same scored_candidates as manual `score_with_trace.mjs` run (validated against 6/19)
- Handles all scratch scenarios correctly per documented rules
- Slack flow works: candidates posted, reactions read, Commission tagged within 5 min of approval
- Claude API calls tracked with cost — total stays under $15/race day
- Race theories read naturally (same quality as manual sessions)
- Full race day runs with Matt's only action being Slack approvals (~7 min total)
- Performance page numbers match regardless of whether Street Boss or manual session ran the day
