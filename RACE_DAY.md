# How to Run a Race Day with the Money Machine

## What you need
- DRF past performances PDF for the day's card (buy at drf.com, usually available night before)
- A track with 8+ races on the card (Saratoga, Churchill, Belmont, etc.)
- Your betting app open (or Mike on standby to submit)
- 2-3 hours before first post to get picks locked

## How to kick it off
1. Open Claude Code in the `capo/` directory
2. Say: "Race day — here's the DRF" and attach the PDF
3. The model will parse every race, build the fields, and ask you to verify
4. Once you confirm, say: "Analyze all races" — you'll get picks for every race on the card

## During the card
5. Before each race, pull live odds from your betting app and share them (the model needs these for two key signals)
6. Report any scratches — the model rebuilds affected races
7. After each race, share the result — the model tracks P/L

## What to tell Mike
- 4-horse exacta box, $5/combo ($60 total) — use ALL 4 horses, don't trim to 3
- 4-horse tri box, $1/combo ($24 total)
- Win bet as directed ($50 or $100 if doubled)

## After the last race
8. Say: "Post-mortem" — the model runs signal validation, lessons, and P/L summary
9. Say: "Push to GitHub" — backs everything up

That's it. Attach the PDF, confirm the fields, feed live odds, report results. The model does the rest.
