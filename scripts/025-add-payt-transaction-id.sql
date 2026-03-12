-- scripts/025-add-payt-transaction-id.sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payt_transaction_id VARCHAR(100);
