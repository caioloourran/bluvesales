// components/pedidos/kanban-board.tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
    id: "cadastrados",
    label: "Cadastrados",
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
    id: "frustrados",
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

const VALID_COLUMN_IDS = new Set(KANBAN_COLUMNS.map((c) => c.id));

export function KanbanBoard({ initialOrders, products, plans }: Props) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const isMoving = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const order = orders.find((o) => o.id === Number(event.active.id));
    setActiveOrder(order ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveOrder(null);

    if (!over || isMoving.current) return;

    const orderId = Number(active.id);
    const newStatus = String(over.id);

    // Guard: only accept valid column ids as drop targets
    if (!VALID_COLUMN_IDS.has(newStatus as typeof KANBAN_COLUMNS[number]["id"])) return;

    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status === newStatus) return;

    isMoving.current = true;

    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    const result = await updateOrderStatusAction(orderId, newStatus);
    isMoving.current = false;

    if ("error" in result) {
      // Revert on error
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: order.status } : o))
      );
      toast.error(result.error ?? "Erro ao atualizar pedido");
    }
  }

  function handleNewOrderSuccess() {
    setNewOrderOpen(false);
    router.refresh();
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
        onSuccess={handleNewOrderSuccess}
      />
    </div>
  );
}
