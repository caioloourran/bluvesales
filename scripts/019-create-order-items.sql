-- scripts/019-create-order-items.sql
CREATE TABLE IF NOT EXISTS order_items (
  id           SERIAL PRIMARY KEY,
  order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  code         VARCHAR(100) NOT NULL,
  name         VARCHAR(255) NOT NULL,
  price        NUMERIC(12,2) NOT NULL,
  quantity     NUMERIC(12,2) NOT NULL DEFAULT 1,
  total_amount NUMERIC(12,2) NOT NULL,
  height       NUMERIC(10,2),
  width        NUMERIC(10,2),
  length       NUMERIC(10,2),
  weight       NUMERIC(10,2),
  package_type VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
