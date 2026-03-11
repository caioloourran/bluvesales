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
