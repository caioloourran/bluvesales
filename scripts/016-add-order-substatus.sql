-- scripts/016-add-order-substatus.sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_envio VARCHAR(30);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_plataforma VARCHAR(30);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_pagamento VARCHAR(30);
