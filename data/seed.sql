-- Seed data: Churchill Downs 5/24 + Belmont Day 6/6

-- Race Days
INSERT INTO race_days (date, track, races_analyzed, races_skipped, total_wagered, total_collected, net_pl, roi_pct)
VALUES ('2026-05-24', 'Churchill Downs', 6, 0, 554, 611.40, 57.40, 10.4);

INSERT INTO race_days (date, track, races_analyzed, races_skipped, total_wagered, total_collected, net_pl, roi_pct)
VALUES ('2026-06-06', 'Saratoga', 12, 1, 1564, 2434, 870, 56.0);

-- Belmont Day Races (race_day_id = 2)
INSERT INTO races (race_day_id, race_number, conditions, class, distance, surface, field_size, skipped, skip_reason)
VALUES (2, 1, 'MSW $115K', 'MSW', '7f', 'Dirt', 7, 1, 'No maiden races');

INSERT INTO races (race_day_id, race_number, conditions, class, distance, surface, purse, field_size, result_1st, result_2nd, result_3rd)
VALUES (2, 2, 'OC 80k/C', 'OC', '7f', 'Dirt', 125000, 9, 9, 7, 3);

INSERT INTO races (race_day_id, race_number, conditions, class, distance, surface, purse, field_size, result_1st, result_2nd, result_3rd)
VALUES (2, 3, 'OC 80k/C', 'OC', '1 1/4mi', 'Turf', 125000, 8, 5, 1, 3);

INSERT INTO races (race_day_id, race_number, conditions, class, distance, surface, purse, field_size, result_1st, result_2nd, result_3rd, fave_number, fave_vulnerable, fave_vulnerability_reason)
VALUES (2, 4, 'OC 55k/N1X', 'OC', '6.5f', 'Dirt', 120000, 8, 2, 4, 7, 2, 1, 'Trigger A: inside stalker');

INSERT INTO races (race_day_id, race_number, conditions, class, distance, surface, purse, field_size, result_1st, result_2nd, result_3rd, fave_vulnerable, fave_vulnerability_reason)
VALUES (2, 5, 'Alw 120000N1X', 'ALW', '1 1/16mi', 'Turf', 120000, 10, 9, 2, 0, 1, 'Beat Vulnerable Fave');

INSERT INTO races (race_day_id, race_number, conditions, class, distance, surface, purse, field_size, fave_vulnerable)
VALUES (2, 6, 'Alw 120000N1X', 'ALW', '6.5f', 'Dirt', 120000, 14, 1);

INSERT INTO races (race_day_id, race_number, conditions, class, distance, surface, purse, field_size)
VALUES (2, 7, 'Just A Game G1', 'G1', '1mi', 'Turf', 500000, 7);

INSERT INTO races (race_day_id, race_number, conditions, class, distance, surface, purse, field_size, result_1st, result_2nd, result_3rd)
VALUES (2, 8, 'ALW', 'ALW', '7f', 'Dirt', 120000, 8, 6, 3, 0);

INSERT INTO races (race_day_id, race_number, conditions, class, distance, surface, purse, field_size, result_1st, result_2nd, result_3rd, fave_vulnerable, fave_vulnerability_reason)
VALUES (2, 9, 'ALW', 'ALW', '6.5f', 'Dirt', 120000, 10, 5, 0, 0, 1, 'Beat Vulnerable Fave');

INSERT INTO races (race_day_id, race_number, conditions, class, distance, surface, purse, field_size, result_1st, result_2nd, result_3rd)
VALUES (2, 10, 'ALW', 'ALW', '1mi', 'Turf', 120000, 8, 7, 6, 2);

INSERT INTO races (race_day_id, race_number, conditions, class, distance, surface, purse, field_size)
VALUES (2, 11, 'ALW', 'ALW', '1mi', 'Dirt', 120000, 8);

INSERT INTO races (race_day_id, race_number, conditions, class, distance, surface, purse, field_size)
VALUES (2, 12, 'ALW', 'ALW', '1 1/8mi', 'Turf', 120000, 10);

INSERT INTO races (race_day_id, race_number, conditions, class, distance, surface, purse, field_size, result_1st, result_2nd, result_3rd)
VALUES (2, 13, 'Belmont Stakes G1', 'G1', '1 1/4mi', 'Dirt', 2000000, 10, 9, 7, 4);

-- Belmont Day Bets — Model
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (2, 'model', 'win', '8', 50, 'miss', 0, -50);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (2, 'model', 'exacta', '8/7/9/3', 60, 'hit', 158.25, 98.25);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (2, 'model', 'trifecta', '8/7/9/3/4', 60, 'hit', 100.26, 40.26);

INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (3, 'model', 'win', '7', 50, 'miss', 0, -50);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (3, 'model', 'exacta', '8/7/9', 30, 'miss', 0, -30);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (3, 'model', 'trifecta', '8/7/9/5', 24, 'miss', 0, -24);

INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (4, 'model', 'win', '8', 50, 'miss', 0, -50);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (4, 'model', 'exacta', '8/7/4/6', 60, 'miss', 0, -60);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (4, 'model', 'trifecta', '8/7/4/6/1', 60, 'miss', 0, -60);

INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (5, 'model', 'win', '9', 50, 'hit', 523, 473);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (5, 'model', 'exacta', '9/2/6/8', 60, 'hit', 198.25, 138.25);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (5, 'model', 'trifecta', '9/2/6/8/10', 60, 'miss', 0, -60);

INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (6, 'model', 'win', '9', 100, 'miss', 0, -100);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (6, 'model', 'exacta', '9/1/14/5', 60, 'miss', 0, -60);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (6, 'model', 'trifecta', '9/1/14/5/8', 60, 'miss', 0, -60);

INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (7, 'model', 'win', '5', 50, 'miss', 0, -50);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (7, 'model', 'exacta', '5/7/1/3', 60, 'miss', 0, -60);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (7, 'model', 'trifecta', '5/7/1/3/2', 60, 'miss', 0, -60);

INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (8, 'model', 'win', '2', 50, 'miss', 0, -50);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (8, 'model', 'exacta', '6/3/2', 30, 'hit', 34.75, 4.75);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (8, 'model', 'trifecta', '6/3/2/8', 24, 'miss', 0, -24);

INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (9, 'model', 'win', '5', 100, 'hit', 624, 524);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (9, 'model', 'exacta', '5/4/9/3', 60, 'miss', 0, -60);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (9, 'model', 'trifecta', '5/4/9/3/1', 60, 'miss', 0, -60);

INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (10, 'model', 'win', '2', 50, 'miss', 0, -50);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (10, 'model', 'exacta', '6/2/5/7', 60, 'hit', 551.70, 491.70);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (10, 'model', 'trifecta', '6/2/5/7/1', 60, 'hit', 50.10, -9.90);

INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (11, 'model', 'win', '6', 50, 'miss', 0, -50);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (11, 'model', 'exacta', '6/7/3/5', 60, 'miss', 0, -60);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (11, 'model', 'trifecta', '6/7/3/5/4', 60, 'miss', 0, -60);

INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (12, 'model', 'win', '4', 50, 'miss', 0, -50);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (12, 'model', 'exacta', '4/3/7/5', 60, 'miss', 0, -60);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (12, 'model', 'trifecta', '4/3/7/5/8', 60, 'miss', 0, -60);

INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (13, 'model', 'win', '9', 50, 'hit', 350, 300);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (13, 'model', 'exacta', '9/3/4/8', 60, 'miss', 0, -60);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (13, 'model', 'trifecta', '9/3/4/8/7', 60, 'hit', 102.64, 42.64);

-- Belmont Day Bets — Mike (R5-R13 only)
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (5, 'mike', 'win', '9', 50, 'hit', 573, 523);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (5, 'mike', 'exacta', '2/6/9', 30, 'hit', 228.25, 198.25);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (5, 'mike', 'trifecta', '2/6/9/10', 24, 'miss', 0, -24);

INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (6, 'mike', 'win', '9', 50, 'miss', 0, -50);

INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (7, 'mike', 'win', '5', 50, 'miss', 0, -50);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (7, 'mike', 'exacta', '1/3/5/7', 36, 'miss', 0, -36);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (7, 'mike', 'trifecta', '1/3/5/7', 24, 'miss', 0, -24);

INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (8, 'mike', 'win', '2', 50, 'miss', 0, -50);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (8, 'mike', 'exacta', '2/3/5', 30, 'miss', 0, -30);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (8, 'mike', 'trifecta', '2/3/6/8', 24, 'miss', 0, -24);

INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (9, 'mike', 'win', '5', 50, 'hit', 362, 312);

INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (10, 'mike', 'win', '2', 50, 'miss', 0, -50);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (10, 'mike', 'exacta', '2/5/6', 30, 'miss', 0, -30);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (10, 'mike', 'trifecta', '2/5/7', 24, 'hit', 74.10, 50.10);

INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (11, 'mike', 'win', '6', 50, 'miss', 0, -50);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (11, 'mike', 'exacta', '3/6/7', 30, 'miss', 0, -30);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (11, 'mike', 'trifecta', '3/5/6/7', 24, 'miss', 0, -24);

INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (12, 'mike', 'win', '4', 50, 'miss', 0, -50);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (12, 'mike', 'exacta', '3/4/7', 30, 'miss', 0, -30);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (12, 'mike', 'trifecta', '3/4/5/7', 24, 'miss', 0, -24);

INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (13, 'mike', 'win', '9', 50, 'hit', 350, 300);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (13, 'mike', 'exacta', '3/4/9', 30, 'miss', 0, -30);
INSERT INTO bets (race_id, bettor, bet_type, selections, wager, result, payout, pl) VALUES (13, 'mike', 'trifecta', '2/3/4/9', 24, 'miss', 0, -24);

-- Belmont Day Signals Fired
INSERT INTO signals_fired (race_id, signal, horse_name, horse_odds, finish_position, hit, notes) VALUES (2, 'S4', 'Contrary Thinking', '17/1', 2, 1, 'Hot barn at price — ran 2nd');
INSERT INTO signals_fired (race_id, signal, horse_name, horse_odds, finish_position, hit, notes) VALUES (2, 'Recent Life', '#9', NULL, 1, 1, 'Recent life tagged — WON');
INSERT INTO signals_fired (race_id, signal, horse_name, horse_odds, finish_position, hit, notes) VALUES (3, 'S2', 'Intellect', '4/5', 4, 0, 'Massive tote action on fave — ran 4th');
INSERT INTO signals_fired (race_id, signal, horse_name, horse_odds, finish_position, hit, notes) VALUES (4, 'Trigger A', 'Coach Albert Lady', '8/1', NULL, 0, 'Exclusion fired — fave won anyway');
INSERT INTO signals_fired (race_id, signal, horse_name, horse_odds, finish_position, hit, notes) VALUES (5, 'Troubled Trip', 'Marketplaceofideas', '9/2', 1, 1, 'Brush at gate last out — WON');
INSERT INTO signals_fired (race_id, signal, horse_name, horse_odds, finish_position, hit, notes) VALUES (5, 'Beat Vulnerable Fave', 'Marketplaceofideas', '9/2', 1, 1, 'Fave vulnerable, backed the beneficiary — WON');
INSERT INTO signals_fired (race_id, signal, horse_name, horse_odds, finish_position, hit, notes) VALUES (9, 'Beat Vulnerable Fave', 'Reef Runner', '4/1', 1, 1, 'Fave vulnerable, backed the beneficiary — WON');
INSERT INTO signals_fired (race_id, signal, horse_name, horse_odds, finish_position, hit, notes) VALUES (10, 'S6', '#7', NULL, 2, 1, 'Best Beyer in field — ran 2nd');
INSERT INTO signals_fired (race_id, signal, horse_name, horse_odds, finish_position, hit, notes) VALUES (13, 'S9', 'Golden Tempo', '5/1', 1, 1, 'Earnings leader in G1 — WON');

-- Strategy Form summary
INSERT INTO strategy_form (strategy, fires, wins, places, shows, win_pct, itm_pct, best_conditions, trend) VALUES ('Beat Vulnerable Fave', 3, 2, 0, 0, 66.7, 66.7, 'Routes, big fields', 'up');
INSERT INTO strategy_form (strategy, fires, wins, places, shows, win_pct, itm_pct, best_conditions, trend) VALUES ('Troubled Trip', 2, 1, 0, 0, 50.0, 50.0, 'Turf, better post today', 'up');
INSERT INTO strategy_form (strategy, fires, wins, places, shows, win_pct, itm_pct, best_conditions, trend) VALUES ('S9 (Earnings Leader)', 3, 1, 0, 0, 33.3, 33.3, 'Graded stakes', 'steady');
INSERT INTO strategy_form (strategy, fires, wins, places, shows, win_pct, itm_pct, best_conditions, trend) VALUES ('S4 (Hot Barn)', 2, 1, 1, 0, 50.0, 100.0, '>6/1', 'up');
INSERT INTO strategy_form (strategy, fires, wins, places, shows, win_pct, itm_pct, best_conditions, trend) VALUES ('S2 (Late Tote Action)', 3, 1, 0, 0, 33.3, 33.3, NULL, 'steady');
INSERT INTO strategy_form (strategy, fires, wins, places, shows, win_pct, itm_pct, best_conditions, trend) VALUES ('S6 (Best Beyer)', 3, 0, 1, 0, 0.0, 33.3, NULL, 'steady');
INSERT INTO strategy_form (strategy, fires, wins, places, shows, win_pct, itm_pct, best_conditions, trend) VALUES ('Trigger A (Traffic)', 3, 0, 0, 0, 0.0, 0.0, NULL, 'retired');
