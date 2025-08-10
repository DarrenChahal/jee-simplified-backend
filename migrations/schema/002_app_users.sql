CREATE TABLE IF NOT EXISTS app_users (
    id SERIAL PRIMARY KEY,
    clerk_user_id TEXT UNIQUE NOT NULL,
    user_email TEXT UNIQUE NOT NULL,
    user_name TEXT,
    role TEXT DEFAULT 'user',
    class TEXT,
    institute TEXT,
    date_of_joining BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);
