# June 28, 2026 — Postmortem & ROI Optimization Study

## Day Summary

- **Result:** -$725.47 | 2/12 wins (17%) | 4/12 exactas (33%)
- **Wagered:** $2,530 | **Collected:** $1,804.53
- **ROI:** -28.7%
- **Hits:** BAQ R8 HIGHWAY HARMONY (+$251), BAQ R9 ASSUME NOTHING (+$813)
- **Missed opportunity:** LRL R2 GALLO skipped on vague scratch — would have been +$1,100

## Pattern: Closer-dominated day

5 of 12 races won by closers/pressers. The FTC model targets pace vulnerability — when closers dominate, we lose. Churchill was 0-for-5 on a day where the pace didn't burn anyone.

## ROI Optimization Backtest (97 races, 6/14–6/28)

### By Race Type
| Race Type | Races | Win Rate | ROI |
|---|---|---|---|
| Allowance | 10 | 30% | +69.1% |
| Maiden Claiming | 5 | 60% | +47.2% |
| Allowance/OC | 24 | 54% | +41.9% |
| Claiming | 46 | 28% | +9.5% |
| Listed/Ungraded Stakes | 4 | 25% | -22.1% |
| Graded Stakes | 2 | 0% | -100% |

### By Purse Tier
| Tier | Races | Win Rate | ROI |
|---|---|---|---|
| $100K+ | 16 | 31% | +53.3% |
| $25K-$99K | 50 | 42% | +42.5% |
| Under $25K | 31 | 29% | -42.9% |

### By Surface
| Surface | Races | Win Rate | ROI |
|---|---|---|---|
| Dirt | 63 | 38% | +34.5% |
| Turf | 28 | 29% | -22.6% |

### Cross-Tab Winners
| Combo | Races | Win Rate | ROI |
|---|---|---|---|
| Allowance + $100K+ | 3 | 67% | +302% |
| Claiming + $25K-$99K | 24 | 42% | +75.3% |
| Allowance/OC + $25K-$99K | 14 | 57% | +45.4% |

### Cross-Tab Money Pits
| Combo | Races | Win Rate | ROI |
|---|---|---|---|
| Claiming + Under $25K | 22 | 14% | -55.5% |
| Allowance + $25K-$99K | 7 | 14% | -59.6% |

### Filter Combinations
| Filter | Races | Net | ROI |
|---|---|---|---|
| Baseline (all) | 97 | +$2,455 | 18.8% |
| ML 6-12 only | 36 | +$2,140 | 44.3% |
| 3+ E-types | 80 | +$2,446 | 22.2% |
| **ML 6-12 + 3+ E-types** | **28** | **+$2,505** | **65.1%** |
| ML 5-15 + 3+ E-types | 34 | +$2,302 | 49.4% |

## RJ's Pool-Based Wagering Hypothesis

Allocate budget in proportion to pool sizes rather than flat across races. Racing API confirms pool totals are available post-race. Pre-race availability TBD.

## Conclusions

1. **Kill cheap claimers** (under $25K) — -56% ROI, 14% win rate
2. **Dirt over turf** — +34.5% vs -22.6%
3. **Allowance/AOC is the sweet spot** — 47% combined win rate, predictable fields
4. **ML 6-1 to 12-1 + 3+ E-types** eliminates 71% of races, preserves 100% of profit
5. **Stakes races need more data** but trend negative (pools too efficient)

## Recommended Qualifying Gate (pending approval)

- Win pick ML: 6-1 to 12-1
- E-type count: 3+
- Purse: $25K+
- Surface: Dirt (turf only if exceptional)
- Race type: Allowance, Allowance/OC, or Claiming $25K+

## Operational Changes Made This Day

- 70/30 win-to-exacta split adopted ($154W/$66Ex doubled)
- Dynamic box sizing by win pick odds
- Verdict column added to scratch_alerts
- Post-time guard deployed to prevent stale result ingestion
- wagering_rules table created in DB
- box_horse_scratched rule updated to BET STANDS
