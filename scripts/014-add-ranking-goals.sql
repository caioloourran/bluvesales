-- Migration 014: Add ranking goals
-- Individual seller monthly goal (agendamentos count)
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_goal INTEGER NOT NULL DEFAULT 0;

-- Single-row team goal settings table
CREATE TABLE IF NOT EXISTS ranking_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  team_goal INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT ranking_settings_single_row CHECK (id = 1)
);

INSERT INTO ranking_settings (id, team_goal) VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;
