-- scripts/020-add-tracking-code.sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(100);
