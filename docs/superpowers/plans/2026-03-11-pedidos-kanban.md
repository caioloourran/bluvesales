# Pedidos Kanban Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete AfterPay orders management module with drag-and-drop Kanban board (9 columns), order registration form with CEP auto-fill via ViaCEP, product/plan cascading selects, and comprovante upload as base64.

**Architecture:** A Server Component page (`/pedidos`) fetches initial orders, products and plans and passes them to a client-side Kanban board powered by `@dnd-kit`. Cards are draggable between columns; dropping triggers a Server Action that updates `status` in the DB. The order form dialog is a client component that handles CEP lookup, input masking and image preview before submitting via a Server Action.

**Tech Stack:** Next.js 16 App Router, @dnd-kit/core + @dnd-kit/utilities, ViaCEP REST API (public, no auth), Neon PostgreSQL, react-hook-form + zod, shadcn/ui, sonner (toasts), Tailwind CSS.

> **Note:** This project has no test framework configured. TDD steps are replaced with lint/build checks and manual browser verification instructions.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `scripts/015-create-orders.sql` | Create | DB migration — orders table |
| `lib/actions/orders-actions.ts` | Create | Server Actions: create, update status, update, delete |
| `components/pedidos/order-form-dialog.tsx` | Create | Modal form: customer data, address, product/plan, comprovante |
| `components/pedidos/order-card.tsx` | Create | Draggable Kanban card (useDraggable) |
| `components/pedidos/kanban-column.tsx` | Create | Droppable column (useDroppable) |
| `components/pedidos/kanban-board.tsx` | Create | DndContext board wrapper with state |
| `app/(dashboard)/pedidos/page.tsx` | Create | Server Component — data fetch + render |
| `components/app-sidebar.tsx` | Modify | Add /pedidos link to all 3 role arrays |

---

## Chunk 1: Foundation — Migration + Server Actions

### Task 1: Create orders table migration

**Files:**
- Create: `scripts/015-create-orders.sql`

- [ ] **Step 1.1: Write migration file**

```sql
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
  status       VARCHAR(30)  NOT NULL DEFAULT 'reportados',
  comprovante  TEXT,

  -- Meta
  seller_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status    ON orders(status);
```

- [ ] **Step 1.2: Run migration against Neon DB**

```bash
# From project root — paste SQL into Neon console, OR run:
node -e "
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
const fs = require('fs');
const migration = fs.readFileSync('scripts/015-create-orders.sql', 'utf8');
sql.raw(migration).then(() => console.log('Migration OK')).catch(console.error);
"
```

Expected: `Migration OK`

- [ ] **Step 1.3: Commit**

```bash
git add scripts/015-create-orders.sql
git commit -m "feat: add orders table migration"
```

---

### Task 2: Server Actions for orders

**Files:**
- Create: `lib/actions/orders-actions.ts`

- [ ] **Step 2.1: Create Server Actions file**

```typescript
// lib/actions/orders-actions.ts
"use server";

import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface OrderFormData {
  cpf: string;
  nome: string;
  email?: string;
  whatsapp: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento?: string;
  product_id?: number | null;
  plan_id?: number | null;
  comprovante?: string | null;
}

export async function createOrderAction(data: OrderFormData) {
  const session = await requireAuth();

  await sql`
    INSERT INTO orders (
      cpf, nome, email, whatsapp,
      cep, rua, numero, bairro, cidade, estado, complemento,
      product_id, plan_id, comprovante, seller_id
    ) VALUES (
      ${data.cpf}, ${data.nome}, ${data.email || null}, ${data.whatsapp},
      ${data.cep}, ${data.rua}, ${data.numero}, ${data.bairro},
      ${data.cidade}, ${data.estado}, ${data.complemento || null},
      ${data.product_id || null}, ${data.plan_id || null},
      ${data.comprovante || null}, ${session.id}
    )
  `;

  revalidatePath("/pedidos");
  return { success: true };
}

export async function updateOrderStatusAction(id: number, status: string) {
  const session = await requireAuth();

  if (session.role === "SELLER") {
    await sql`
      UPDATE orders
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id} AND seller_id = ${session.id}
    `;
  } else {
    await sql`
      UPDATE orders
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
    `;
  }

  revalidatePath("/pedidos");
  return { success: true };
}

export async function updateOrderAction(id: number, data: OrderFormData) {
  const session = await requireAuth();

  if (session.role === "SELLER") {
    await sql`
      UPDATE orders
      SET cpf = ${data.cpf}, nome = ${data.nome}, email = ${data.email || null},
          whatsapp = ${data.whatsapp}, cep = ${data.cep}, rua = ${data.rua},
          numero = ${data.numero}, bairro = ${data.bairro}, cidade = ${data.cidade},
          estado = ${data.estado}, complemento = ${data.complemento || null},
          product_id = ${data.product_id || null}, plan_id = ${data.plan_id || null},
          comprovante = ${data.comprovante || null}, updated_at = NOW()
      WHERE id = ${id} AND seller_id = ${session.id}
    `;
  } else {
    await sql`
      UPDATE orders
      SET cpf = ${data.cpf}, nome = ${data.nome}, email = ${data.email || null},
          whatsapp = ${data.whatsapp}, cep = ${data.cep}, rua = ${data.rua},
          numero = ${data.numero}, bairro = ${data.bairro}, cidade = ${data.cidade},
          estado = ${data.estado}, complemento = ${data.complemento || null},
          product_id = ${data.product_id || null}, plan_id = ${data.plan_id || null},
          comprovante = ${data.comprovante || null}, updated_at = NOW()
      WHERE id = ${id}
    `;
  }

  revalidatePath("/pedidos");
  return { success: true };
}

export async function deleteOrderAction(id: number) {
  const session = await requireAuth();

  if (session.role === "SELLER") {
    await sql`DELETE FROM orders WHERE id = ${id} AND seller_id = ${session.id}`;
  } else {
    await sql`DELETE FROM orders WHERE id = ${id}`;
  }

  revalidatePath("/pedidos");
  return { success: true };
}
```

- [ ] **Step 2.2: Run lint check**

```bash
cd c:/Users/Windows/Desktop/BluveSales && pnpm lint
```

Expected: No errors in `lib/actions/orders-actions.ts`

- [ ] **Step 2.3: Commit**

```bash
git add lib/actions/orders-actions.ts
git commit -m "feat: add orders server actions (create, update, delete, move)"
```

---

## Chunk 2: Components — Form, Card, Column, Board

### Task 3: Install @dnd-kit

**Files:** (no file changes — dependency install)

- [ ] **Step 3.1: Install dnd-kit packages**

```bash
cd c:/Users/Windows/Desktop/BluveSales && pnpm add @dnd-kit/core @dnd-kit/utilities
```

Expected: packages added to `package.json` and `pnpm-lock.yaml`

- [ ] **Step 3.2: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: add @dnd-kit/core and @dnd-kit/utilities"
```

---

### Task 4: Order Form Dialog

**Files:**
- Create: `components/pedidos/order-form-dialog.tsx`

This is the most complex component. It handles:
- CPF mask (`000.000.000-00`)
- WhatsApp mask (`(00) 00000-0000`)
- CEP auto-fill via ViaCEP on blur
- Product → Plan cascading selects
- Comprovante upload (FileReader → base64) with preview
- Create or Edit mode (receives optional `order` prop)

- [ ] **Step 4.1: Create the component**

```tsx
// components/pedidos/order-form-dialog.tsx
"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createOrderAction, updateOrderAction } from "@/lib/actions/orders-actions";
import { ImagePlus, X } from "lucide-react";

interface Product {
  id: number;
  name: string;
}

interface Plan {
  id: number;
  product_id: number;
  plan_name: string;
}

interface Order {
  id: number;
  cpf: string;
  nome: string;
  email: string | null;
  whatsapp: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string | null;
  product_id: number | null;
  plan_id: number | null;
  comprovante: string | null;
  status: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  plans: Plan[];
  order?: Order | null;
}

function maskCpf(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskWhatsApp(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function maskCep(value: string) {
  return value.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
}

export function OrderFormDialog({ open, onOpenChange, products, plans, order }: Props) {
  const isEdit = !!order;

  const [cpf, setCpf] = useState(order?.cpf ?? "");
  const [nome, setNome] = useState(order?.nome ?? "");
  const [email, setEmail] = useState(order?.email ?? "");
  const [whatsapp, setWhatsapp] = useState(order?.whatsapp ?? "");
  const [cep, setCep] = useState(order?.cep ?? "");
  const [rua, setRua] = useState(order?.rua ?? "");
  const [numero, setNumero] = useState(order?.numero ?? "");
  const [bairro, setBairro] = useState(order?.bairro ?? "");
  const [cidade, setCidade] = useState(order?.cidade ?? "");
  const [estado, setEstado] = useState(order?.estado ?? "");
  const [complemento, setComplemento] = useState(order?.complemento ?? "");
  const [productId, setProductId] = useState<string>(order?.product_id?.toString() ?? "");
  const [planId, setPlanId] = useState<string>(order?.plan_id?.toString() ?? "");
  const [comprovante, setComprovante] = useState<string | null>(order?.comprovante ?? null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredPlans = plans.filter((p) => p.product_id === Number(productId));

  async function handleCepBlur() {
    const rawCep = cep.replace(/\D/g, "");
    if (rawCep.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error("CEP não encontrado");
      } else {
        setRua(data.logradouro ?? "");
        setBairro(data.bairro ?? "");
        setCidade(data.localidade ?? "");
        setEstado(data.uf ?? "");
      }
    } catch {
      toast.error("Erro ao buscar CEP");
    } finally {
      setLoadingCep(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Apenas JPG e PNG são aceitos");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setComprovante(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cpf || !nome || !whatsapp || !cep || !rua || !numero || !bairro || !cidade || !estado) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setSaving(true);
    const data = {
      cpf, nome, email: email || undefined,
      whatsapp, cep, rua, numero, bairro, cidade, estado,
      complemento: complemento || undefined,
      product_id: productId ? Number(productId) : null,
      plan_id: planId ? Number(planId) : null,
      comprovante,
    };
    const result = isEdit
      ? await updateOrderAction(order!.id, data)
      : await createOrderAction(data);
    setSaving(false);
    if ("error" in result) {
      toast.error(result.error as string);
    } else {
      toast.success(isEdit ? "Pedido atualizado!" : "Pedido criado!");
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Pedido" : "Novo Pedido"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados do Cliente */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Dados do Cliente
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={cpf}
                  onChange={(e) => setCpf(maskCpf(e.target.value))}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="whatsapp">WhatsApp *</Label>
                <Input
                  id="whatsapp"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(maskWhatsApp(e.target.value))}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label htmlFor="email">E-mail (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Endereço
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  value={cep}
                  onChange={(e) => setCep(maskCep(e.target.value))}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                />
                {loadingCep && (
                  <p className="text-xs text-muted-foreground">Buscando CEP...</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="numero">Número *</Label>
                <Input
                  id="numero"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="123"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label htmlFor="rua">Rua *</Label>
                <Input
                  id="rua"
                  value={rua}
                  onChange={(e) => setRua(e.target.value)}
                  placeholder="Preenchido automaticamente"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bairro">Bairro *</Label>
                <Input
                  id="bairro"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  placeholder="Apto, bloco..."
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cidade">Cidade *</Label>
                <Input
                  id="cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="estado">Estado *</Label>
                <Input
                  id="estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          {/* Pedido */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Pedido
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Produto</Label>
                <Select
                  value={productId}
                  onValueChange={(v) => { setProductId(v); setPlanId(""); }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Plano de Tratamento</Label>
                <Select
                  value={planId}
                  onValueChange={setPlanId}
                  disabled={!productId || filteredPlans.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPlans.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.plan_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Comprovante */}
            <div className="mt-3 space-y-1">
              <Label>Comprovante (JPG / PNG)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handleFileChange}
              />
              {comprovante ? (
                <div className="relative w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={comprovante}
                    alt="Comprovante"
                    className="max-h-40 rounded-lg border object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setComprovante(null)}
                    className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <ImagePlus className="h-4 w-4" />
                  Anexar comprovante
                </button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar pedido"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4.2: Run lint check**

```bash
pnpm lint
```

Expected: No errors in `components/pedidos/order-form-dialog.tsx`

- [ ] **Step 4.3: Commit**

```bash
git add components/pedidos/order-form-dialog.tsx
git commit -m "feat: add order form dialog with CEP auto-fill and comprovante upload"
```

---

### Task 5: Order Card (draggable)

**Files:**
- Create: `components/pedidos/order-card.tsx`

- [ ] **Step 5.1: Create order card component**

```tsx
// components/pedidos/order-card.tsx
"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GripVertical, Pencil, Trash2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { OrderFormDialog } from "./order-form-dialog";
import { deleteOrderAction } from "@/lib/actions/orders-actions";

interface Product { id: number; name: string }
interface Plan { id: number; product_id: number; plan_name: string }
interface Order {
  id: number;
  cpf: string;
  nome: string;
  email: string | null;
  whatsapp: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string | null;
  product_id: number | null;
  plan_id: number | null;
  comprovante: string | null;
  status: string;
  seller_name: string;
  product_name: string | null;
  plan_name: string | null;
  created_at: string;
}

interface Props {
  order: Order;
  products: Product[];
  plans: Plan[];
}

export function OrderCard({ order, products, plans }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteOrderAction(order.id);
    setDeleting(false);
    if ("error" in result) {
      toast.error(result.error as string);
    } else {
      toast.success("Pedido excluído");
      setDeleteOpen(false);
    }
  }

  const dateFormatted = (() => {
    try {
      return format(new Date(order.created_at), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "";
    }
  })();

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
          isDragging && "opacity-40 shadow-lg ring-2 ring-primary"
        )}
      >
        {/* Drag handle + actions row */}
        <div className="flex items-start justify-between gap-1 mb-2">
          <button
            {...listeners}
            {...attributes}
            className="mt-0.5 cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
            aria-label="Arrastar"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setViewOpen(true)}
              title="Ver detalhes"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setEditOpen(true)}
              title="Editar"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
              title="Excluir"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <p className="font-medium text-sm leading-tight">{order.nome}</p>
        {order.product_name && (
          <p className="text-xs text-muted-foreground mt-1">
            {order.product_name}
            {order.plan_name ? ` — ${order.plan_name}` : ""}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{order.whatsapp}</p>
        <p className="text-xs text-muted-foreground/60 mt-2">{dateFormatted}</p>

        {order.comprovante && (
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={order.comprovante}
              alt="Comprovante"
              className="w-full max-h-24 rounded object-cover border"
            />
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <OrderFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        products={products}
        plans={plans}
        order={order}
      />

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">Nome:</span> <strong>{order.nome}</strong></div>
              <div><span className="text-muted-foreground">CPF:</span> {order.cpf}</div>
              <div><span className="text-muted-foreground">WhatsApp:</span> {order.whatsapp}</div>
              {order.email && <div><span className="text-muted-foreground">E-mail:</span> {order.email}</div>}
            </div>
            <hr />
            <div>
              <p className="text-muted-foreground mb-1">Endereço:</p>
              <p>{order.rua}, {order.numero}{order.complemento ? `, ${order.complemento}` : ""}</p>
              <p>{order.bairro} — {order.cidade}/{order.estado}</p>
              <p>CEP: {order.cep}</p>
            </div>
            {(order.product_name || order.plan_name) && (
              <>
                <hr />
                <div>
                  {order.product_name && <p><span className="text-muted-foreground">Produto:</span> {order.product_name}</p>}
                  {order.plan_name && <p><span className="text-muted-foreground">Plano:</span> {order.plan_name}</p>}
                </div>
              </>
            )}
            {order.comprovante && (
              <>
                <hr />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={order.comprovante}
                  alt="Comprovante"
                  className="w-full rounded-lg border object-contain max-h-64"
                />
              </>
            )}
            <hr />
            <p className="text-muted-foreground text-xs">Criado em {dateFormatted} por {order.seller_name}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O pedido de <strong>{order.nome}</strong> será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

- [ ] **Step 5.2: Run lint check**

```bash
pnpm lint
```

- [ ] **Step 5.3: Commit**

```bash
git add components/pedidos/order-card.tsx
git commit -m "feat: add draggable order card with view/edit/delete"
```

---

### Task 6: Kanban Column (droppable)

**Files:**
- Create: `components/pedidos/kanban-column.tsx`

- [ ] **Step 6.1: Create kanban column component**

```tsx
// components/pedidos/kanban-column.tsx
"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { OrderCard } from "./order-card";

interface Product { id: number; name: string }
interface Plan { id: number; product_id: number; plan_name: string }
interface Order {
  id: number;
  cpf: string;
  nome: string;
  email: string | null;
  whatsapp: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string | null;
  product_id: number | null;
  plan_id: number | null;
  comprovante: string | null;
  status: string;
  seller_name: string;
  product_name: string | null;
  plan_name: string | null;
  created_at: string;
}

interface KanbanColumnDef {
  id: string;
  label: string;
  headerClass: string;
  bodyClass: string;
}

interface Props {
  column: KanbanColumnDef;
  orders: Order[];
  products: Product[];
  plans: Plan[];
}

export function KanbanColumn({ column, orders, products, plans }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex w-64 shrink-0 flex-col">
      {/* Column header */}
      <div className={cn("rounded-t-lg px-3 py-2 flex items-center justify-between", column.headerClass)}>
        <span className="text-sm font-semibold">{column.label}</span>
        <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-medium">
          {orders.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 min-h-[300px] rounded-b-lg p-2 flex flex-col gap-2 transition-colors duration-150",
          column.bodyClass,
          isOver && "ring-2 ring-inset ring-primary/50"
        )}
      >
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            products={products}
            plans={plans}
          />
        ))}
        {orders.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-xs text-muted-foreground/40">Sem pedidos</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6.2: Run lint check**

```bash
pnpm lint
```

- [ ] **Step 6.3: Commit**

```bash
git add components/pedidos/kanban-column.tsx
git commit -m "feat: add droppable kanban column"
```

---

### Task 7: Kanban Board (DndContext)

**Files:**
- Create: `components/pedidos/kanban-board.tsx`

- [ ] **Step 7.1: Create kanban board component**

```tsx
// components/pedidos/kanban-board.tsx
"use client";

import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KanbanColumn } from "./kanban-column";
import { OrderCard } from "./order-card";
import { OrderFormDialog } from "./order-form-dialog";
import { updateOrderStatusAction } from "@/lib/actions/orders-actions";

interface Product { id: number; name: string }
interface Plan { id: number; product_id: number; plan_name: string }
interface Order {
  id: number;
  cpf: string;
  nome: string;
  email: string | null;
  whatsapp: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string | null;
  product_id: number | null;
  plan_id: number | null;
  comprovante: string | null;
  status: string;
  seller_name: string;
  product_name: string | null;
  plan_name: string | null;
  created_at: string;
}

const KANBAN_COLUMNS = [
  {
    id: "reportados",
    label: "Reportados",
    headerClass: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
    bodyClass: "bg-blue-500/5",
  },
  {
    id: "enviados",
    label: "Enviados",
    headerClass: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
    bodyClass: "bg-purple-500/5",
  },
  {
    id: "saiu_para_entrega",
    label: "Saiu para Entrega",
    headerClass: "bg-orange-500/20 text-orange-700 dark:text-orange-300",
    bodyClass: "bg-orange-500/5",
  },
  {
    id: "retirar_nos_correios",
    label: "Retirar nos Correios",
    headerClass: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300",
    bodyClass: "bg-yellow-500/5",
  },
  {
    id: "requer_atencao",
    label: "Requer Atenção",
    headerClass: "bg-red-500/20 text-red-700 dark:text-red-300",
    bodyClass: "bg-red-500/5",
  },
  {
    id: "entregues",
    label: "Entregues",
    headerClass: "bg-green-500/20 text-green-700 dark:text-green-300",
    bodyClass: "bg-green-500/5",
  },
  {
    id: "inadimplencias",
    label: "Inadimplências",
    headerClass: "bg-rose-800/20 text-rose-800 dark:text-rose-300",
    bodyClass: "bg-rose-800/5",
  },
  {
    id: "frustados",
    label: "Frustados",
    headerClass: "bg-gray-500/20 text-gray-600 dark:text-gray-300",
    bodyClass: "bg-gray-500/5",
  },
  {
    id: "pagos",
    label: "Pagos",
    headerClass: "bg-emerald-700/20 text-emerald-700 dark:text-emerald-300",
    bodyClass: "bg-emerald-700/5",
  },
] as const;

interface Props {
  initialOrders: Order[];
  products: Product[];
  plans: Plan[];
}

export function KanbanBoard({ initialOrders, products, plans }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [newOrderOpen, setNewOrderOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const order = orders.find((o) => o.id === event.active.id);
    setActiveOrder(order ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveOrder(null);

    if (!over) return;

    const orderId = active.id as number;
    const newStatus = over.id as string;
    const order = orders.find((o) => o.id === orderId);

    if (!order || order.status === newStatus) return;

    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    const result = await updateOrderStatusAction(orderId, newStatus);
    if ("error" in result) {
      // Revert on error
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: order.status } : o))
      );
      toast.error(result.error as string);
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Pedidos</h1>
          <p className="text-sm text-muted-foreground">{orders.length} pedido{orders.length !== 1 ? "s" : ""} no total</p>
        </div>
        <Button onClick={() => setNewOrderOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Pedido
        </Button>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              orders={orders.filter((o) => o.status === col.id)}
              products={products}
              plans={plans}
            />
          ))}
        </div>

        <DragOverlay>
          {activeOrder ? (
            <div className="rotate-2 opacity-90">
              <OrderCard order={activeOrder} products={products} plans={plans} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* New Order Dialog */}
      <OrderFormDialog
        open={newOrderOpen}
        onOpenChange={setNewOrderOpen}
        products={products}
        plans={plans}
      />
    </div>
  );
}
```

- [ ] **Step 7.2: Run lint check**

```bash
pnpm lint
```

- [ ] **Step 7.3: Commit**

```bash
git add components/pedidos/kanban-board.tsx
git commit -m "feat: add kanban board with DndContext and drag overlay"
```

---

## Chunk 3: Integration — Page + Sidebar

### Task 8: Pedidos page (Server Component)

**Files:**
- Create: `app/(dashboard)/pedidos/page.tsx`

- [ ] **Step 8.1: Create the page**

```tsx
// app/(dashboard)/pedidos/page.tsx
import { requireAuth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { KanbanBoard } from "@/components/pedidos/kanban-board";

export const metadata = {
  title: "Pedidos - AfterPay",
};

export default async function PedidosPage() {
  const session = await requireAuth();
  const isSeller = session.role === "SELLER";

  // Fetch orders — sellers see only their own
  const orders = isSeller
    ? await sql`
        SELECT
          o.*,
          u.name AS seller_name,
          pr.name AS product_name,
          pl.name AS plan_name
        FROM orders o
        JOIN users u ON u.id = o.seller_id
        LEFT JOIN products pr ON pr.id = o.product_id
        LEFT JOIN plans pl ON pl.id = o.plan_id
        WHERE o.seller_id = ${session.id}
        ORDER BY o.created_at DESC
      `
    : await sql`
        SELECT
          o.*,
          u.name AS seller_name,
          pr.name AS product_name,
          pl.name AS plan_name
        FROM orders o
        JOIN users u ON u.id = o.seller_id
        LEFT JOIN products pr ON pr.id = o.product_id
        LEFT JOIN plans pl ON pl.id = o.plan_id
        ORDER BY o.created_at DESC
      `;

  const products = await sql`SELECT id, name FROM products WHERE active = true ORDER BY name`;
  const plans = await sql`
    SELECT pl.id, pl.product_id, pl.name AS plan_name
    FROM plans pl
    WHERE pl.active = true
    ORDER BY pl.name
  `;

  return (
    <KanbanBoard
      initialOrders={orders as any}
      products={products as any}
      plans={plans as any}
    />
  );
}
```

- [ ] **Step 8.2: Run lint check**

```bash
pnpm lint
```

- [ ] **Step 8.3: Verify the page builds**

```bash
pnpm build 2>&1 | tail -20
```

Expected: Build completes without errors. If there are type errors, fix them before proceeding.

- [ ] **Step 8.4: Commit**

```bash
git add app/(dashboard)/pedidos/page.tsx
git commit -m "feat: add /pedidos server component page"
```

---

### Task 9: Add Pedidos to sidebar

**Files:**
- Modify: `components/app-sidebar.tsx`

- [ ] **Step 9.1: Add Package2 icon import and pedidos link to all 3 role arrays**

In `components/app-sidebar.tsx`, find the import line with lucide-react icons and add `Package2`:

```tsx
// Find this line (around line 14):
import {
  BarChart3,
  ShoppingCart,
  ...
  Gift,
} from "lucide-react";

// Add Package2 to the import list
```

Then add the link entry to each of the three arrays:

```tsx
// Add to adminLinks (after the existing entries, before roleta):
{ href: "/pedidos", label: "Pedidos", icon: Package2 },

// Add to cobrancaLinks:
{ href: "/pedidos", label: "Pedidos", icon: Package2 },

// Add to sellerLinks:
{ href: "/pedidos", label: "Pedidos", icon: Package2 },
```

**Exact edit for adminLinks** — find:
```tsx
  { href: "/users", label: "Usuarios", icon: Users },
  { href: "/roleta", label: "Roleta", icon: Gift },
```
Replace with:
```tsx
  { href: "/users", label: "Usuarios", icon: Users },
  { href: "/pedidos", label: "Pedidos", icon: Package2 },
  { href: "/roleta", label: "Roleta", icon: Gift },
```

**Exact edit for cobrancaLinks** — find:
```tsx
const cobrancaLinks = [
  { href: "/meu-desempenho", label: "Meu Desempenho", icon: LayoutDashboard },
  { href: "/cobranca", label: "Cobranca", icon: Banknote },
];
```
Replace with:
```tsx
const cobrancaLinks = [
  { href: "/meu-desempenho", label: "Meu Desempenho", icon: LayoutDashboard },
  { href: "/cobranca", label: "Cobranca", icon: Banknote },
  { href: "/pedidos", label: "Pedidos", icon: Package2 },
];
```

**Exact edit for sellerLinks** — find:
```tsx
const sellerLinks = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/sales", label: "Vendas", icon: ShoppingCart },
  { href: "/history", label: "Historico", icon: ClipboardList },
  { href: "/ranking", label: "Ranking", icon: Trophy },
];
```
Replace with:
```tsx
const sellerLinks = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/sales", label: "Vendas", icon: ShoppingCart },
  { href: "/history", label: "Historico", icon: ClipboardList },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/pedidos", label: "Pedidos", icon: Package2 },
];
```

- [ ] **Step 9.2: Run lint check**

```bash
pnpm lint
```

- [ ] **Step 9.3: Full build verification**

```bash
pnpm build 2>&1 | tail -30
```

Expected: Build completes successfully with no errors.

- [ ] **Step 9.4: Commit**

```bash
git add components/app-sidebar.tsx
git commit -m "feat: add Pedidos link to sidebar for all roles"
```

---

## Final Verification

- [ ] **Start dev server and verify manually**

```bash
pnpm dev
```

Checklist:
1. Log in as ADMIN_MASTER — "Pedidos" appears in sidebar → page loads with empty Kanban
2. Click "Novo Pedido" → form opens
3. Fill in CPF (mask applies), WhatsApp (mask applies), CEP (auto-fills address on blur)
4. Select Produto → Plano filters correctly
5. Attach a JPG/PNG comprovante → preview appears
6. Save → card appears in "Reportados" column
7. Drag card to another column → status updates (optimistic, no flash)
8. Hover card → Edit / View / Delete buttons appear
9. Log in as SELLER → only sees own orders
10. Log in as COBRANCA → sees all orders

- [ ] **Final commit if any fixes were made**

```bash
git add -A
git commit -m "fix: post-verification adjustments to pedidos kanban"
```
