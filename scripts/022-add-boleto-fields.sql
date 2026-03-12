-- scripts/022-add-boleto-fields.sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS boleto_url        VARCHAR(500);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS asaas_payment_id  VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS asaas_customer_id VARCHAR(100);
