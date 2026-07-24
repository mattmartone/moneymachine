import pg from 'pg';
const { Pool } = pg;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const pool = new Pool({
  connectionString: 'postgres://postgres.bazvhjajajkpkqqvyelg:LMczMTBYFGH6w9yn@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: true
});

const DDL = `
CREATE TABLE IF NOT EXISTS scored_candidates (
    id SERIAL PRIMARY KEY,
    race_id INTEGER NOT NULL REFERENCES races(id),
    date DATE NOT NULL,

    status TEXT NOT NULL CHECK (status IN ('scored', 'blocked')),
    blocked_reason TEXT,
    conviction TEXT,

    composite_score REAL,
    signal_score INTEGER,
    odds_bonus INTEGER,

    s1_fired BOOLEAN DEFAULT false,
    s4_fired BOOLEAN DEFAULT false,
    s5_fired BOOLEAN DEFAULT false,
    s6_fired BOOLEAN DEFAULT false,
    s9_fired BOOLEAN DEFAULT false,
    s11_fired BOOLEAN DEFAULT false,

    win_pick_pp INTEGER,
    win_pick_name TEXT,
    win_pick_ml TEXT,
    win_pick_style TEXT,
    win_pick_beyer INTEGER,
    win_pick_distance_beyer INTEGER,

    box_pps INTEGER[],
    box_names TEXT[],

    field_size INTEGER,
    pace_scenario TEXT,
    fave_vulnerable BOOLEAN DEFAULT false,
    fave_pp INTEGER,
    fave_name TEXT,
    fave_style TEXT,
    vulnerability_reason TEXT,

    proposed_win_stake REAL,
    proposed_exacta_stake REAL,
    doubled BOOLEAN DEFAULT false,

    race_theory TEXT,

    run_id TEXT,
    scored_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(race_id, date)
);

CREATE INDEX IF NOT EXISTS idx_sc_date ON scored_candidates(date);
CREATE INDEX IF NOT EXISTS idx_sc_conviction ON scored_candidates(conviction);
CREATE INDEX IF NOT EXISTS idx_sc_composite ON scored_candidates(composite_score DESC NULLS LAST);
`;

try {
  await pool.query(DDL);
  const { rows } = await pool.query('SELECT count(*) FROM scored_candidates');
  console.log(`scored_candidates table ready (${rows[0].count} existing rows)`);
} catch (e) {
  console.error('Migration failed:', e.message);
  process.exit(1);
} finally {
  await pool.end();
}
