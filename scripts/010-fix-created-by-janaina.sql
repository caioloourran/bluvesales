-- Fix existing daily_approved_payments rows that have created_by = NULL
-- These entries were made before the per-user tracking was added (migration 009)
-- and belong to the user janaina@bluvecompany.com.br

UPDATE daily_approved_payments
SET created_by = (
  SELECT id FROM users WHERE email = 'janaina@bluvecompany.com.br' LIMIT 1
)
WHERE created_by IS NULL;
