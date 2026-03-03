-- Create daily_approved_payments table for billing/collections tracking

CREATE TABLE IF NOT EXISTS daily_approved_payments (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  payment_method VARCHAR(10) NOT NULL DEFAULT 'PIX'
    CHECK (payment_method IN ('PIX', 'BOLETO', 'CARTAO')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (date, seller_id, plan_id, payment_method)
);

CREATE INDEX IF NOT EXISTS idx_dap_date ON daily_approved_payments(date);
CREATE INDEX IF NOT EXISTS idx_dap_seller ON daily_approved_payments(seller_id);
CREATE INDEX IF NOT EXISTS idx_dap_plan ON daily_approved_payments(plan_id);
