# Fade the Chalk — Economic Model

## Token Economics

### Exchange Rate
- **3 FTC tokens = 1 Claude API token**
- Direct, transparent multiplier. Covers compute + data + margin.

### Subscription Plan
- **$10/month = 1,000,000 FTC tokens**
- Resets monthly. Use them or lose them.

### Cost Per Full Card Analysis
- **~100,000 Claude API tokens** to parse a DRF PDF + run all strategies (~10 races, ~10 horses)
- **= 300,000 FTC tokens** charged to user (3:1 markup)
- A subscriber gets **~3 full card analyses per month** on the base plan

### Per-Strategy Pricing
- **15,000 FTC tokens per strategy selected**
- Full card with all 20 strategies = ~300,000 FTC tokens
- Users who select fewer strategies pay less → can stretch to more analyses

### Our Cost Breakdown (per full analysis)
| Component | Claude Tokens | USD (Sonnet) |
|-----------|--------------|--------------|
| Input (PDF parse) | ~80,000 | ~$0.24 |
| Output (analysis) | ~30,000 | ~$0.45 |
| **Total** | **~110,000** | **~$0.69** |

*Rounded to 100K for simplicity. To be validated with real usage.*

### Margin Per Order
| Metric | Value |
|--------|-------|
| Revenue (300K FTC tokens) | $3.00 |
| Cost (100K Claude tokens) | ~$0.80 |
| **Gross margin** | **$2.20 (~73%)** |

### Monthly Unit Economics (per subscriber)
| Metric | Value |
|--------|-------|
| Monthly revenue | $10.00 |
| If they use all tokens (3.3 analyses) | -$2.64 cost |
| **Monthly margin** | **~$7.36 (74%)** |

*Note: most users won't exhaust their full allotment monthly.*

## Revenue Streams

1. **Subscriptions** — $10/month for 1M tokens
2. **Handicapper revenue share** — when a user selects a contributed strategy, contributor earns a cut of the token spend on that strategy
3. **Overage tokens** — users can buy more tokens beyond their monthly allotment (pricing TBD)

## Key Decisions (dated)

- **2026-06-07:** 3:1 FTC-to-Claude token ratio established
- **2026-06-07:** $10/mo = 1M tokens = ~3 full analyses
- **2026-06-07:** 15K FTC tokens per strategy per analysis
- **2026-06-07:** 100K Claude tokens = cost estimate per full card (to be validated)
- **2026-06-07:** Token cost at checkout is an estimate; admin reconciles nightly/weekly
- **2026-06-07:** Run on Sonnet for margin; Opus only for edge cases

## Open Questions

- Handicapper revenue share %: what cut does a contributor get per token spent on their strategy?
- Overage token pricing: what's the per-token rate beyond monthly allotment?
- Free tier: how many tokens do free accounts get? (Currently 1M same as paid — probably should be less)
- Report download token cost: should downloading published reports also cost tokens, or are those included?
