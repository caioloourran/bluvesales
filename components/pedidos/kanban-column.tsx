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
