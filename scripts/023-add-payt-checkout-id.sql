-- scripts/023-add-payt-checkout-id.sql
ALTER TABLE plans ADD COLUMN IF NOT EXISTS payt_checkout_id VARCHAR(100);
