-- Fake Info Detector Database Schema
-- Compatible with both PostgreSQL and SQLite

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verifications Table
CREATE TABLE IF NOT EXISTS verifications (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    modality TEXT NOT NULL, -- 'text', 'image', 'video', 'url', 'document'
    input_summary TEXT NOT NULL,
    prediction TEXT NOT NULL, -- 'real', 'fake', 'suspicious'
    confidence_score REAL NOT NULL, -- 0.00 to 100.00
    model_score REAL,
    rule_score REAL,
    composite_score REAL,
    explanation_json TEXT NOT NULL, -- JSON serialized array of indicator strings
    indicators_json TEXT, -- JSON serialized dictionary of raw flags
    file_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for fast queries
CREATE INDEX IF NOT EXISTS idx_verifications_user_id ON verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_modality ON verifications(modality);
CREATE INDEX IF NOT EXISTS idx_verifications_prediction ON verifications(prediction);

-- Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_resets (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
CREATE INDEX IF NOT EXISTS idx_password_resets_code ON password_resets(code);
