# Design: Módulo de Pedidos AfterPay com Kanban

**Data:** 2026-03-11
**Status:** Aprovado

---

## Visão Geral

Módulo completo de gestão de pedidos AfterPay com board Kanban drag-and-drop. Vendedores e admins registram pedidos com dados do cliente, endereço (CEP auto-preenchido via ViaCEP), produto/plano selecionável e comprovante em imagem. Os pedidos são acompanhados visualmente em 9 colunas de status.

---

## Arquitetura

**Stack:**
- Next.js App Router (Server Components + Server Actions)
- `@dnd-kit/core` + `@dnd-kit/sortable` para drag & drop
- ViaCEP API pública para busca automática de endereço por CEP
- Neon PostgreSQL (via `@neondatabase/serverless`)
- Comprovante armazenado como base64 no banco (mesmo padrão do avatar)

**Nova rota:** `/pedidos` dentro do grupo `(dashboard)`

**Arquivos a criar:**
```
scripts/015-create-orders.sql
app/(dashboard)/pedidos/page.tsx
components/pedidos/kanban-board.tsx
components/pedidos/kanban-column.tsx
components/pedidos/order-card.tsx
components/pedidos/order-form-dialog.tsx
lib/actions/orders-actions.ts
```

**Arquivo a modificar:**
```
components/app-sidebar.tsx   ← adicionar link /pedidos para todos os roles
```

---

## Controle de Acesso

| Role         | Criar pedido | Ver pedidos  | Mover cards |
|--------------|-------------|--------------|-------------|
| ADMIN_MASTER | Todos       | Todos        | Sim         |
| SELLER       | Próprios    | Próprios     | Sim         |
| COBRANCA     | Sim         | Todos        | Sim         |

---

## Banco de Dados

**Migration:** `scripts/015-create-orders.sql`

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,

  -- Dados do cliente
  cpf          VARCHAR(14)  NOT NULL,
  nome         VARCHAR(255) NOT NULL,
  email        VARCHAR(255),
  whatsapp     VARCHAR(20)  NOT NULL,

  -- Endereço
  cep          VARCHAR(9)   NOT NULL,
  rua          VARCHAR(255) NOT NULL,
  numero       VARCHAR(20)  NOT NULL,
  bairro       VARCHAR(255) NOT NULL,
  cidade       VARCHAR(255) NOT NULL,
  estado       VARCHAR(2)   NOT NULL,
  complemento  VARCHAR(255),

  -- Pedido
  product_id   INTEGER REFERENCES products(id) ON DELETE SET NULL,
  plan_id      INTEGER REFERENCES plans(id)    ON DELETE SET NULL,
  status       VARCHAR(30)  NOT NULL DEFAULT 'reportados',
  comprovante  TEXT,  -- base64 JPG/PNG

  -- Meta
  seller_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_seller_id ON orders(seller_id);
CREATE INDEX idx_orders_status    ON orders(status);
```

**Valores de status (9 colunas):**
- `reportados`
- `enviados`
- `saiu_para_entrega`
- `retirar_nos_correios`
- `requer_atencao`
- `entregues`
- `inadimplencias`
- `frustados`
- `pagos`

---

## Formulário de Cadastro (Modal/Dialog)

### Dados do Cliente
- CPF (máscara `000.000.000-00`)
- Nome
- E-mail (opcional)
- WhatsApp (máscara `(00) 00000-0000`)

### Endereço
- CEP — ao sair do campo, busca na ViaCEP e preenche automaticamente:
  - Rua, Bairro, Cidade, Estado
- Número (manual)
- Complemento (manual)

### Pedido
- Produto (select de `products` ativos)
- Plano (select de `plans` filtrado pelo produto selecionado)
- Comprovante (upload JPG/PNG → base64, com preview inline)

---

## Kanban Board

- Scroll horizontal com as 9 colunas
- Cada coluna: nome do status + contador de cards
- Cada card exibe: nome do cliente, produto/plano, WhatsApp, data de criação
- Drag & drop entre colunas → Server Action atualiza `status` no banco
- Clique no card → modal com dados completos (visualizar/editar)
- Botão "Novo Pedido" fixo no topo da página

### Cores das Colunas
| Coluna               | Cor             |
|----------------------|-----------------|
| Reportados           | Azul            |
| Enviados             | Roxo            |
| Saiu para Entrega    | Laranja         |
| Retirar nos Correios | Amarelo         |
| Requer atenção       | Vermelho        |
| Entregues            | Verde           |
| Inadimplências       | Vermelho escuro |
| Frustados            | Cinza           |
| Pagos                | Verde escuro    |

---

## Sidebar

Adicionar "Pedidos" com ícone `Package2` (ou similar) para os três arrays de links:
- `adminLinks`
- `sellerLinks`
- `cobrancaLinks`

Rota: `/pedidos`
