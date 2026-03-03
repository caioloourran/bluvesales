-- Add payment method support to sales entries and fees

-- 1. Add payment_method to daily_sales_entries
ALTER TABLE daily_sales_entries
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(10) NOT NULL DEFAULT 'PIX'
  CHECK (payment_method IN ('PIX', 'BOLETO', 'CARTAO'));

-- 2. Drop old UNIQUE constraint, add new one including payment_method
ALTER TABLE daily_sales_entries
  DROP CONSTRAINT IF EXISTS daily_sales_entries_date_seller_id_plan_id_key;

ALTER TABLE daily_sales_entries
  ADD CONSTRAINT daily_sales_entries_date_seller_plan_pm_key
  UNIQUE (date, seller_id, plan_id, payment_method);

-- 3. Add payment_method to fees (nullable = applies to ALL methods)
ALTER TABLE fees
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(10) DEFAULT NULL
  CHECK (payment_method IS NULL OR payment_method IN ('PIX', 'BOLETO', 'CARTAO'));

-- 4. Seed default payment-method-specific fees
INSERT INTO fees (name, slug, type, value, applies_to, payment_method) VALUES
  ('Taxa PIX', 'taxa_pix', 'PERCENT', 0, 'SALE', 'PIX'),
  ('Taxa Boleto', 'taxa_boleto', 'PERCENT', 0, 'SALE', 'BOLETO'),
  ('Taxa Cartao', 'taxa_cartao', 'PERCENT', 0, 'SALE', 'CARTAO')
ON CONFLICT (slug) DO NOTHING;
