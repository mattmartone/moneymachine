
# Near-Future Architecture 6/15 — Fully Agentic System

## The Org

| Role | Identity | Responsibility |
|------|----------|----------------|
| **The Don** | Matt (human) | Strategic oversight. Supplies race data (Brisnet, Wednesdays). Approves model changes. Reviews post-mortems. Declares what tracks/days we play. Observes execution. Provides feedback where needed. |
| **The Street Boss** | Orchestration Agent (autonomous) | Runs race day end-to-end. Owns the pipeline from data load through settlement. Communicates with members. Delivers pre-race alerts, scratch verdicts, results, post-mortems. Reports up to the Don. Proposes model updates. |
| **The Builder** | Claude Code Agent (semi-autonomous) | Builds and ships product changes. Takes approved proposals from the Street Boss or direct orders from the Don. Deploys code, updates strategies, modifies site, wires new integrations. |

## How They Interact

```
THE DON (Matt)
  │
  ├── Supplies: Brisnet DRF files (weekly, ~Wednesday)
  ├── Approves: model changes, new strategies, rule modifications
  ├── Observes: race day execution via alerts + site
  ├── Feedback: course corrections when needed
  │
  ▼
THE STREET BOSS (Orchestration Agent)
  │
  ├── Executes: full race day pipeline autonomously
  ├── Communicates UP: morning plan, post-race results, post-mortem proposals
  ├── Communicates DOWN: pre-race emails, scratch alerts, results to members
  ├── Proposes: model updates based on outcomes → queued for Don's approval
  ├── Delegates: approved build items → Builder agent backlog
  │
  ▼
THE BUILDER (Claude Code)
  │
  ├── Receives: approved proposals from Street Boss or direct Don orders
  ├── Ships: code changes, strategy DB updates, site modifications, new integrations
  ├── Reports: build complete → Street Boss confirms operational
  │
  ▼
MEMBERS
  │
  ├── Receive: emails (pre-race, scratch alerts, post-mortem)
  ├── Interact: site (Today page, Build Your Bets, Strategies Marketplace)
  ├── Future: Slack channel, website agent chat, Willo text/voice
  └── Entitlements: token spend → Commission picks, day passes, individual race unlocks
```

---

## Communication Channels

| Channel | From → To | Purpose | Status |
|---------|-----------|---------|--------|
| **Email (Resend)** | Street Boss → Members | Pre-race alerts, scratch verdicts, post-mortems, card drops | Active |
| **Email (Resend)** | Street Boss → Don | Morning plan, end-of-day recap, approval requests | Planned |
| **Slack** | Don ↔ Street Boss | Real-time oversight, feedback, approvals | Planned |
| **Slack** | Street Boss ↔ Members | Race day interaction, Q&A, alerts | Future |
| **Willo (Text/Voice)** | Street Boss → Members | Push alerts, conversational race day experience | Future |
| **Site Agent** | Members → Street Boss | On-site chat for strategy questions, race analysis requests | Future |
| **Claude Code CLI** | Don ↔ Builder | Direct build sessions, architecture work, deep analysis | Active |
| **Build Queue** | Street Boss → Builder | Approved proposals queued for implementation | Planned |

---

## The Don's Weekly Workflow (Target State)

| Day | Action | Effort |
|-----|--------|--------|
| **Wednesday** | Purchase Brisnet DRF files for weekend tracks. Supply to system. | 5 min |
| **Thursday** | Review Street Boss's proposed track list and card structure. Approve or adjust. | 10 min |
| **Friday** | Optional: review any model change proposals queued from last weekend's post-mortem. Approve for Builder. | 10 min |
| **Saturday/Sunday** | Observe. Receive morning plan email. Receive pre-race alerts. Check results as they come in. Provide feedback if needed. | Passive |
| **Monday** | Review post-mortem. Approve/reject proposed strategy changes. Declare build priorities. | 15 min |

**Total weekly active time: ~40 minutes.** Everything else is autonomous.

---

## The Street Boss's Race Day Pipeline (Fully Autonomous)

### Morning (T-4 hours before first race)

1. **Load data** — parse Brisnet files already supplied, pull Racing API fields/post times
2. **Run Phase 1-5** — full analysis via Claude API on all qualified races
3. **Produce Commission Card** — top 5-8 high-conviction picks
4. **Insert bets into DB** — entries_used, stakes, conviction, strategy activations
5. **Generate PDF** — card formatted for member consumption
6. **Send morning email to Don** — "Today's plan: 7 picks across 3 tracks. $X total wagered. Here's the card."
7. **Publish to site** — Today page populated, Commission banner active
8. **Send card email to members** — PDF attached, picks summarized

### Pre-Race (T-60 through T-35 per race)

9. **T-60: Pull live odds** — store in DB, check for S2/S3 signal changes
10. **T-50: Check scratches** — classify CONSEQUENTIAL vs NON-CONSEQUENTIAL
11. **T-45: Re-analyze if needed** — if scratch or odds shift changes the pick, call Claude API for revised analysis
12. **T-35: Send pre-race email** — live odds, scratch status, revised ticket (or drop notice), results from earlier races

### Post-Race (T+10 per race)

13. **Pull results** — finish order + payouts from Racing API
14. **Settle bets** — mark hit/miss, calculate collected
15. **Update performance** — Today page panel refreshes
16. **If all races settled** — trigger end-of-day sequence

### End of Day

17. **Run post-mortem analysis** — race-by-race via Claude API
18. **Identify patterns** — stale ceilings, box errors, strategy performance
19. **Propose model updates** — queue for Don's approval
20. **Generate post-mortem PDF**
21. **Send recap email to Don** — results, P/L, Commission vs Added, proposals
22. **Send recap email to members** — headline results, lifetime update, what's coming
23. **Update landing page** — performance table row added

---

## Member Experience (Target State)

### Entitlement Tiers

| Tier | Access | Cost |
|------|--------|------|
| **Commission Day Pass** | All Commission picks for the day (5-8 races) | X tokens |
| **Track Day Pass** | All races at one track for the day | X tokens |
| **Single Race Unlock** | One race — field, analysis, pick, pre-race alert | X tokens |
| **Build Your Own** | Select strategies, run against any race | X tokens per race |
| **Membership (monthly)** | All Commission picks, all alerts, full archive | $X/mo |

### Member Race Day Experience

1. **Morning:** Email arrives with today's card summary. "The Commission has 7 plays today. Unlock for X tokens."
2. **Unlock:** Member spends tokens on site (Commission pass, track pass, or individual race)
3. **T-35 min:** Pre-race email for each entitled race. Live odds. Scratch status. Full ticket. "Place this bet."
4. **During:** Results update on Today page as races finish. Performance panel live.
5. **Evening:** Post-mortem email. What won, what lost, what we learned. Lifetime ROI update.
6. **Ongoing:** Strategies Marketplace shows live performance data. Members can browse, favorite, and build cards using strategies with proven track records.

---

## APIs Required (Gap Analysis)

| API | Role | Status | Gap |
|-----|------|--------|-----|
| **Racing API** | Fields, post times, live odds, scratches, results | Active ($49.99/mo) | Historical depth unknown — need to verify for 12-month backfill |
| **Brisnet** | Past performances (Beyers, PPs, workouts, comments) | Active ($1.50/track/day) | Manual purchase — no API for auto-download |
| **Claude API** | Race analysis (Phase 1-5), scratch re-analysis, post-mortem generation | **NOT YET CONNECTED** | Need Matt's personal account API key. Critical for autonomy. |
| **Resend** | Email delivery | Active | Need pre-race + scratch email templates |
| **Stripe** | Payments — token purchases, memberships | Planned | Not yet wired |
| **Vercel Cron** | Scheduling | Active (Pro needed for <1hr intervals) | Currently free tier (once/day). Need Pro for 10-min intervals. |
| **Supabase** | Database | Active | May need to upgrade plan for connection pooling under cron load |
| **Slack API** | Don ↔ Street Boss communication, future member channel | **NOT YET CONNECTED** | Need workspace + bot setup for FTC |
| **Willo / Twilio** | Text/voice push to members | Future | Not scoped yet |

### Critical Gaps for Full Autonomy

1. **Claude API key** — without this, the Street Boss can't run Phase 1-5 or re-analyze scratches autonomously. This is THE blocker.
2. **Vercel Pro** — free tier cron is once/day. Need 10-min intervals for live odds/scratch/results polling.
3. **Brisnet automation** — currently Matt manually downloads DRF files. No API exists. Best path: Matt supplies Wednesday, system stores and auto-parses. Accept this as the one human input per week.
4. **Stripe** — token economy isn't live yet. Members can't pay for access. Blocks revenue.

---

## Deterministic vs. Agentic Execution

| Step | Execution Type | Why |
|------|---------------|-----|
| Data load (parse, API pull) | **Deterministic** | Mechanical. No judgment. Script runs the same every time. |
| Phase 1 (qualify races) | **Deterministic** | Hard rules: field size gate, maiden gate, inside speed gate. Binary pass/fail. |
| Phase 2 (tag styles, map pace) | **Deterministic** | Reading positions at each call → assigning tags. Rule-based. |
| Phase 3 (signal scoring) | **Semi-deterministic** | Most signals are queries (S4: trainer win% >15% at meet). S1 requires judgment (did jockey CHOOSE this mount?). |
| Phase 4 (build bets) | **Deterministic** | Ceiling sort → top 4/5 → fave inclusion → win pick at 7/2+. Mechanical. |
| Phase 5 (synthesize thesis) | **Agentic** | Narrative judgment: why this horse wins, what scenario benefits them. Requires LLM. |
| Scratch classification | **Deterministic** | Win pick gone = CONSEQUENTIAL. Anything else = NON-CONSEQUENTIAL. Binary. |
| Box rebuild after scratch | **Deterministic** | Next-highest ceiling fills the slot. Mechanical sort. |
| Pre-race email generation | **Agentic** | Composing context-aware summary with odds, scratches, conviction narrative. |
| Results settlement | **Deterministic** | PP matching against box. Math. |
| Post-mortem analysis | **Agentic** | Pattern recognition across races. Why did the model miss? What's the lesson? |
| Strategy proposals | **Agentic** | Identifying new rules from data. Requires judgment + creativity. |
| Build execution | **Agentic** | Writing code, shipping features. Builder agent. |

**Principle:** Everything that CAN be deterministic SHOULD be. Reserve LLM calls for judgment, narrative, and discovery. This minimizes token cost and maximizes reliability.

---

## System Boundaries

```
HUMAN INPUT (minimal):
  - Brisnet files (~Wednesday)
  - Approvals (model changes, strategy updates)
  - Feedback (course corrections)
  - Track/day declarations ("we're playing Saratoga + Belmont this weekend")

AUTONOMOUS (Street Boss handles):
  - Everything from data load through member communication
  - All race day monitoring and alerting
  - Results settlement and performance tracking
  - Post-mortem analysis and proposal generation
  - Member entitlement delivery

REQUIRES APPROVAL (queued for Don):
  - New hard rules
  - Strategy weight changes
  - Strategy retirement
  - Pricing changes
  - Any communication that goes beyond standard templates
```

---

## Target: From 4+ Hours/Race Day → 5 Minutes/Week

| Current State | Target State |
|---------------|--------------|
| Matt manually downloads Brisnet | Matt downloads Wednesday, supplies once |
| Matt runs Claude Code for Phase 1-5 | Street Boss calls Claude API autonomously |
| Matt manually checks odds/scratches | Cron polls, agent classifies and acts |
| Matt decides whether to bet after scratch | System delivers verdict, member executes |
| Matt manually pulls results | Cron auto-settles |
| Matt runs post-mortem session | Agent generates, queues proposals |
| Matt updates landing page manually | Auto-updates after each race day |
| Matt sends member emails manually | Automated on schedule |

**The Don's job becomes: supply data, approve changes, collect returns.**
