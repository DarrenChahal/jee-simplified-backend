CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS registration_tracking (
    unique_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_email TEXT NOT NULL,
    test_id TEXT NOT NULL,

    submission_status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    submitted_at BIGINT,

    evaluation_status TEXT NOT NULL DEFAULT 'PENDING',

    questions_solved INTEGER,
    user_test_duration INTEGER,

    user_rating_post_test INTEGER,
    user_rating_change INTEGER,
    user_test_ranking INTEGER,

    created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,

    UNIQUE (user_email, test_id)
);
