CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

CREATE TABLE IF NOT EXISTS aircraft_configs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id),
    name        VARCHAR(255) NOT NULL,
    wing_type   VARCHAR(100) NOT NULL,
    tail_type   VARCHAR(100) NOT NULL,
    config_data JSONB        NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_aircraft_configs_user_id  ON aircraft_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_aircraft_configs_deleted_at ON aircraft_configs(deleted_at);

CREATE TABLE IF NOT EXISTS calculations (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id),
    config_id   BIGINT       REFERENCES aircraft_configs(id),
    type        VARCHAR(100) NOT NULL,
    input_data  JSONB        NOT NULL DEFAULT '{}',
    result_data JSONB        NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calculations_user_id ON calculations(user_id);