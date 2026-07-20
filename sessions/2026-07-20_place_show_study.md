# Should We Bet Our Win Picks to Place or Show? — A Quick Study

_Date: 2026-07-20 · Sample: 84 settled win bets, 2026-06-14 → 2026-07-19_

_This question was brought to the table, and the subsequent analysis undertaken, based on the
recommendation and insight of R.J. Grazel._

**Context:** Fade the Chalk deliberately fades vulnerable favorites, so our "win pick" is
always a value horse (usually 6/1+), never the chalk. The exacta box is the core product;
the win bet is a small add-on.

## 1. Objective

Determine, from our own settled results, whether adding a place and/or show bet on our
existing win pick would have made money — and whether it's worth adopting.

## 2. Analysis of What Happened

Sample: 84 settled win bets over ~5 weeks. Payoffs are actual track-settled prices from
The Racing API, per $2 base. Counterfactual collections = (payoff ÷ 2) × the same stake we
bet to win.

**Where our win picks actually finished:**

| Finish | Count | Rate |
|---|---|---|
| 1st (won) | 19 | 23% |
| 2nd (placed) | 13 | 15% |
| 3rd (showed) | 16 | 19% |
| Off the board | 36 | 43% |
| In the money (top 3) | 48 | 57% |

Key fact: our picks hit the top 3 **57%** of the time but win only **23%**. When they run
2nd or 3rd, the win bet pays nothing.

**What each bet type would have returned, applied to all 84 picks (stake-matched; total staked $5,275):**

| Bet | Wagered | Collected | Net | ROI |
|---|---|---|---|---|
| Win (current) | $5,275 | $8,991 | +$3,716 | +70% |
| Place (add) | $5,275 | $7,531 | +$2,256 | +43% |
| Show (add) | $5,275 | $6,308* | +$1,033* | +20%* |

_*Show is conservative — see note._

**Money left on the table:** in the **29 races where our pick ran 2nd or 3rd**, the win bet
collected $0. Had we also bet those picks:
- To place: **+$1,456** net (the 13 that placed).
- To show: **+$1,899** net (all 29).

_Data-quality note: 5 of the 48 in-the-money payoffs couldn't be pulled from the API
(Woodbine isn't covered; four Monmouth/Prairie Meadows races on 7/18 had a post-position
mismatch) and are counted as $0. This understates place slightly and show meaningfully —
real returns would be a bit higher._

## 3. Some More Questions

- Does the edge survive real-world tote impact? Place/show pools are small; our $50–$125
  stakes on minor tracks may lower the very price we bet into.
- Is place stronger on our high-conviction (doubled) plays than across the board?
- Should a place bet supplement the win bet, or partly replace it?
- Does the pattern hold on a larger sample and going forward, not just this window?
- Are there tracks/pool sizes where we should NOT add place/show?

## 4. Hypothesis

Because we fade the favorite, our win picks are value horses that finish in the money far
more often (57%) than they win (23%). A place or show bet on the same horse should therefore
capture profit we currently forfeit when they run 2nd or 3rd.

## 5. Conclusion

The data supports the hypothesis. All three bet types were independently profitable on this
sample — evidence of a real edge in picking horses that finish in the money, not just win.
Win has the best ROI (+70%) but fires only 23% of the time (high variance). Place is the best
addition: +43% ROI, cashes 38% of the time, and directly monetizes our frequent 2nd-place
finishes while still paying on wins. Show cashes most often (57%) but small payouts hold it
to ~+20%.

## 6. Decision / Recommendation

Add a **place bet** on the win pick, alongside (not instead of) the current win bet. Start
with a **2–4 week trial**, tracking place returns live to confirm the edge holds after real
tote impact, before making it permanent. Revisit show and doubled-play sizing once the place
trial has data.

---

### Appendix — the 29 races where our win pick ran 2nd/3rd (payoffs per $2)

| Date | Track / Race | Pick PP | Finish | Place $ | Show $ | Win stake |
|---|---|---|---|---|---|---|
| 2026-06-18 | Churchill Downs R3 | 4 | SHOWED | — | 2.54 | $50 |
| 2026-06-18 | Horseshoe Indianapolis R5 | 6 | SHOWED | — | 2.10 | $50 |
| 2026-06-18 | Woodbine R6 | 4 | PLACED | 3.20 | 2.50 | $50 |
| 2026-06-19 | Gulfstream Park R8 | 4 | PLACED | 4.20 | 3.20 | $50 |
| 2026-06-19 | Prairie Meadows R8 | 8 | SHOWED | — | 10.80 | $100 |
| 2026-06-20 | Laurel Park R7 | 8 | SHOWED | — | 3.20 | $50 |
| 2026-06-20 | Prairie Meadows R4 | 4 | PLACED | 4.00 | 2.60 | $25 |
| 2026-06-21 | Churchill Downs R10 | 6 | PLACED | 2.34 | 2.10 | $50 |
| 2026-06-21 | Emerald Downs R2 | 2 | SHOWED | — | 3.42 | $50 |
| 2026-06-21 | Emerald Downs R7 | 6 | PLACED | 6.84 | 3.84 | $50 |
| 2026-06-21 | Prairie Meadows R11 | 2 | SHOWED | — | 3.80 | $50 |
| 2026-06-28 | Churchill Downs R6 | 8 | PLACED | 9.58 | 7.32 | $50 |
| 2026-06-28 | Gulfstream Park R1 | 2 | SHOWED | — | 7.60 | $50 |
| 2026-06-28 | Prairie Meadows R6 | 3 | PLACED | 26.20 | 16.20 | $50 |
| 2026-07-04 | Saratoga R4 | 5 | SHOWED | — | 3.32 | $50 |
| 2026-07-10 | Delaware Park R7 | 6 | SHOWED | — | 6.20 | $50 |
| 2026-07-10 | Horseshoe Indianapolis R6 | 3 | PLACED | 7.60 | 4.80 | $50 |
| 2026-07-10 | Prairie Meadows R6 | 6 | SHOWED | — | (n/a) | $50 |
| 2026-07-11 | Delaware Park R4 | 3 | PLACED | 4.80 | 2.40 | $125 |
| 2026-07-12 | Gulfstream Park R9 | 5 | SHOWED | — | 3.00 | $125 |
| 2026-07-18 | Delaware Park R2 | 3 | PLACED | 8.00 | 3.80 | $50 |
| 2026-07-18 | Gulfstream Park R4 | 1 | PLACED | 4.80 | 3.00 | $50 |
| 2026-07-18 | Monmouth Park R4 | 6 | SHOWED | — | (n/a) | $100 |
| 2026-07-18 | Monmouth Park R6 | 3 | SHOWED | — | (n/a) | $50 |
| 2026-07-18 | Monmouth Park R10 | 7 | PLACED | 4.40 | 3.20 | $50 |
| 2026-07-18 | Prairie Meadows R6 | 3 | SHOWED | — | (n/a) | $50 |
| 2026-07-18 | Prairie Meadows R10 | 4 | SHOWED | — | (n/a) | $50 |
| 2026-07-19 | Monmouth Park R2 | 2 | SHOWED | — | 7.60 | $50 |
| 2026-07-19 | Saratoga R4 | 1 | PLACED | 18.04 | 9.40 | $100 |
