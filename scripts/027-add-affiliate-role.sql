-- Add AFFILIATE role and affiliate_id to users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('ADMIN_MASTER', 'SELLER', 'COBRANCA', 'AFFILIATE'));

-- affiliate_id: links a seller to their affiliate owner
ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliate_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- payt_checkout_id: affiliate's own Payt checkout ID (overrides plan-level)
ALTER TABLE users ADD COLUMN IF NOT EXISTS payt_checkout_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_users_affiliate ON users(affiliate_id);
