-- Add created_by column to track which COBRANCA user made each entry
ALTER TABLE daily_approved_payments
  ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Drop the old global unique constraint
ALTER TABLE daily_approved_payments
  DROP CONSTRAINT IF EXISTS daily_approved_payments_date_plan_id_payment_method_key;

-- New unique constraint: per user per date/plan/method
-- Uses a partial unique index so NULL created_by (legacy rows) are not constrained
CREATE UNIQUE INDEX IF NOT EXISTS daily_approved_payments_user_unique_idx
  ON daily_approved_payments (date, plan_id, payment_method, created_by)
  WHERE created_by IS NOT NULL;

-- Index for fast filtering by user
CREATE INDEX IF NOT EXISTS daily_approved_payments_created_by_idx
  ON daily_approved_payments (created_by);
