-- Add seller_id column to daily_ad_metrics for per-seller marketing metrics
ALTER TABLE daily_ad_metrics ADD COLUMN IF NOT EXISTS seller_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Drop old unique constraint on date only (if exists)
ALTER TABLE daily_ad_metrics DROP CONSTRAINT IF EXISTS daily_ad_metrics_date_key;

-- Create new unique constraint on (date, seller_id)
ALTER TABLE daily_ad_metrics ADD CONSTRAINT daily_ad_metrics_date_seller_key UNIQUE (date, seller_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ad_metrics_seller ON daily_ad_metrics(seller_id);
