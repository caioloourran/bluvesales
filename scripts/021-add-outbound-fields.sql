-- scripts/021-add-outbound-fields.sql
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS outbound_url     VARCHAR(500);
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS outbound_api_key VARCHAR(255);
