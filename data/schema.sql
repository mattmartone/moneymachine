-- Money Machine Database Schema
-- Tracks bets, outcomes, signals, and model vs human comparisons

CREATE TABLE IF NOT EXISTS race_days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    track TEXT NOT NULL,
    races_analyzed INTEGER,
    races_skipped INTEGER DEFAULT 0,
    total_wagered REAL,
    total_collected REAL,
    net_pl REAL,
    roi_pct REAL,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS races (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_day_id INTEGER NOT NULL,
    race_number INTEGER NOT NULL,
    conditions TEXT,
    class TEXT,
    distance TEXT,
    surface TEXT,
    purse INTEGER,
    field_size INTEGER,
    result_1st INTEGER,
    result_2nd INTEGER,
    result_3rd INTEGER,
    fave_number INTEGER,
    fave_vulnerable INTEGER DEFAULT 0,
    fave_vulnerability_reason TEXT,
    pace_scenario TEXT,
    skipped INTEGER DEFAULT 0,
    skip_reason TEXT,
    FOREIGN KEY (race_day_id) REFERENCES race_days(id)
);

CREATE TABLE IF NOT EXISTS horses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER NOT NULL,
    post_position INTEGER NOT NULL,
    name TEXT NOT NULL,
    ml_odds TEXT,
    actual_odds TEXT,
    jockey TEXT,
    trainer TEXT,
    running_style TEXT CHECK(running_style IN ('E', 'E/P', 'P', 'S')),
    signal_score INTEGER DEFAULT 0,
    finish_position INTEGER,
    FOREIGN KEY (race_id) REFERENCES races(id)
);

CREATE TABLE IF NOT EXISTS bets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER NOT NULL,
    bettor TEXT NOT NULL CHECK(bettor IN ('model', 'mike')),
    bet_type TEXT NOT NULL CHECK(bet_type IN ('win', 'exacta', 'trifecta')),
    selections TEXT NOT NULL,
    wager REAL NOT NULL,
    result TEXT CHECK(result IN ('hit', 'miss')),
    payout REAL DEFAULT 0,
    pl REAL,
    FOREIGN KEY (race_id) REFERENCES races(id)
);

CREATE TABLE IF NOT EXISTS signals_fired (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER NOT NULL,
    horse_id INTEGER,
    signal TEXT NOT NULL,
    weight INTEGER,
    horse_name TEXT,
    horse_odds TEXT,
    finish_position INTEGER,
    hit INTEGER DEFAULT 0,
    notes TEXT,
    FOREIGN KEY (race_id) REFERENCES races(id),
    FOREIGN KEY (horse_id) REFERENCES horses(id)
);

CREATE TABLE IF NOT EXISTS strategy_form (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    strategy TEXT NOT NULL UNIQUE,
    fires INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    places INTEGER DEFAULT 0,
    shows INTEGER DEFAULT 0,
    win_pct REAL DEFAULT 0,
    itm_pct REAL DEFAULT 0,
    total_wagered REAL DEFAULT 0,
    total_collected REAL DEFAULT 0,
    roi_pct REAL DEFAULT 0,
    best_conditions TEXT,
    trend TEXT CHECK(trend IN ('up', 'steady', 'down', 'retired'))
);

-- Views for quick queries

CREATE VIEW IF NOT EXISTS v_strategy_performance AS
SELECT
    signal as strategy,
    COUNT(*) as fires,
    SUM(CASE WHEN finish_position = 1 THEN 1 ELSE 0 END) as wins,
    SUM(CASE WHEN finish_position = 2 THEN 1 ELSE 0 END) as places,
    SUM(CASE WHEN finish_position = 3 THEN 1 ELSE 0 END) as shows,
    ROUND(SUM(CASE WHEN finish_position = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as win_pct,
    ROUND(SUM(CASE WHEN finish_position <= 3 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as itm_pct
FROM signals_fired
GROUP BY signal
ORDER BY win_pct DESC;

CREATE VIEW IF NOT EXISTS v_bet_type_performance AS
SELECT
    bet_type,
    bettor,
    COUNT(*) as attempts,
    SUM(CASE WHEN result = 'hit' THEN 1 ELSE 0 END) as hits,
    ROUND(SUM(CASE WHEN result = 'hit' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as hit_pct,
    SUM(wager) as total_wagered,
    SUM(payout) as total_collected,
    ROUND(SUM(pl), 2) as net_pl
FROM bets
GROUP BY bet_type, bettor
ORDER BY bettor, bet_type;

CREATE VIEW IF NOT EXISTS v_model_vs_mike AS
SELECT
    r.race_number,
    rd.date,
    rd.track,
    mb.wager as model_wager,
    mb.pl as model_pl,
    mk.wager as mike_wager,
    mk.pl as mike_pl,
    mb.pl - COALESCE(mk.pl, 0) as model_edge
FROM races r
JOIN race_days rd ON r.race_day_id = rd.id
LEFT JOIN bets mb ON mb.race_id = r.id AND mb.bettor = 'model'
LEFT JOIN bets mk ON mk.race_id = r.id AND mk.bettor = 'mike'
ORDER BY rd.date, r.race_number;
