-- Add discount column to daily_sales_entries
ALTER TABLE daily_sales_entries ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2) DEFAULT 0;
