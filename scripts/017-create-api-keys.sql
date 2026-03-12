-- scripts/017-create-api-keys.sql
CREATE TABLE IF NOT EXISTS api_keys (
  id           SERIAL PRIMARY KEY,
  origin       VARCHAR(100) NOT NULL UNIQUE,
  api_key      VARCHAR(255) NOT NULL UNIQUE,
  seller_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  active       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_api_key ON api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_api_keys_origin  ON api_keys(origin);
