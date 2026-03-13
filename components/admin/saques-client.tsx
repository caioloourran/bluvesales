"use client";

import { useState } from "react";
import { formatBRL } from "@/lib/format";
import { updateWithdrawalStatus } from "@/lib/actions/withdrawal-actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clock, Loader2, CircleCheck, CircleX, ArrowRight } from "lucide-react";

interface Withdrawal {
  id: number;
  amount: string | number;
  status: string;
  admin_notes: string | null;
  requested_at: string;
  processed_at: string | null;
  paid_at: string | null;
  seller_name: string;
  seller_id: number;
}

interface Props {
  withdrawals: Withdrawal[];
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Aguardando", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: <Clock className="h-3.5 w-3.5" /> },
  processing: { label: "Processando", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", icon: <Loader2 className="h-3.5 w-3.5" /> },
  paid: { label: "Pago", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: <CircleCheck className="h-3.5 w-3.5" /> },
  rejected: { label: "Rejeitado", color: "bg-rose-500/10 text-rose-500", icon: <CircleX className="h-3.5 w-3.5" /> },
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getNextStatus(current: string): { status: "processing" | "paid" | "rejected"; label: string } | null {
  if (current === "pending") return { status: "processing", label: "Processar" };
  if (current === "processing") return { status: "paid", label: "Marcar como Pago" };
  return null;
}

export function SaquesClient({ withdrawals }: Props) {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");

  async function handleStatusChange(id: number, status: "processing" | "paid" | "rejected") {
    setLoadingId(id);
    const result = await updateWithdrawalStatus({ id, status });
    setLoadingId(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Status atualizado para ${statusConfig[status]?.label || status}`);
    }
  }

  const filtered = filter === "all" ? withdrawals : withdrawals.filter((w) => w.status === filter);

  const pendingCount = withdrawals.filter((w) => w.status === "pending").length;
  const processingCount = withdrawals.filter((w) => w.status === "processing").length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Saques</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie solicitacoes de saque dos vendedores
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-amber-600 dark:text-amber-400">
              {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
            </span>
          )}
          {processingCount > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-blue-600 dark:text-blue-400">
              {processingCount} processando
            </span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { value: "all", label: "Todos" },
          { value: "pending", label: "Pendentes" },
          { value: "processing", label: "Processando" },
          { value: "paid", label: "Pagos" },
          { value: "rejected", label: "Rejeitados" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              filter === f.value
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma solicitacao encontrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60">
                  {["Vendedor", "Data", "Valor", "Status", "Acoes"].map((h) => (
                    <th key={h} className="px-3 pb-3 text-left text-[10px] font-semibold uppercase tracking-[1.2px] text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => {
                  const cfg = statusConfig[w.status] || statusConfig.pending;
                  const next = getNextStatus(w.status);
                  const isLoading = loadingId === w.id;
                  return (
                    <tr key={w.id} className="border-b border-border/30 transition-colors hover:bg-muted/30">
                      <td className="px-3 py-3 text-sm text-foreground font-medium">
                        {w.seller_name}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {formatDate(w.requested_at)}
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold text-foreground">
                        {formatBRL(Number(w.amount))}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${cfg.color}`}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          {next && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isLoading}
                              onClick={() => handleStatusChange(w.id, next.status)}
                              className="h-7 gap-1.5 text-xs"
                            >
                              <ArrowRight className="h-3 w-3" />
                              {isLoading ? "..." : next.label}
                            </Button>
                          )}
                          {w.status === "pending" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isLoading}
                              onClick={() => handleStatusChange(w.id, "rejected")}
                              className="h-7 text-xs text-rose-500 hover:text-rose-600"
                            >
                              Rejeitar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
