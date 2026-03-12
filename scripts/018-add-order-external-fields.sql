-- scripts/018-add-order-external-fields.sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number         VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS origin               VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sale_type            VARCHAR(30) DEFAULT 'standard';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS related_order_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS offer_id             VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS offer_name           VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_type        VARCHAR(2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_country     VARCHAR(2) DEFAULT 'BR';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_value          NUMERIC(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_discount       NUMERIC(12,2) DEFAULT 0;

-- Idempotency: origin + order_number must be unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_origin_order_number
  ON orders(origin, order_number) WHERE origin IS NOT NULL AND order_number IS NOT NULL;
