-- Affiliate-specific Payt Checkout IDs per plan (separate from admin plan checkout IDs)
CREATE TABLE IF NOT EXISTS affiliate_plan_checkouts (
  id SERIAL PRIMARY KEY,
  affiliate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  payt_checkout_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(affiliate_id, plan_id)
);

CREATE INDEX IF NOT EXISTS idx_apc_affiliate ON affiliate_plan_checkouts(affiliate_id);
