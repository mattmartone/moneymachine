-- Vercel Postgres schema for Fade the Chalk

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    source TEXT,
    onboarded BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    track TEXT NOT NULL,
    date DATE NOT NULL,
    races_analyzed INTEGER,
    roi_pct REAL,
    summary TEXT,
    content_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed with Belmont Day report
INSERT INTO reports (title, track, date, races_analyzed, roi_pct, summary)
VALUES (
    'Belmont Stakes Day 2026',
    'Saratoga',
    '2026-06-06',
    12,
    56.0,
    '3 winners called (25%), 4 exactas hit (33%). Called the Belmont Stakes winner Golden Tempo at 5/1 — not the favorite. +$870 net on $1,564 wagered.'
);
