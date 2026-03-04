-- Migration 012: Roleta de Premios

CREATE TABLE IF NOT EXISTS roleta_prizes (
  id          SERIAL PRIMARY KEY,
  label       VARCHAR(100)  NOT NULL,
  color       VARCHAR(7)    NOT NULL DEFAULT '#FF6B6B',
  position    INTEGER       NOT NULL DEFAULT 0,
  active      BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roleta_settings (
  id              SERIAL PRIMARY KEY,
  enabled         BOOLEAN  NOT NULL DEFAULT false,
  spins_per_day   INTEGER  NOT NULL DEFAULT 1,
  lock            BOOLEAN  NOT NULL DEFAULT true,
  CONSTRAINT roleta_settings_single_row UNIQUE (lock),
  CONSTRAINT roleta_settings_lock_check CHECK (lock = true)
);

INSERT INTO roleta_settings (enabled, spins_per_day, lock)
VALUES (false, 1, true)
ON CONFLICT (lock) DO NOTHING;

CREATE TABLE IF NOT EXISTS roleta_spins (
  id           SERIAL      PRIMARY KEY,
  seller_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prize_id     INTEGER     REFERENCES roleta_prizes(id) ON DELETE SET NULL,
  result_label VARCHAR(100) NOT NULL,
  spun_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roleta_spins_seller ON roleta_spins(seller_id);
CREATE INDEX IF NOT EXISTS idx_roleta_spins_date ON roleta_spins(spun_at);
