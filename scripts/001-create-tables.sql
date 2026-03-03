-- Create tables for sales/marketing dashboard

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'SELLER' CHECK (role IN ('ADMIN_MASTER', 'SELLER')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  sale_price_gross NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sale_price_net NUMERIC(12, 2),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seller_commissions (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seller_id, plan_id)
);

CREATE TABLE IF NOT EXISTS daily_ad_metrics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  investment NUMERIC(12, 2) NOT NULL DEFAULT 0,
  leads INTEGER NOT NULL DEFAULT 0,
  purchases_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_sales_entries (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, seller_id, plan_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_plans_product_id ON plans(product_id);
CREATE INDEX IF NOT EXISTS idx_seller_commissions_seller_id ON seller_commissions(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_commissions_plan_id ON seller_commissions(plan_id);
CREATE INDEX IF NOT EXISTS idx_daily_ad_metrics_date ON daily_ad_metrics(date);
CREATE INDEX IF NOT EXISTS idx_daily_sales_entries_date ON daily_sales_entries(date);
CREATE INDEX IF NOT EXISTS idx_daily_sales_entries_seller_id ON daily_sales_entries(seller_id);
CREATE INDEX IF NOT EXISTS idx_daily_sales_entries_plan_id ON daily_sales_entries(plan_id);
