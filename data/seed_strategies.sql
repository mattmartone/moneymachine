-- Strategies: every signal, BOLO, offensive strategy, and rule as a self-contained unit

-- SIGNALS (scored against each horse)

INSERT INTO strategies (name, type, weight, weight_conditions, description, prompt, active, created_date) VALUES (
    'S1 — Elite Jockey on Bomb',
    'signal',
    3,
    NULL,
    'Top-3 meet riders dont waste mounts. If they choose a 12/1+ shot over shorter-priced options, someone knows something. These jockeys have agent relationships with trainers and get on live horses before the public knows.',
    'Check the jockey name on any horse with ML odds of 12/1 or higher. Is this jockey one of the top-3 riders at the current meet by win percentage or standings? If yes, and they chose this mount over shorter-priced options available on todays card, score +3. Read from: jockey name, ML odds, jockey standings (known from meet context).',
    1,
    '2026-05-24'
);

INSERT INTO strategies (name, type, weight, weight_conditions, description, prompt, active, created_date) VALUES (
    'S2 — Late Tote Action',
    'signal',
    3,
    NULL,
    'When a horse drops 3+ points from morning line by post time, or an AE takes heavy late money, sharp money is flowing. Trainers, owners, syndicates, or pros have information — great workout, equipment change working, jockey feedback. The public doesnt know yet.',
    'Requires live odds from Matt. Compare current tote odds to the morning line. If a horse has dropped 3+ points from ML (e.g. 12/1 ML now showing 8/1 or less), score +3. If no live odds are available yet, skip this signal entirely — do not guess. Read from: ML odds (DRF) vs live tote odds (provided by Matt).',
    1,
    '2026-05-24'
);

INSERT INTO strategies (name, type, weight, weight_conditions, description, prompt, active, created_date) VALUES (
    'S3 — Odds Drift on Quality',
    'signal',
    2,
    NULL,
    'A horse that was favorite or co-favorite on morning line but has drifted to 4/1+ because money went elsewhere hasnt lost their form. Theyve gained value. The public is chasing something shiny; the quality horse is now a gift at a price.',
    'Requires live odds from Matt. Check if any horse was 3/1 or shorter on the morning line but is now showing 5/1+ on the live tote. If yes, their form didnt change — just the money flow. Score +2. If no live odds available, skip. Read from: ML odds (DRF) vs live tote odds (provided by Matt).',
    1,
    '2026-05-24'
);

INSERT INTO strategies (name, type, weight, weight_conditions, description, prompt, active, created_date) VALUES (
    'S4 — Hot Barn at a Price',
    'signal',
    2,
    NULL,
    'Trainers winning at 15%+ at the current meet are cashing regardless of public perception. When they run a horse at 6/1 or higher, the barn is live. These trainers know when their horses are ready.',
    'Check the trainer name for each horse. Is this trainer winning more than 15% at the current meet/track AND is the horse 6/1 or higher on the ML? If both conditions are true, score +2. Read from: trainer name, ML odds, trainer statistics (often printed on DRF page or known from meet context).',
    1,
    '2026-05-24'
);

INSERT INTO strategies (name, type, weight, weight_conditions, description, prompt, active, created_date) VALUES (
    'S5 — Distance Stretch-out',
    'signal',
    2,
    NULL,
    'A horse getting their sires optimal distance for the first time is live at a price. Pedigree tells you what distance the horse was bred to run. First time at that distance = untapped potential the public cant see in the form.',
    'Check if todays race distance is longer than any distance in the horses past performances. Then check the sire line — does this sire produce winners at todays distance? If the horse is stretching out to a distance that matches the sires sweet spot, score +2. Read from: todays distance (race header) vs distance column in PPs, sire name (top of horses section).',
    1,
    '2026-05-24'
);

INSERT INTO strategies (name, type, weight, weight_conditions, description, prompt, active, created_date) VALUES (
    'S6 — Best Last-Race Beyer',
    'signal',
    1,
    NULL,
    'The horse with the highest speed figure in their most recent race has proven they can run fast. Speed figures normalize across tracks and distances — the best number is the best number.',
    'Compare the last-race Beyer speed figure for every live horse in the field. The horse with the highest figure scores +1. Read from: Beyer speed figure column, most recent race line for each horse.',
    1,
    '2026-05-24'
);

INSERT INTO strategies (name, type, weight, weight_conditions, description, prompt, active, created_date) VALUES (
    'S7 — Blinkers Change',
    'signal',
    1,
    NULL,
    'When a trainer adds or removes blinkers, its an intentional equipment move. Something is different today. The trainer is trying to fix a behavioral issue (adding focus) or free the horse up (removing restriction). Intent = information.',
    'Look for a blinkers notation change between todays equipment line and the most recent past performance. Blinkers on to off, or off to on = score +1. Read from: equipment line (today) vs equipment shown in most recent PP line.',
    1,
    '2026-05-24'
);

INSERT INTO strategies (name, type, weight, weight_conditions, description, prompt, active, created_date) VALUES (
    'S9 — Earnings Leader',
    'signal',
    1,
    '+2 in graded stakes (G1/G2/G3)',
    'The horse who has earned the most money in the field has proven they belong at this level. Career earnings are a proxy for consistency — you dont bank millions by accident. In graded stakes, this signal is stronger because the class floor is higher.',
    'Compare lifetime or current-year earnings across all horses in the field at this class level. The horse with the highest earnings scores +1 (or +2 if this is a graded stakes race — G1, G2, or G3). Read from: earnings line in the horses header section. Check race conditions for grade level.',
    1,
    '2026-05-24'
);

INSERT INTO strategies (name, type, weight, weight_conditions, description, prompt, active, created_date) VALUES (
    'S10 — First-Time Starter + Pedigree',
    'signal',
    1,
    NULL,
    'A debut runner whose sire wins 15%+ with first-time starters, or who cost $100K+ at auction, has connections that expect a big run. These horses are often ready to fire first time out.',
    'Check if the horse has no past performance lines (first-time starter). If so, check the sire — does this sire win more than 15% with debuters? Or was the purchase price $100K+? If either condition is true, score +1. Read from: empty PPs = debut, sire name + sale price if listed.',
    1,
    '2026-05-24'
);

-- BOLOs (contextual flags that shape analysis)

INSERT INTO strategies (name, type, weight, weight_conditions, description, prompt, active, created_date) VALUES (
    'Recent Life',
    'bolo',
    NULL,
    NULL,
    'Horses with recent, visible competitive life outperform stale form. A horse that ran within 30 days and showed fight — closing ground, wide trip, trouble excused — is fitter and sharper than one who hasnt started in 45+ days.',
    'Check last race date. If within 30 days AND the horse showed one or more of: within 2-3 lengths at any call, closed ground late, wide trip (4+ wide on turn), checked/blocked/steadied in comments, or Beyer equal to or better than prior start — tag RECENT LIFE. If over 45 days since last start regardless of quality, do NOT tag. Read from: last race date, positions at each call, beaten-lengths column, comment line, Beyer figure.',
    1,
    '2026-05-24'
);

INSERT INTO strategies (name, type, weight, weight_conditions, description, prompt, active, created_date) VALUES (
    'Troubled Trip',
    'bolo',
    NULL,
    NULL,
    'A horse that hit real trouble last out but was otherwise running well is underbet next time. The public sees the bad finish position and moves on. We see the excuse — blocked, checked, bumped, fanned wide — and know the horse is better than the result. The price overcompensates.',
    'Read the comment line of the last race. Look for: blocked, steadied, checked, bumped, boxed, shuffled back, fanned wide, wide on turn, 5-6 wide. Confirm trouble was real: horse was in contention or closing before trouble (check positions at earlier calls) and finished worse than earlier calls suggest. If todays post is outside and/or pace map suits their style better, this is a STRONGER play. Ignore trivial trouble that didnt change the outcome. Read from: trip/comment line in PPs, position at each call, todays post position, pace map.',
    1,
    '2026-05-24'
);

INSERT INTO strategies (name, type, weight, weight_conditions, description, prompt, active, created_date) VALUES (
    'Sharp Class Drop',
    'bolo',
    NULL,
    NULL,
    'A horse dropping sharply in class is a yellow flag. Trainers often drop when something is wrong. But a drop with positives (good works, hot trainer, competitive last) can be legit at lower confidence. Also flags favorite vulnerability when the fave is the one dropping.',
    'Compare todays race conditions/claiming price to the horses last 2-3 starts. A jump from ALW/OC to MCL, or a claiming price drop of 50%+ = sharp drop. Note whether the drop comes with positives (recent works, hot trainer %, competitive last) or negatives (poor last, layoff, jockey downgrade). Jockey downgrade = name change from a top rider to a lower-tier rider. Read from: todays class (race header) vs class column in PPs, jockey name comparison.',
    1,
    '2026-05-24'
);

INSERT INTO strategies (name, type, weight, weight_conditions, description, prompt, active, created_date) VALUES (
    'Layoff + No Workouts',
    'bolo',
    NULL,
    NULL,
    'A horse returning from 90+ days off with no solid workout pattern is a fitness question mark. No works = the trainer isnt confident. Exception: 90+ days but 4+ sharp/regular works means possibly fresh and ready.',
    'Calculate days since last race. If 90+ days AND no workout line (or sparse/irregular works below the PPs), mark EXCLUDED — do not score this horse. Exception: if 90+ days but the horse shows 4+ sharp works with consistent spacing (especially bullet works), they can play as fresh. Read from: last race date in PPs vs todays date, workout line below PPs.',
    1,
    '2026-05-24'
);

-- OFFENSIVE STRATEGIES (bet construction thesis)

INSERT INTO strategies (name, type, weight, weight_conditions, description, prompt, active, created_date) VALUES (
    'Beat the Vulnerable Favorite',
    'offensive',
    NULL,
    NULL,
    'Our core thesis. Find races where the favorite is likely to get into trouble, then back the horse whose running style benefits from that same trouble. Chaos races (large fields, traffic-prone) are our hunting ground. When the fave is vulnerable, we double the win stake and key against them in exotics.',
    'After tagging running styles and mapping pace (steps 6-8), assess the favorite. Signs of vulnerability: closer/presser drawn inside (post 1-3) in a large field (boxed behind wall), speed fave facing pace duel (2+ E horses = cooked early), closer fave in a lone-speed race (no pace to run into), or fave needing a wide/clean trip in a big field. Then identify which horse BENEFITS from the same scenario: fave is speed in a duel = back the best closer; fave is boxed closer = back outside stalker or lone speed; fave is closer with no pace = back the front-runner (wire job). The beneficiary is the win pick.',
    1,
    '2026-05-24'
);

INSERT INTO strategies (name, type, weight, weight_conditions, description, prompt, active, created_date) VALUES (
    'Pace Makes the Race',
    'offensive',
    NULL,
    NULL,
    'Map the early speed first. Everything else — vulnerability reads, exacta construction, win pick selection — flows from the pace map. Multiple E types = pace duel = closers live. Lone E = possible wire job. The favorites running style relative to the pace is the main tell.',
    'Count all horses tagged E (front-runners) in step 6. Determine: 0 E horses = no speed, closers disadvantaged; 1 E horse = lone speed, possible wire job; 2+ E horses = pace duel, closers and stalkers live. Cross-reference the favorites running style against this map. This is the foundation for all subsequent analysis. Read from: running style tags assigned in step 6.',
    1,
    '2026-05-24'
);

INSERT INTO strategies (name, type, weight, weight_conditions, description, prompt, active, created_date) VALUES (
    'Key Against the Favorite',
    'offensive',
    NULL,
    NULL,
    'Keep the favorite IN exacta and tri boxes — never bet them to WIN. When the fave is vulnerable, we profit when they finish 2nd or 3rd underneath our win pick. Excluding them entirely costs exotic payouts (proven: Belmont Day R4, R9, R11). Vulnerability triggers still drive win stake doubling.',
    'When building the exacta box (step 17), ALWAYS include the favorite. Do not exclude them for any reason — traffic, pace, class drop, or otherwise. The favorite goes in the box because they hit the board even when they dont win. When Trigger A (traffic: fave inside + not front-runner) or Trigger B (pace: speed fave in duel, or closer fave with no pace) fires, DOUBLE the win stake to $100. But the fave stays in all exotic combos. Read from: fave post position, running style, pace map.',
    1,
    '2026-06-06'
);

-- RULES (gates — decide if we bet the race)

INSERT INTO strategies (name, type, weight, weight_conditions, description, prompt, active, created_date) VALUES (
    'No Short Fields',
    'rule',
    NULL,
    NULL,
    'Never bet a race with 5 or fewer horses. The favorite is obvious, payouts are tiny, and theres no value. Skip entirely.',
    'Count entries in the race. If 5 or fewer horses, SKIP RACE. Do not analyze further. Read from: race header (field size) or count individual horse entries on the page.',
    1,
    '2026-05-24'
);

INSERT INTO strategies (name, type, weight, weight_conditions, description, prompt, active, created_date) VALUES (
    'Never Bet the Favorite to Win',
    'rule',
    NULL,
    NULL,
    'The win bet must always be a non-favorite at 7/2 or higher. Favorites are for keying against in exotics, not for win bets. If our highest-scored horse IS the fave, we go to the next-highest at 7/2+.',
    'Identify the favorite (lowest ML odds). This horse is NEVER the win bet pick. The win pick must be 7/2 or higher on the ML. If the highest-scored horse is the favorite, skip to the next-highest scored horse that meets the 7/2+ threshold. Read from: ML odds, score rankings.',
    1,
    '2026-05-24'
);

INSERT INTO strategies (name, type, weight, weight_conditions, description, prompt, active, created_date) VALUES (
    'No Maiden Races',
    'rule',
    NULL,
    NULL,
    'Never bet maiden claiming (MCL) or maiden special weight (MSW). These horses have never won — form is unreliable, running styles are unestablished, and outcomes are too random to model.',
    'Check the race conditions line in the header. If it contains Maiden Claiming (MCL) or Maiden Special Weight (MSW), SKIP RACE. Do not analyze further. Read from: race conditions/class line at the top of the race.',
    1,
    '2026-05-24'
);

INSERT INTO strategies (name, type, weight, weight_conditions, description, prompt, active, created_date) VALUES (
    'Sit Out Inside Lone Speed Fave',
    'rule',
    NULL,
    NULL,
    'When the favorite is drawn post 1-3, has E running style, and is the only speed in the race, uncontested inside speed wires too often. We cant beat it and we dont bet faves. Exception: other E horses present means pace duel, which cooks the fave — then we bet against.',
    'Is the favorite (lowest ML odds) drawn post 1-3 AND tagged E (front-runner) AND the only E in the field? If all three are true, SKIP RACE. Exception: if other E horses are present, there will be a pace duel — proceed with analysis (the fave gets cooked). Read from: ML odds, post position, running style tags.',
    1,
    '2026-05-24'
);

-- RETIRED

INSERT INTO strategies (name, type, weight, weight_conditions, description, prompt, active, created_date, retired_date, notes) VALUES (
    'Trigger A — Exclude Fave (Traffic)',
    'offensive',
    NULL,
    NULL,
    'RETIRED. Previously excluded the favorite from exacta boxes when drawn inside and running from behind. Proven unreliable: faves hit the board even when vulnerable. Replaced by Key Against the Favorite.',
    'DO NOT USE. This strategy has been retired as of 6/6/2026. The favorite should NEVER be excluded from exotic boxes. See Key Against the Favorite for the replacement logic.',
    0,
    '2026-05-24',
    '2026-06-06',
    'Cost money in R4, R9, R11 on Belmont Day. Faves finish 2nd/3rd even when vulnerable. Exclusion at any distance is unreliable.'
);
