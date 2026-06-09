-- Fade the Chalk — Full Schema v2
-- Strategy-as-horse model: track performance, earnings, attribution

-- ============================================================
-- RAW DATA (from PDF parse)
-- ============================================================

CREATE TABLE IF NOT EXISTS races (
    id SERIAL PRIMARY KEY,
    track TEXT NOT NULL,
    date DATE NOT NULL,
    race_number INTEGER NOT NULL,
    conditions TEXT,
    class TEXT,
    distance TEXT,
    surface TEXT,
    purse INTEGER,
    field_size INTEGER,
    qualified BOOLEAN DEFAULT true,
    skip_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(track, date, race_number)
);

CREATE TABLE IF NOT EXISTS horses (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    sire TEXT,
    dam TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entries (
    id SERIAL PRIMARY KEY,
    race_id INTEGER NOT NULL REFERENCES races(id),
    horse_id INTEGER NOT NULL REFERENCES horses(id),
    post_position INTEGER,
    morning_line_odds TEXT,
    live_odds TEXT,
    jockey TEXT,
    trainer TEXT,
    weight INTEGER,
    owner TEXT,
    equipment TEXT,
    last_race_date DATE,
    days_since_last INTEGER,
    best_beyer INTEGER,
    last_beyer INTEGER,
    lifetime_earnings INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(race_id, horse_id)
);

-- ============================================================
-- ANALYSIS OUTPUT (Phase 2-3)
-- ============================================================

CREATE TABLE IF NOT EXISTS style_tags (
    id SERIAL PRIMARY KEY,
    entry_id INTEGER NOT NULL REFERENCES entries(id) UNIQUE,
    style TEXT NOT NULL CHECK (style IN ('E', 'E/P', 'P', 'S')),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS pace_maps (
    id SERIAL PRIMARY KEY,
    race_id INTEGER NOT NULL REFERENCES races(id) UNIQUE,
    speed_count INTEGER NOT NULL,
    shape TEXT NOT NULL CHECK (shape IN ('no_speed', 'lone_speed', 'pace_duel')),
    narrative TEXT
);

CREATE TABLE IF NOT EXISTS vulnerability_assessments (
    id SERIAL PRIMARY KEY,
    race_id INTEGER NOT NULL REFERENCES races(id) UNIQUE,
    favorite_entry_id INTEGER REFERENCES entries(id),
    vulnerable BOOLEAN NOT NULL,
    trigger_type TEXT,
    trigger_detail TEXT,
    beneficiary_entry_id INTEGER REFERENCES entries(id),
    beneficiary_reason TEXT
);

CREATE TABLE IF NOT EXISTS signal_scores (
    id SERIAL PRIMARY KEY,
    entry_id INTEGER NOT NULL REFERENCES entries(id),
    signal TEXT NOT NULL,
    weight INTEGER NOT NULL,
    rationale TEXT,
    requires_live_odds BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(entry_id, signal)
);

-- ============================================================
-- STRATEGIES (the stable)
-- ============================================================

CREATE TABLE IF NOT EXISTS strategies (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('signal', 'offensive', 'filter', 'rule')),
    description TEXT NOT NULL,
    logic_summary TEXT,
    author_id INTEGER REFERENCES users(id),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- BETS (Phase 4 output)
-- ============================================================

CREATE TABLE IF NOT EXISTS bets (
    id SERIAL PRIMARY KEY,
    race_id INTEGER NOT NULL REFERENCES races(id),
    bet_type TEXT NOT NULL CHECK (bet_type IN ('win', 'exacta', 'trifecta', 'superfecta')),
    entries_used INTEGER[] NOT NULL,
    stake REAL NOT NULL,
    doubled BOOLEAN DEFAULT false,
    conviction TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- STRATEGY ACTIVATIONS (every time a strategy fires in a bet)
-- This is the core tracking table. One row per strategy per bet.
-- ============================================================

CREATE TABLE IF NOT EXISTS strategy_activations (
    id SERIAL PRIMARY KEY,
    bet_id INTEGER NOT NULL REFERENCES bets(id),
    strategy_id INTEGER NOT NULL REFERENCES strategies(id),
    entry_id INTEGER REFERENCES entries(id),
    rationale TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- RESULTS (post-race settle)
-- ============================================================

CREATE TABLE IF NOT EXISTS results (
    id SERIAL PRIMARY KEY,
    race_id INTEGER NOT NULL REFERENCES races(id) UNIQUE,
    win_entry_id INTEGER REFERENCES entries(id),
    place_entry_id INTEGER REFERENCES entries(id),
    show_entry_id INTEGER REFERENCES entries(id),
    win_payout REAL,
    exacta_payout REAL,
    trifecta_payout REAL,
    superfecta_payout REAL,
    settled_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bet_outcomes (
    id SERIAL PRIMARY KEY,
    bet_id INTEGER NOT NULL REFERENCES bets(id) UNIQUE,
    hit BOOLEAN NOT NULL,
    payout REAL DEFAULT 0,
    settled_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- MEMBER ORDERS (Build Your Own)
-- ============================================================

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    race_id INTEGER NOT NULL REFERENCES races(id),
    strategy_ids INTEGER[] NOT NULL,
    tokens_spent INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete')),
    result JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- VIEWS (strategy-as-horse performance)
-- ============================================================

-- Strategy past performances: win rate, ITM%, earnings, usage count
CREATE OR REPLACE VIEW strategy_performance AS
SELECT
    s.id,
    s.name,
    s.slug,
    s.type,
    s.author_id,
    COUNT(sa.id) AS starts,
    COUNT(sa.id) FILTER (WHERE bo.hit = true) AS wins,
    COUNT(sa.id) FILTER (WHERE bo.payout > 0) AS itm,
    CASE WHEN COUNT(sa.id) > 0
        THEN ROUND(100.0 * COUNT(sa.id) FILTER (WHERE bo.hit = true) / COUNT(sa.id), 1)
        ELSE 0 END AS win_pct,
    CASE WHEN COUNT(sa.id) > 0
        THEN ROUND(100.0 * COUNT(sa.id) FILTER (WHERE bo.payout > 0) / COUNT(sa.id), 1)
        ELSE 0 END AS itm_pct,
    COALESCE(SUM(bo.payout), 0) AS lifetime_earnings,
    COALESCE(SUM(b.stake), 0) AS lifetime_wagered,
    CASE WHEN COALESCE(SUM(b.stake), 0) > 0
        THEN ROUND(100.0 * (SUM(bo.payout) - SUM(b.stake)) / SUM(b.stake), 1)
        ELSE 0 END AS roi_pct
FROM strategies s
LEFT JOIN strategy_activations sa ON sa.strategy_id = s.id
LEFT JOIN bets b ON b.id = sa.bet_id
LEFT JOIN bet_outcomes bo ON bo.bet_id = b.id
GROUP BY s.id, s.name, s.slug, s.type, s.author_id;

-- Handicapper earnings (from member order usage)
CREATE OR REPLACE VIEW handicapper_earnings AS
SELECT
    s.author_id,
    u.name AS author_name,
    COUNT(o.id) AS times_ordered,
    SUM(o.tokens_spent) AS total_tokens_earned
FROM strategies s
JOIN users u ON u.id = s.author_id
JOIN orders o ON s.id = ANY(o.strategy_ids)
WHERE o.status = 'complete'
GROUP BY s.author_id, u.name;
