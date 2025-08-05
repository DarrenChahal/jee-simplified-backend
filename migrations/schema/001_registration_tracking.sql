CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS registration_tracking (
    unique_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    test_id UUID NOT NULL,
    test_duration INTEGER NOT NULL,
    test_date BIGINT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('live', 'scheduled', 'complete')),
    total_questions INTEGER NOT NULL,
    questions_solved INTEGER NOT NULL,
    user_ranking_post_test INTEGER,
    user_ranking_change INTEGER,
    created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);
