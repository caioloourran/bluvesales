-- scripts/029-add-plan-sku.sql
ALTER TABLE plans ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
