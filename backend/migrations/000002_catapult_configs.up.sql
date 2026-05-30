CREATE TABLE IF NOT EXISTS catapult_configs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id),
    name        VARCHAR(255) NOT NULL,
    config_data JSONB        NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_catapult_configs_user_id ON catapult_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_catapult_configs_deleted_at ON catapult_configs(deleted_at);