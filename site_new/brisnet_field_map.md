# Brisnet DRF Field Map

Source: SAX0613.DRF (Santa Anita June 13, 2026)
Reference horse: Line 0 = GIGGLE GIGGLE (Race 1, Post 1)

## Race-Level Fields

| # | Data Item | Field Index | Sample Value | Status |
|---|-----------|-------------|--------------|--------|
| 1 | Track code | 0 | SA | ✅ confirmed |
| 2 | Date (YYYYMMDD) | 1 | 20260613 | ✅ confirmed |
| 3 | Race number | 2 | 1 | ✅ confirmed |
| 4 | Post position | 3 | 1 | ✅ confirmed |
| 5 | Distance (yards) | 5 | 1760 | ✅ confirmed |
| 6 | Surface code (T/D) | 6 | T | ✅ confirmed |
| 7 | Conditions text | 10 | Clm 30000n3l | ✅ confirmed |
| 8 | Purse | 11 | 27000 | ✅ confirmed |
| 9 | Claiming price (low) | 12 | 30000 | ✅ confirmed |
| 10 | Claiming price (high) | 13 | 30000 | ✅ confirmed |
| 11 | Full conditions (long text) | 14 | "TCENTRIES 1ST SAX..." | ✅ confirmed |
| 12 | Field (entrants list) | 15 | "GIGGLE GIGGLE;MY PERFECT..." | ✅ confirmed |
| 13 | Track code (repeat) | 20 | SA | ✅ confirmed |
| 14 | Race number (repeat) | 21 | 1 | ✅ confirmed |
| 15 | Breed | 22 | TB | ✅ confirmed |
| 16 | Field size | 23 | 9 | ✅ confirmed |

## Horse-Level Fields (Today)

| # | Data Item | Field Index | Sample Value | Status |
|---|-----------|-------------|--------------|--------|
| 17 | Trainer name | 27 | BAKER D WAYNE | ✅ confirmed |
| 18 | Trainer starts (meet) | 28 | 47 | ✅ confirmed |
| 19 | Trainer wins (meet) | 29 | 4 | ✅ confirmed |
| 20 | Trainer places | 30 | 2 | ✅ confirmed |
| 21 | Trainer shows | 31 | 4 | ✅ confirmed |
| 22 | Jockey name | 32 | GARCIA EPIFANIO | ✅ confirmed |
| 23 | Jockey starts (meet) | 33 | 32 | ✅ confirmed (via line context) |
| 24 | Jockey wins | 34 | 2 | ✅ confirmed |
| 25 | Jockey places | 35 | 0 | ✅ confirmed |
| 26 | Jockey shows | 36 | 3 | ✅ confirmed |
| 27 | Owner | 37 | SPERGERWAY STABLES LLC | ✅ confirmed |
| 28 | Silks description | 38 | "Blue; gold 'SW'..." | ✅ confirmed |
| 29 | Horse name | 44 | GIGGLE GIGGLE | ✅ confirmed |
| 30 | Age | 45 | 22 (months? encoded) | ⚠️ needs interpretation |
| 31 | Sex | 48 | F | ✅ confirmed |
| 32 | Color | 49 | CH | ✅ confirmed |
| 33 | Weight | 50 | 126 | ✅ confirmed |
| 34 | Sire | 51 | PRACTICAL JOKE | ✅ confirmed |
| 35 | Sire's sire | 52 | INTO MISCHIEF | ✅ confirmed |
| 36 | Dam | 53 | GRACE IS GONE | ✅ confirmed |
| 37 | Dam's sire | 54 | MALIBU MOON | ✅ confirmed |
| 38 | Breeder | 55 | Marcus Stables LLC | ✅ confirmed |
| 39 | State/Country bred | 56 | KY | ✅ confirmed |
| 40 | Running style | 209 | E/P | ✅ confirmed |
| 41 | Morning line odds | 249 | 3 | ✅ confirmed |
| 42 | Prime Power rating | 250 | 108.80 | ✅ confirmed |

## Record / Earnings

| # | Data Item | Field Index | Sample Value | Status |
|---|-----------|-------------|--------------|--------|
| 43 | Turf starts | 61 | 1 (?) | ⚠️ field range 57-100 needs careful mapping |
| 44 | Turf wins | 62 | 1 | ⚠️ |
| 45 | All-weather starts | — | — | 🔍 not yet mapped |
| 46 | Lifetime starts | ~67-68 | 2, 46020 | ⚠️ block needs precise decode |
| 47 | Current year record | ~78-82 | — | ⚠️ |
| 48 | Last year record | ~84-88 | — | ⚠️ |
| 49 | Lifetime earnings | ~68 | 46020 | ⚠️ offset unclear |

## Speed Figures

| # | Data Item | Field Index | Sample Value | Status |
|---|-----------|-------------|--------------|--------|
| 50 | Last 5 Beyer (today assessment) | 213-217 | 85, 83, 82, 82, 81 | ✅ confirmed |
| 51 | PP Beyer figures (10 races) | 765-774 | 86, 75, 87, 71, 80, 73, 83, 75, 83, 85 | ✅ confirmed |
| 52 | PP variant-adjusted Beyer | 775-784 | 94, 81, 80, 76, 91, 73, 86, 75, 78, 82 | ✅ confirmed |

## Past Performances (10 races)

| # | Data Item | Field Index Range | Sample (race 1) | Status |
|---|-----------|-------------------|-----------------|--------|
| 53 | PP dates | 101-110 | 20260531 | ✅ confirmed |
| 54 | PP final time (seconds) | 113-122 | 47.60 | ✅ confirmed |
| 55 | PP track | 125-134 | SA | ✅ confirmed |
| 56 | PP distance (yards) | 137-146 | 880 | ✅ confirmed |
| 57 | PP surface condition | 149-158 | ft | ✅ confirmed |
| 58 | PP track type | 161-170 | H | ✅ confirmed |
| 59 | PP inner/outer | 173-182 | MT | ✅ confirmed |
| 60 | PP trip comments | 395-404 | "Ins;bid3-2wd;flattened" | ✅ confirmed |
| 61 | PP winner name | 405-414 | CROSSANNA | ✅ confirmed |
| 62 | PP 2nd place | 415-424 | SAKURA FLAVOR | ✅ confirmed |
| 63 | PP 3rd place | 425-434 | GIGGLE GIGGLE | ✅ confirmed |
| 64 | PP weight carried | 435-444 | 126 | ✅ confirmed |
| 65 | PP 2nd weight | 445-454 | 126 | ✅ confirmed |
| 66 | PP 3rd weight | 455-464 | 126 | ✅ confirmed |
| 67 | PP beaten lengths (fin) | 465-474 | 0.06 | ✅ confirmed |
| 68 | PP 2nd beaten lengths | 475-484 | 4.75 | ✅ confirmed |
| 69 | PP 3rd beaten lengths | 485-494 | 0.75 | ✅ confirmed |
| 70 | PP odds | 515-524 | 20.50 | ✅ confirmed |
| 71 | PP class text | 535-544 | fClm30000n3l | ✅ confirmed |
| 72 | PP claiming price | 545-554 | 30000 | ✅ confirmed |
| 73 | PP purse | 555-564 | 27000 | ✅ confirmed |
| 74 | PP post position drawn | 565-574 | 3 | ✅ confirmed |
| 75 | PP 1st call position | 575-584 | 2 | ✅ confirmed |
| 76 | PP 2nd call position | 585-594 | 2 | ✅ confirmed |
| 77 | PP far turn position | 595-604 | 6 | ✅ confirmed |
| 78 | PP stretch position | 605-614 | 2 | ✅ confirmed |
| 79 | PP finish position | 615-624 | 3 | ✅ confirmed |

## Odds / Margins in PPs

| # | Data Item | Field Index Range | Sample | Status |
|---|-----------|-------------------|--------|--------|
| 80 | PP lead margin 1st call | 635-644 | — | 🔍 not yet mapped |
| 81 | PP lengths behind at stretch | — | — | 🔍 not yet mapped |
| 82 | PP lengths behind at finish | — | — | 🔍 not yet mapped |

## Fractional Times (PP races)

| # | Data Item | Field Index Range | Sample | Status |
|---|-----------|-------------------|--------|--------|
| 83 | PP quarter time | 875-884 | 22.77 | ✅ confirmed |
| 84 | PP half time | 885-894 | — | 🔍 needs verify |
| 85 | PP 3/4 time | — | — | 🔍 not yet mapped |
| 86 | PP final time | — | — | 🔍 not yet mapped |

## Workouts

| # | Data Item | Field Index Range | Sample | Status |
|---|-----------|-------------------|--------|--------|
| 87 | Workout dates (10) | 255-264 | 20260501 | ✅ confirmed |
| 88 | Workout days back | 265-274 | 33 | ✅ confirmed |
| 89 | Workout track | 275-284 | SA | 🔍 partially confirmed |
| 90 | Workout distance | — | — | 🔍 not yet mapped |
| 91 | Workout time | — | — | 🔍 not yet mapped |
| 92 | Workout rank | — | — | 🔍 not yet mapped |

## Trainer/Jockey Stats (Extended)

| # | Data Item | Field Index Range | Sample | Status |
|---|-----------|-------------------|--------|--------|
| 93 | PP trainer per race | ~843-852 | — | 🔍 not yet mapped |
| 94 | PP jockey per race | ~853-862 | — | 🔍 not yet mapped |

## Not Yet Mapped

| # | Data Item | Status |
|---|-----------|--------|
| 95 | Equipment (blinkers) | 🔍 |
| 96 | Medication | 🔍 |
| 97 | Claim history | 🔍 |
| 98 | Lengths behind at each call (not just finish) | 🔍 |
| 99 | Turf/Dirt/Distance record breakdown | 🔍 |
| 100 | Trainer stats by category (turf, claiming, etc.) | 🔍 |

---

## Notes
- Each line = 1 horse, 1435 fields
- 12 fields per "slot" for most PP arrays (12 past races available, typically use 10)
- Running style at 209 is a derived field (E, E/P, P, S)
- ML odds at 249 is a whole number (multiply by nothing, it IS the odds to 1)
- Beyer at 213-217 appears to be a "par speed" for today's race, not the horse's last Beyers
- Actual PP Beyers at 765-774
