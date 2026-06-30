# Fade the Chalk — Strategy Stable

A plain-language guide to every strategy in the model. Each one is like a horse in training — it has a job, a form line, and conditions where it thrives.

---

## The Thesis

We never bet the favorite. We find races where the public's pick is vulnerable, then bet against it with structured exotic boxes. The strategies below are the signals and structures that tell us WHEN and HOW to act.

---

## Signal Strategies (the scouts)

These fire on individual horses. When a signal fires on our win pick, it adds conviction. Multiple signals stacking = high confidence.

---

### S1 — Elite Jockey on Bomb

**What it does:** Flags when a top-tier jockey (Prat, Ortiz, Saez, Velazquez, Gaffalione, Rosario, Castellano, Franco) is riding a longshot at 12/1 or higher.

**Why it matters:** Elite riders don't waste mounts. When a world-class jockey takes a horse at 12/1, they see something the public doesn't. That's information asymmetry you can bet.

**How it's detected:** Entry has morning_line_odds ≥ 12/1 AND jockey name matches the elite list.

**Performance:** 5 fires, 0 wins, -$250 net, -100% ROI

**Current form:** Cold. Hasn't produced a winner yet. Small sample — 5 fires total. Still worth watching because the theory is sound and one hit at 12/1+ pays back the whole series.

**Data we have:** Jockey name from Brisnet/Racing API. Morning line odds.

**Data that could improve it:** Jockey win% at this specific track/meet, jockey-trainer combo stats (some partnerships click), whether the jockey switched TO this horse from another entry in the same race.

---

### S4 — Hot Barn at a Price

**What it does:** Identifies a horse whose trainer is winning at a high rate (≥15%, ≥5 starters at the meet) but the horse is still at 6/1 or higher.

**Why it matters:** Trainers on hot streaks have their stable in form. When one of their runners is overlooked at a price, the public is undervaluing a barn running well.

**How it's detected:** Win pick's trainer stats from Brisnet .DRF data (trainer wins/starts at meet), horse at morning line ≥ 6/1.

**Performance:** 19 fires, 7 wins, +$874 net, +95% ROI

**Current form:** One of the best. Nearly doubles money over 19 fires. The trainer data from Brisnet is the key ingredient.

**Data we have:** Trainer name, meet-level win/start counts from Brisnet DRF files.

**Data that could improve it:** Trainer stats by surface (turf vs dirt), trainer stats by distance range, trainer second-start-off-layoff percentage, trainer claiming stats. The Racing API has trainer IDs but no stats — these would need to be computed from historical results or a stats provider.

---

### S5 — Distance Stretch-out

**What it does:** Fires when today's race is longer than anything in the horse's past performance history. First time at this distance.

**Why it matters:** Stretch-outs are polarizing. The public often underestimates horses trying a new distance because there's no proven form. But breeding and running style can indicate they'll handle it. We catch the value when the public doesn't trust what they can't see.

**How it's detected:** Race distance (in yards) exceeds the maximum `distance_yards` from all past performances.

**Performance:** 23 fires, 9 wins, +$1,118 net, +93% ROI

**Current form:** Top performer. 39% win rate on stretch-outs. The model loves finding value here.

**Data we have:** Race distance, full PP history with distance_yards per race.

**Data that could improve it:** Sire/dam distance aptitude data (pedigree tells you if a horse should handle the stretch), workout data at longer distances, class-of-opposition comparison (stretching out against weaker fields is different from stretching out against better).

---

### S6 — Best Last-Race Beyer

**What it does:** Fires when our win pick ran the highest Beyer speed figure in their most recent start compared to every other horse in the field.

**Why it matters:** Recency matters. A horse who just ran the best number in the field is in peak form RIGHT NOW — not three races ago. The public often looks at career-best, not last-out.

**How it's detected:** Win pick's `last_beyer` field is the highest among all entries in the race.

**Performance:** 12 fires, 5 wins, +$320 net, +51% ROI

**Current form:** Solid. 42% win rate. Consistent but not spectacular ROI — works as a confirmer, not a standalone.

**Data we have:** Last-race Beyer from Brisnet past performances.

**Data that could improve it:** Track variant adjustments (was that Beyer earned on a fast track or a speed-favoring surface?), Beyer trajectory (improving vs declining), Beyer earned at today's specific distance.

---

### S9 — Earnings Leader (Distance Ceiling)

**What it does:** Fires when our win pick has the highest proven Beyer figure AT TODAY'S DISTANCE (±1 furlong) in the field.

**Why it matters:** Career-best Beyers at ANY distance can be misleading. A horse who earned a 90 Beyer in a sprint doesn't necessarily bring that speed to a route. This isolates the distance-relevant ceiling.

**How it's detected:** Among all entries with a Beyer at today's distance (±220 yards), our win pick has the highest.

**Performance:** 4 fires, 1 win, -$98 net, -39% ROI

**Current form:** Early days, small sample. The theory is the backbone of our box construction (sort by distance Beyer) but as a standalone signal it hasn't proven yet. Needs more fires.

**Data we have:** Full PP history with distance_yards and Beyer per race. We compute `distanceBeyer` as best Beyer at today's distance ±1F.

**Data that could improve it:** Surface-specific distance Beyers (dirt 8F is different from turf 8F), adjusted for track speed (Saratoga 80 ≠ Canterbury 80), recency weighting (a distance Beyer from 2 starts ago > one from 10 starts ago).

---

### S11 — Inner Turf Rail Speed

**What it does:** Fires when a horse with early speed (E running style) draws inside post positions (1-2) on turf at a mile or longer, with no other speed horse drawn further inside.

**Why it matters:** On turf at route distances, the inside rail is everything. A speed horse breaking from post 1-2 saves ground on every turn and can control the pace with no one to challenge from the rail side.

**How it's detected:** Entry is running style = 'E', post_position ≤ 2, race is turf, distance ≥ 1 mile (1760 yards), no other 'E' horse drawn inside.

**Performance:** 10 fires, 5 wins, +$122 net, +25% ROI

**Current form:** Profitable with a 50% win rate. Lower ROI because these horses tend to go off at shorter prices (the public does notice rail speed to some degree). Still, 50% winners is exceptional.

**Data we have:** Running style classification, post position, surface, distance.

**Data that could improve it:** Turf course configuration (inner rail vs outer), going/ground condition (firm turf amplifies this, soft turf negates speed), actual turn radius data per track.

---

### S1-Adjacent: S2 — Late Tote Action

**What it does:** Detects significant late odds movement — horse dropping in price close to post time.

**Why it matters:** Late money is often "smart money" — trainers, owners, and informed bettors betting late so they don't move the odds too early.

**How it's detected:** Live odds significantly lower than morning line (exact threshold TBD — currently minimal data).

**Performance:** 2 fires, minimal data.

**Current form:** Barely tested. Needs live odds infrastructure to work properly.

**Data we have:** Morning line odds, some live odds from Racing API.

**Data that could improve it:** True tote board data (not just top-line odds), pool size (is this $500 or $50,000 being bet?), timing of the move relative to post.

---

### S3 — Odds Drift on Quality

**What it does:** Identifies a horse drifting to higher odds (getting dismissed by the public) despite having strong form indicators.

**Why it matters:** Sometimes the public chases the wrong horse. When a quality runner drifts, the value increases while the horse hasn't actually gotten worse.

**How it's detected:** Live odds higher than morning line AND horse has positive signals (good Beyers, strong trainer, etc.)

**Performance:** 4 fires, minimal data.

**Current form:** Early concept. Needs reliable live odds data to execute.

**Data we have:** Morning line, some live odds updates.

**Data that could improve it:** Historical odds drift patterns by track, which horses consistently drift (stable traits), whether drift correlates with post-time scratches in the same race changing the dynamic.

---

## Offensive Strategies (the game plans)

These are structural approaches to how we construct and size bets.

---

### Spot the Vulnerable Favorite

**What it does:** Identifies when the betting favorite has a structural disadvantage — wrong running style for the pace, trapped inside in traffic, or facing a scenario that historically defeats their type.

**Triggers:**
- Trigger A: Closer/stalker (P/S/E-P) drawn posts 1-3 in a field of 8+ (traffic trap)
- Trigger B: Speed horse (E) facing a pace duel (gets cooked) OR closer facing lone speed (no pace to run into)

**Why it matters:** This is the core thesis. The public overvalues favorites. When we can identify WHY a favorite is vulnerable, we're not just guessing — we have a structural reason to believe the chalk will lose.

**How it's detected:** Identify lowest-ML horse, classify their running style, assess pace scenario (count E horses), check field size and post position.

**Performance:** 24 fires, 9 wins, +$1,093 net, +89% ROI

**Current form:** Backbone of the model. Nearly 40% win rate and near-doubles money. When this fires, the model is at its most confident.

**Data we have:** Morning line (identifies favorite), running style classification from PPs, pace map, field size, post positions.

**Data that could improve it:** Live odds (sometimes the favorite shifts pre-race), historical pace collapse data by track, rail bias data (inside vs outside advantage varies by track condition).

---

### Doubled — Vulnerable Fave + Big Field

**What it does:** Doubles the win bet stake when BOTH conditions are true: the favorite is vulnerable AND the field has 10+ runners.

**Why it matters:** Big fields amplify favorite vulnerability. More traffic, more chaos, more chance the chalk gets cooked. And with 10+ runners, the exotic payoffs are juicier because there are more combinations for the public to spread across.

**How it's detected:** Vulnerable Favorite fires AND entries.length ≥ 10.

**Performance:** 7 fires, 2 wins, +$675 net, +104% ROI

**Current form:** Best ROI in the stable. Doubles money when it fires. Small sample (7) but the logic is sound — it's a conviction multiplier on the best setup.

**Data we have:** Vulnerability assessment + live field size (after scratches).

**Data that could improve it:** Granularity on field quality (10 cheap claimers vs 10 graded stakes runners is different), historical favorite win rate by field size at specific tracks.

---

### Beyer Ceiling Box

**What it does:** Constructs the exotic box by sorting all horses by their best Beyer at today's distance (±1F), taking the top 4, then ensuring our win pick and the favorite are included. Cap at 5 horses.

**Why it matters:** This is our box construction METHOD — not a signal. It answers "who goes in the exacta/trifecta box?" The distance-Beyer sort ensures we're including horses proven at THIS distance, not just career-best at any distance.

**How it's detected:** Fires on every race where we construct a box (which is all Commission races). It's the default method.

**Performance:** 15 fires, 4 wins, +$920 net, +119% ROI

**Current form:** Highest ROI in the stable. The box construction method is the engine of the model — it's what cashes the exotics.

**Data we have:** Full PP history with distance-specific Beyers.

**Data that could improve it:** Surface-specific sorting (separate dirt/turf ceiling), track-specific Beyer adjustments, adding pace position as a tiebreaker (in a pace duel, closers break the tie).

---

### Pace Makes the Race

**What it does:** Identifies races where the pace scenario creates a clear tactical advantage — typically pace duels that set up closers, or lone-speed scenarios that favor the front-runner.

**Why it matters:** Pace is the single most predictive factor in horse racing. A horse can't outrun a hot pace if they're part of it. When we identify the pace setup, we know who benefits and who dies.

**How it's detected:** Classification of E (early) horses in the field. 0 = no_speed, 1 = lone_speed, 2+ = pace_duel. Strategy fires when pace scenario clearly favors a non-favorite.

**Performance:** 10 fires, 1 win, +$402 net, +77% ROI

**Current form:** Low win rate (10%) but profitable because the one hit was at a big price. Classic longshot strategy — doesn't win often but pays big when it does.

**Data we have:** Running style classification from PP first-call positions, pace map.

**Data that could improve it:** Fractional time data (how fast is the actual pace going to be, not just who IS speed), par times by distance/surface/track, early pace figure (Brisnet has E1/E2 pace figures in the DRF).

---

### Key Against the Favorite

**What it does:** Structures exotic bets where the favorite is included in the box (they CAN finish 2nd/3rd) but is NOT our win pick. We're betting they'll be close but won't win.

**Why it matters:** Favorites finish in the money ~60% of the time even when they lose. By including them in the box but not as our winner, we capture the most likely exotic outcomes — the favorite running 2nd or 3rd under our longshot winner.

**How it's detected:** Fave is always in the box construction. This strategy tags races where the structure is explicitly "against the chalk WITH the chalk in the box."

**Performance:** 9 fires, 1 win, +$427 net, +85% ROI

**Current form:** Profitable. The logic is sound — favorites run 2nd/3rd more than the public bets them to.

**Data we have:** Favorite identification, box construction.

**Data that could improve it:** Historical favorite in-the-money% by field size and odds range, live odds (is the favorite drifting or getting hammered?).

---

### Cosa Nostra — Bet FOR, Not Just Against

**What it does:** In rare spots, bets FOR our pick to win outright (not just in an exotic box) at a price that justifies the risk. This is the "we believe this horse WINS" play.

**Why it matters:** Most of our model is about fading the chalk — betting against. But sometimes we find a horse we genuinely believe wins, not just survives. Those deserve a stronger win bet.

**How it's detected:** Win pick has multiple signals stacking (composite score very high) AND is at a meaningful price (6/1+).

**Performance:** 2 fires, 0 wins, -$150 net, -100% ROI

**Current form:** New concept, barely tested. Killed per the rule — if the pick becomes chalk (drops below 5/2), the win bet dies and we go exotics only. May not survive as a named strategy.

**Data we have:** Composite score, morning line odds.

**Data that could improve it:** Live odds confirmation (is the horse holding price or getting bet down?), multi-signal stacking threshold calibration.

---

## Rules (the guardrails)

These DON'T fire as positive signals — they PREVENT action. They protect the bankroll from bad spots.

---

### R1 — No Short Fields
Skip races with fewer than 5 live entries. Exotics aren't meaningful with tiny fields.

### R2 — Never Bet the Favorite
Hard gate. Our win pick can never be the lowest-odds horse. This is the soul of the model.

### R3 — No Maiden Races
(Not currently enforced) Maiden races are unpredictable — no form to model.

### R4 — Sit Out Inside Lone Speed Fave
When the favorite is an E horse with clear lone-speed advantage AND drawn inside, don't fight it. They win too often.

### R5 — Sharp Class Drop Fave = Vulnerable
A horse dropping sharply in class AND being bet as favorite = vulnerable. They're "supposed" to win but class drops often mean something is wrong.

### R6 — No Bullring Tracks
CT, BTP, DED, EVD, FMT, MNR, TDN, FL, ARP excluded. Model edge neutralized at sub-1-mile tracks.

### R7 — No Low-Conviction Exotics
Don't throw exacta/trifecta money at races where conviction is LOW. Save it for spots where the model has real edge.

### R8 — Beyer Ceiling Gap = Reduce Stake
When the favorite's distance Beyer exceeds our pick's by ≥8 points, cut the win stake in half. The class gap is real.

**Performance:** 3 fires, 0 wins, -$75. Working as intended — protecting capital on unfavorable spots.

### R9 — Sprint Closer Penalty
Closers in sprints face a structural disadvantage — not enough ground to make up. Apply caution.

---

## BOLOs (watch list)

Strategies that are observed but not yet systematically scored. Potential future signals.

---

### Troubled Trip
A horse whose last race involved traffic problems, being steadied, or losing ground due to circumstances rather than ability. Next time out = value if the public only sees the result, not the trip.

**Data needed:** Trip notes, chart commentary, video replay analysis. Currently manual observation only.

### Recent Life
Horse who raced within the last 14 days, suggesting trainer has the horse cranked and fit.

**Data needed:** Days since last race (available in PPs), but threshold needs calibration.

### Sharp Class Drop
Horse dropping ≥2 class levels. Could indicate opportunity (fresh field) or problems (trainer giving up). Needs contextual judgment.

**Data needed:** Class level per race in PPs (claiming price, graded stakes level, allowance conditions). Available in Brisnet data but not yet parsed as a discrete signal.

---

## Strategy Performance Summary (as of 6/27/2026)

| Strategy | Fires | Wins | Net | ROI | Form |
|----------|-------|------|-----|-----|------|
| Beyer Ceiling Box | 15 | 4 | +$920 | +119% | Hot |
| Doubled | 7 | 2 | +$675 | +104% | Hot |
| S4 — Hot Barn | 19 | 7 | +$874 | +95% | Hot |
| S5 — Distance Stretch-out | 23 | 9 | +$1,118 | +93% | Hot |
| Vulnerable Favorite | 24 | 9 | +$1,093 | +89% | Hot |
| Key Against the Favorite | 9 | 1 | +$427 | +85% | Warming |
| Pace Makes the Race | 10 | 1 | +$402 | +77% | Low hit rate |
| S6 — Best Last Beyer | 12 | 5 | +$320 | +51% | Steady |
| S11 — Turf Rail Speed | 10 | 5 | +$122 | +25% | Steady |
| S9 — Earnings Leader | 4 | 1 | -$98 | -39% | Cold |
| S1 — Elite Jockey Bomb | 5 | 0 | -$250 | -100% | Cold |
| Cosa Nostra | 2 | 0 | -$150 | -100% | Unproven |
| R8 — Reduce Stake | 3 | 0 | -$75 | -100% | Guard (working) |

---

## Key Insight: Signal Density = Day Confidence

**6/26 (Thursday):** S4(13), S5(11), S11(15), VulnFave(15) — signal-dense. Model lost $527 but beat random by $200.

**6/27 (Today):** Only Beyer Ceiling Box + S6/S9 + 2 VulnFave — signal-sparse. Low confidence before a single race runs.

**The opportunity:** If we can score "day confidence" based on which strategies are in the entry box, we can size stakes accordingly. High-signal days = full Commission. Low-signal days = reduced stakes or skip. This could meaningfully improve ROI by avoiding grind days that drag the model down.
