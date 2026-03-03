-- Fees table: stores global fee configurations
-- type: 'percent' or 'fixed'
CREATE TABLE IF NOT EXISTS fees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  type VARCHAR(10) NOT NULL DEFAULT 'percent' CHECK (type IN ('percent', 'fixed')),
  value NUMERIC(10,4) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add product_cost and shipping_cost to plans
ALTER TABLE plans ADD COLUMN IF NOT EXISTS product_cost NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Seed default fees
INSERT INTO fees (name, slug, type, value) VALUES
  ('Taxa da Plataforma de Vendas', 'platform_fee', 'percent', 0),
  ('Imposto sobre Investimento', 'investment_tax', 'percent', 0)
ON CONFLICT (slug) DO NOTHING;
