-- scripts/015-create-orders.sql
CREATE TABLE IF NOT EXISTS orders (
  id           SERIAL PRIMARY KEY,

  -- Customer data
  cpf          VARCHAR(14)  NOT NULL,
  nome         VARCHAR(255) NOT NULL,
  email        VARCHAR(255),
  whatsapp     VARCHAR(20)  NOT NULL,

  -- Address
  cep          VARCHAR(9)   NOT NULL,
  rua          VARCHAR(255) NOT NULL,
  numero       VARCHAR(20)  NOT NULL,
  bairro       VARCHAR(255) NOT NULL,
  cidade       VARCHAR(255) NOT NULL,
  estado       VARCHAR(2)   NOT NULL,
  complemento  VARCHAR(255),

  -- Order
  product_id   INTEGER REFERENCES products(id) ON DELETE SET NULL,
  plan_id      INTEGER REFERENCES plans(id)    ON DELETE SET NULL,
  status       VARCHAR(30)  NOT NULL DEFAULT 'reportados'
               CHECK (status IN (
                 'reportados', 'enviados', 'saiu_para_entrega',
                 'retirar_nos_correios', 'requer_atencao', 'entregues',
                 'cobrados', 'inadimplencias', 'aguardando_devolucao',
                 'devolvido', 'frustrados', 'pagos'
               )),
  comprovante  TEXT,

  -- Meta
  seller_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status    ON orders(status);
