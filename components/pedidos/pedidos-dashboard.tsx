// components/pedidos/pedidos-dashboard.tsx
"use client";

import { useState, useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, ChevronDown, ChevronUp, Pencil, Trash2, MessageCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { OrderFormDialog } from "./order-form-dialog";
import { deleteOrderAction, updateOrderSubStatusAction } from "@/lib/actions/orders-actions";
import { cn } from "@/lib/utils";

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
  status_envio: string | null;
  status_plataforma: string | null;
  status_pagamento: string | null;
  seller_name: string;
  product_name: string | null;
  plan_name: string | null;
  created_at: string;
}

const STAGES = [
  { key: "todos", label: "Todos", color: "text-zinc-400", dot: "bg-zinc-400", pill: "bg-zinc-500/10", tabActive: "border-zinc-400 bg-zinc-800/50" },
  { key: "reportados", label: "Cadastrados", color: "text-blue-400", dot: "bg-blue-400", pill: "bg-blue-500/15", tabActive: "border-blue-400 bg-blue-950/60" },
  { key: "enviados", label: "Enviados", color: "text-purple-400", dot: "bg-purple-400", pill: "bg-purple-500/15", tabActive: "border-purple-400 bg-purple-950/60" },
  { key: "saiu_para_entrega", label: "Saiu p/ Entrega", color: "text-orange-400", dot: "bg-orange-400", pill: "bg-orange-500/15", tabActive: "border-orange-400 bg-orange-950/60" },
  { key: "retirar_nos_correios", label: "Retirar Correios", color: "text-yellow-400", dot: "bg-yellow-400", pill: "bg-yellow-500/15", tabActive: "border-yellow-400 bg-yellow-950/60" },
  { key: "requer_atencao", label: "Requer Atenção", color: "text-red-400", dot: "bg-red-400", pill: "bg-red-500/15", tabActive: "border-red-400 bg-red-950/60" },
  { key: "entregues", label: "Entregues", color: "text-green-400", dot: "bg-green-400", pill: "bg-green-500/15", tabActive: "border-green-400 bg-green-950/60" },
  { key: "cobrados", label: "Cobrados", color: "text-amber-400", dot: "bg-amber-400", pill: "bg-amber-500/15", tabActive: "border-amber-400 bg-amber-950/60" },
  { key: "pagos", label: "Pagos", color: "text-emerald-400", dot: "bg-emerald-400", pill: "bg-emerald-500/15", tabActive: "border-emerald-400 bg-emerald-950/60" },
  { key: "inadimplencias", label: "Inadimplências", color: "text-rose-500", dot: "bg-rose-500", pill: "bg-rose-500/15", tabActive: "border-rose-500 bg-rose-950/60" },
  { key: "frustrados", label: "Frustrados", color: "text-zinc-500", dot: "bg-zinc-500", pill: "bg-zinc-500/15", tabActive: "border-zinc-500 bg-zinc-800/50" },
] as const;

const STAGE_MAP = new Map(STAGES.map(s => [s.key, s]));

const PER_PAGE_OPTIONS = [15, 30, 50];

type SortField = "id" | "nome" | "product_name" | "created_at" | "status";

interface Props {
  initialOrders: Order[];
  products: Product[];
  plans: Plan[];
}

export function PedidosDashboard({ initialOrders, products, plans }: Props) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeStage, setActiveStage] = useState("todos");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Dialogs
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Order | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  // Stage counts
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { todos: orders.length };
    STAGES.forEach(s => { if (s.key !== "todos") counts[s.key] = 0; });
    orders.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });
    return counts;
  }, [orders]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = orders;
    if (activeStage !== "todos") list = list.filter(o => o.status === activeStage);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.nome.toLowerCase().includes(q) ||
        o.whatsapp.includes(q) ||
        (o.product_name?.toLowerCase().includes(q) ?? false) ||
        String(o.id).includes(q) ||
        o.cpf.includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      const av = a[sortField] ?? "";
      const bv = b[sortField] ?? "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [orders, activeStage, search, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  function handleStageChange(key: string) {
    setActiveStage(key);
    setPage(1);
    setExpandedRow(null);
  }

  function handleOrderSuccess() {
    setNewOrderOpen(false);
    setEditOrder(null);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteOrderAction(deleteTarget.id);
    setDeleting(false);
    if ("error" in result) {
      toast.error(result.error as string);
    } else {
      toast.success("Pedido excluído!");
      setOrders(prev => prev.filter(o => o.id !== deleteTarget.id));
      setDeleteTarget(null);
      setExpandedRow(null);
    }
  }

  async function handleSubStatusChange(field: "status_envio" | "status_plataforma" | "status_pagamento", value: string) {
    if (!statusTarget) return;
    setStatusSaving(true);
    const result = await updateOrderSubStatusAction(statusTarget.id, { [field]: value });
    setStatusSaving(false);
    if ("error" in result) {
      toast.error(result.error as string);
    } else {
      toast.success("Status atualizado!");
      setOrders(prev => prev.map(o =>
        o.id === statusTarget.id
          ? { ...o, [field]: value, ...(result.newMainStatus ? { status: result.newMainStatus } : {}) }
          : o
      ));
      setStatusTarget(prev => prev ? { ...prev, [field]: value, ...(result.newMainStatus ? { status: result.newMainStatus } : {}) } : null);
    }
  }

  function openWhatsApp(order: Order) {
    const raw = order.whatsapp.replace(/\D/g, "");
    const phone = raw.length <= 11 ? `55${raw}` : raw;
    window.open(`https://wa.me/${phone}`, "_blank");
  }

  function formatDate(dateStr: string) {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="ml-1 inline h-3 w-3 opacity-30" />;
    return sortDir === "asc"
      ? <ChevronUp className="ml-1 inline h-3 w-3" />
      : <ChevronDown className="ml-1 inline h-3 w-3" />;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {orders.length} pedido{orders.length !== 1 ? "s" : ""} no total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar nome, telefone, ID..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-64 pl-9 text-sm"
            />
          </div>
          <Button onClick={() => setNewOrderOpen(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Cadastrar Pedido
          </Button>
        </div>
      </div>

      {/* Stage Tabs */}
      <div className="flex gap-1.5 overflow-x-auto border-b border-border px-4 py-3 sm:px-6">
        {STAGES.map(s => {
          const isActive = activeStage === s.key;
          const count = stageCounts[s.key] ?? 0;
          const hasOrders = count > 0;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => handleStageChange(s.key)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                isActive
                  ? `${s.tabActive} border-current`
                  : "border-transparent text-muted-foreground hover:bg-accent"
              )}
            >
              <span className={cn(isActive ? s.color : "text-muted-foreground")}>
                {s.label}
              </span>
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                isActive || hasOrders
                  ? `${s.pill} ${s.color}`
                  : "bg-muted text-muted-foreground"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Desktop Table */}
      <div className="flex-1 overflow-auto px-4 sm:px-6">
        <table className="hidden w-full border-collapse md:table">
          <thead>
            <tr className="border-b border-border">
              {([
                ["id", "#", "w-16"],
                ["nome", "Cliente", ""],
                ["product_name", "Produto", ""],
                [null, "Plano", ""],
                ["created_at", "Pedido Em", ""],
                [null, "Telefone", ""],
                ["status", "Etapa", ""],
                [null, "", "w-10"],
              ] as const).map(([field, label, width], i) => (
                <th
                  key={i}
                  onClick={field ? () => handleSort(field as SortField) : undefined}
                  className={cn(
                    "sticky top-0 z-10 bg-card px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
                    field && "cursor-pointer hover:text-foreground",
                    width
                  )}
                >
                  {label}
                  {field && <SortIcon field={field as SortField} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr>
                <td colSpan={8} className="py-16 text-center text-sm text-muted-foreground">
                  Nenhum pedido encontrado
                </td>
              </tr>
            )}
            {paginated.map(order => {
              const stageInfo = STAGE_MAP.get(order.status);
              const isExpanded = expandedRow === order.id;
              return (
                <Fragment key={order.id}>
                  <tr
                    onClick={() => setExpandedRow(isExpanded ? null : order.id)}
                    className={cn(
                      "cursor-pointer border-b border-border/50 transition-colors hover:bg-accent/30",
                      isExpanded && "bg-accent/20"
                    )}
                  >
                    <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{order.id}</td>
                    <td className="px-3 py-3 text-sm font-semibold">{order.nome}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{order.product_name ?? "—"}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{order.plan_name ?? "—"}</td>
                    <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{formatDate(order.created_at)}</td>
                    <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{order.whatsapp}</td>
                    <td className="px-3 py-3">
                      {stageInfo && (
                        <span className={cn("inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-semibold", stageInfo.pill, stageInfo.color)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", stageInfo.dot)} />
                          {stageInfo.label}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={8} className="border-b border-border p-0">
                        <div className="flex flex-wrap items-start gap-8 bg-card/80 px-5 py-4">
                          <div className="min-w-[200px] flex-1">
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Detalhes do Pedido</p>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p><span className="text-muted-foreground/60">CPF:</span> {order.cpf}</p>
                              <p><span className="text-muted-foreground/60">E-mail:</span> {order.email || "—"}</p>
                              <p><span className="text-muted-foreground/60">Vendedor:</span> {order.seller_name}</p>
                              <p>
                                <span className="text-muted-foreground/60">Endereço:</span>{" "}
                                {order.rua}, {order.numero}{order.complemento ? ` - ${order.complemento}` : ""} — {order.bairro}, {order.cidade}/{order.estado} — CEP {order.cep}
                              </p>
                            </div>
                          </div>
                          {order.comprovante && (
                            <div>
                              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Comprovante</p>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={order.comprovante} alt="Comprovante" className="max-h-28 rounded-lg border object-contain" />
                            </div>
                          )}
                          <div className="flex flex-wrap items-start gap-2 pt-5">
                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setStatusTarget(order); }}>
                              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                              Editar Status
                            </Button>
                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openWhatsApp(order); }}>
                              <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                              WhatsApp
                            </Button>
                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setEditOrder(order); }}>
                              <Pencil className="mr-1.5 h-3.5 w-3.5" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(order); }}
                            >
                              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>

        {/* Mobile Cards */}
        <div className="flex flex-col gap-2 py-3 md:hidden">
          {paginated.length === 0 && (
            <p className="py-16 text-center text-sm text-muted-foreground">Nenhum pedido encontrado</p>
          )}
          {paginated.map(order => {
            const stageInfo = STAGE_MAP.get(order.status);
            const isExpanded = expandedRow === order.id;
            return (
              <div
                key={order.id}
                className="rounded-lg border border-border bg-card p-4"
                onClick={() => setExpandedRow(isExpanded ? null : order.id)}
              >
                <div className="mb-2 flex items-start justify-between">
                  <span className="text-sm font-semibold">{order.nome}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">#{order.id}</span>
                </div>
                <p className="mb-2 text-xs text-muted-foreground">
                  {order.product_name ?? "—"} &middot; {order.plan_name ?? "—"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {stageInfo && (
                    <span className={cn("inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-semibold", stageInfo.pill, stageInfo.color)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", stageInfo.dot)} />
                      {stageInfo.label}
                    </span>
                  )}
                </div>
                {isExpanded && (
                  <div className="mt-3 space-y-2 border-t border-border pt-3">
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>CPF: {order.cpf}</p>
                      <p>WhatsApp: {order.whatsapp}</p>
                      <p>Vendedor: {order.seller_name}</p>
                      <p>Data: {formatDate(order.created_at)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setStatusTarget(order); }}>
                        <RefreshCw className="mr-1 h-3 w-3" /> Status
                      </Button>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openWhatsApp(order); }}>
                        <MessageCircle className="mr-1 h-3 w-3" /> WhatsApp
                      </Button>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setEditOrder(order); }}>
                        <Pencil className="mr-1 h-3 w-3" /> Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive/50 text-destructive hover:bg-destructive/10"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(order); }}
                      >
                        <Trash2 className="mr-1 h-3 w-3" /> Excluir
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Exibindo</span>
          <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(1); }}>
            <SelectTrigger className="h-8 w-[70px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PER_PAGE_OPTIONS.map(n => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>de <strong className="text-foreground">{filtered.length}</strong> pedidos</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-xs"
            disabled={safePage <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            ‹
          </Button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 7) {
              pageNum = i + 1;
            } else if (safePage <= 4) {
              pageNum = i + 1;
            } else if (safePage >= totalPages - 3) {
              pageNum = totalPages - 6 + i;
            } else {
              pageNum = safePage - 3 + i;
            }
            return (
              <Button
                key={pageNum}
                variant={safePage === pageNum ? "default" : "outline"}
                size="icon"
                className="h-8 w-8 font-mono text-xs"
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-xs"
            disabled={safePage >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            ›
          </Button>
        </div>
      </div>

      {/* New Order Dialog */}
      <OrderFormDialog
        open={newOrderOpen}
        onOpenChange={setNewOrderOpen}
        products={products}
        plans={plans}
        onSuccess={handleOrderSuccess}
      />

      {/* Edit Order Dialog */}
      {editOrder && (
        <OrderFormDialog
          open={!!editOrder}
          onOpenChange={(open) => { if (!open) setEditOrder(null); }}
          products={products}
          plans={plans}
          order={editOrder}
          onSuccess={handleOrderSuccess}
        />
      )}

      {/* Status Editor Dialog */}
      <AlertDialog open={!!statusTarget} onOpenChange={(open) => { if (!open) setStatusTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Editar Status — Pedido #{statusTarget?.id}</AlertDialogTitle>
            <AlertDialogDescription>
              {statusTarget?.nome}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            {/* Status de Envio */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status de Envio</label>
              <Select
                value={statusTarget?.status_envio ?? ""}
                onValueChange={(v) => handleSubStatusChange("status_envio", v)}
                disabled={statusSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entregue">Entregue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status da Plataforma */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status da Plataforma</label>
              <Select
                value={statusTarget?.status_plataforma ?? ""}
                onValueChange={(v) => handleSubStatusChange("status_plataforma", v)}
                disabled={statusSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cobrado">Cobrado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status de Pagamento */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status de Pagamento</label>
              <Select
                value={statusTarget?.status_pagamento ?? ""}
                onValueChange={(v) => handleSubStatusChange("status_pagamento", v)}
                disabled={statusSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pedido #{deleteTarget?.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              Pedido de <strong>{deleteTarget?.nome}</strong> será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
