# Week of June 30, 2026 — Strategy & Case Study Tracker

## Entering Thesis

We are transitioning from "bet everything the model qualifies" to a selective, allocation-optimized approach. The hypothesis: fewer races, smarter sizing, same or better profit with dramatically less capital at risk.

## Strategic Changes (adopted 6/28–6/29)

### Hard Gates (auto-disqualify)
| Gate | Rule | Evidence |
|---|---|---|
| Purse minimum | < $25K → kill | 22 races, 14% win rate, -56% ROI |
| Surface | Turf → kill | 28 races, 29% win rate, -22.6% ROI |
| (Existing) Bullring tracks | Kill | Model edge neutralized |
| (Existing) Maiden races | Kill | Unpredictable first-timers |

### Qualifying Filters (from backtest)
| Filter | Threshold | Evidence |
|---|---|---|
| Win pick ML odds | 6-1 to 12-1 | 65% ROI on 28 races vs 19% baseline |
| E-type count | 3+ (pace heat) | Pace duel is the value creation mechanism |
| Field size | 6+ runners | Below 5 = no edge |

### Weighting Signals (not gates)
| Signal | Effect | Evidence |
|---|---|---|
| Race type: Allowance/AOC | +3 composite bonus, fills card first | 47% win rate, 69-42% ROI |
| Race type: Claiming $25K+ | Standard composite, fills remaining slots | 42% win rate, 75% ROI |

### Stake Allocation
| Change | Old | New | Evidence |
|---|---|---|---|
| Win-to-exacta split | 45/55 ($100W/$120Ex) | 70/30 ($154W/$66Ex) | +$566 improvement modeled on 6/28 card |
| Box sizing | Flat 5-horse | Dynamic by ML odds (20-1+→5, 10-19→4, 6-9→3) | Breakeven math |
| Pool curve | Flat across races | Mid > Big > Small | RJ hypothesis + purse-tier correlation to ROI |

### Pool-Based Allocation (new this week)
- **Curve:** Mid pools ($50K-$300K) → heaviest bet. Large pools ($300K+) → moderate bet. Small pools (<$50K) → lightest bet.
- **Rationale:** Our signal (pace vulnerability + Beyer ceiling) is novel/orthogonal to public money. Mid pools have proven edge + liquidity. Big pools are fine but don't need premium. Small pools risk line movement.
- **Workflow:** Agent qualifies → posts to Slack → Matt supplies pool sizes from NJ4Bets → agent applies curve → returns complete wagering plan → Matt approves once → agent executes.
- **Status:** Concept locked. Exact multipliers TBD after backwards study on historical pool sizes.

## This Week's Objectives

1. **Backwards study:** Map actual pool sizes to our 35 wins and 62 losses. Confirm the mid-pool hypothesis with real numbers.
2. **First card under new rules:** Apply all hard gates + filters + 70/30 split + dynamic box sizing. Track how many races get filtered out vs. old approach.
3. **Pool data collection:** Begin capturing pool sizes (from Matt via Slack) on race day for future modeling.
4. **Pre-race pool feasibility:** Confirm whether Racing API or any programmatic source provides live pool data before post time.
5. **Autonomous agent progress:** Street Boss scratch re-analysis → Slack → approve flow (if bandwidth allows).

## Baseline to Compare Against

| Metric | Last 2 Weeks (6/14–6/28) | Target This Week |
|---|---|---|
| Races played | 97 | ~20-30 (after gates) |
| Win rate | 36% | 40%+ |
| ROI | 18.8% | 50%+ |
| Daily capital at risk | ~$2,500 | ~$1,000-$1,500 |
| Profit | +$2,455 | Maintain or grow on less capital |

## Decision Log (updated throughout the week)

| Date | Decision | Reasoning | Outcome |
|---|---|---|---|
| | | | |

## Daily Results

| Date | Races | Wins | Wagered | Collected | Net | ROI | Notes |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

## Lessons Learned (captured live)

| # | Lesson | Category |
|---|---|---|
| | | |

## End-of-Week Review Questions

1. Did the qualifying gates filter the right races? Any false-positives (qualified but shouldn't have) or false-negatives (filtered but would have won)?
2. Did the 70/30 split and dynamic box sizing improve ROI vs. old allocation?
3. Did the pool curve concept hold once we had real pool data?
4. How many races did we play vs. baseline? Did selectivity improve outcomes?
5. Any new signals or patterns emerge that should become rules?
6. What did RJ's pool hypothesis teach us?
