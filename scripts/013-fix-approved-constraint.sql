-- Fix approved payments constraints to ensure per-user upsert works correctly.
-- Safe to run multiple times.

-- 1. Drop old global unique constraint (if still present from migration 008)
ALTER TABLE daily_approved_payments
  DROP CONSTRAINT IF EXISTS daily_approved_payments_date_plan_id_payment_method_key;

-- 2. Recreate partial unique index (drop first to ensure correct definition)
DROP INDEX IF EXISTS daily_approved_payments_user_unique_idx;

CREATE UNIQUE INDEX daily_approved_payments_user_unique_idx
  ON daily_approved_payments (date, plan_id, payment_method, created_by)
  WHERE created_by IS NOT NULL;
