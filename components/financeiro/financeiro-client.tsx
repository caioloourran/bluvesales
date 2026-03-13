"use client";

import { useState } from "react";
import { formatBRL } from "@/lib/format";
import { requestWithdrawal } from "@/lib/actions/withdrawal-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Wallet, BadgeCheck, ArrowDownToLine, Clock, Loader2, CircleCheck, CircleX } from "lucide-react";

interface Withdrawal {
  id: number;
  amount: string | number;
  status: string;
  admin_notes: string | null;
  requested_at: string;
  processed_at: string | null;
  paid_at: string | null;
}

interface Props {
  approvedCommission: number;
  withdrawnTotal: number;
  availableBalance: number;
  withdrawals: Withdrawal[];
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Aguardando Aprovação", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: <Clock className="h-3.5 w-3.5" /> },
  processing: { label: "Processando", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", icon: <Loader2 className="h-3.5 w-3.5" /> },
  paid: { label: "Pago", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: <CircleCheck className="h-3.5 w-3.5" /> },
  rejected: { label: "Rejeitado", color: "bg-rose-500/10 text-rose-500", icon: <CircleX className="h-3.5 w-3.5" /> },
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function FinanceiroClient({ approvedCommission, withdrawnTotal, availableBalance, withdrawals }: Props) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleWithdraw() {
    const val = parseFloat(amount.replace(",", "."));
    if (isNaN(val) || val <= 0) {
      toast.error("Informe um valor valido");
      return;
    }
    if (val > availableBalance) {
      toast.error("Valor excede o saldo disponivel");
      return;
    }
    setLoading(true);
    const result = await requestWithdrawal(val);
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Saque solicitado com sucesso!");
      setAmount("");
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Financeiro</h1>
        <p className="text-sm text-muted-foreground">Gerencie suas comissoes e solicite saques</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[10px] bg-emerald-500/10">
            <BadgeCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[1.4px] text-muted-foreground">
            Comissao Aprovada
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatBRL(approvedCommission)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Total acumulado</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[10px] bg-blue-500/10">
            <ArrowDownToLine className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[1.4px] text-muted-foreground">
            Total Sacado
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatBRL(withdrawnTotal)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Saques realizados</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary/10">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[1.4px] text-muted-foreground">
            Saldo Disponivel
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {formatBRL(availableBalance)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Disponivel para saque</p>
        </div>
      </div>

      {/* Withdraw form */}
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Solicitar Saque</h2>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Valor do saque (R$)
            </label>
            <Input
              type="text"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-10"
            />
          </div>
          <Button onClick={handleWithdraw} disabled={loading || availableBalance <= 0} className="h-10">
            {loading ? "Solicitando..." : "Solicitar Saque"}
          </Button>
        </div>
        {availableBalance <= 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Voce nao possui saldo disponivel para saque.
          </p>
        )}
      </div>

      {/* Withdrawal history */}
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Historico de Saques</h2>
        {withdrawals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum saque solicitado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60">
                  {["Data", "Valor", "Status", "Obs."].map((h) => (
                    <th key={h} className="px-3 pb-3 text-left text-[10px] font-semibold uppercase tracking-[1.2px] text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => {
                  const cfg = statusConfig[w.status] || statusConfig.pending;
                  return (
                    <tr key={w.id} className="border-b border-border/30 transition-colors hover:bg-muted/30">
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
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {w.admin_notes || "—"}
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
