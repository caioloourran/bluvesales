"use client";

import { formatNumber } from "@/lib/format";
import type { FunnelData } from "@/lib/kpi";

interface Props {
  data: FunnelData;
}

export function DashFunnel({ data }: Props) {
  const total = data.total || 1;

  const steps = [
    { num: "1", label: "Pedidos cadastrados", val: data.total, dotClass: "bg-primary/10 text-primary" },
    { num: "2", label: "Em transito / enviados", val: data.enviados, dotClass: "bg-blue-500/10 text-blue-500" },
    { num: "3", label: "Produto entregue", val: data.entregues, dotClass: "bg-emerald-500/10 text-emerald-500" },
    { num: "4", label: "Em cobranca", val: data.cobrados, dotClass: "bg-amber-500/10 text-amber-500" },
    { num: "5", label: "Pagamento confirmado", val: data.pagos, dotClass: "bg-emerald-500/10 text-emerald-500" },
    { num: "!", label: "Inadimplentes", val: data.inadimplentes, dotClass: "bg-rose-500/10 text-rose-500", isNeg: true },
    { num: "\u2717", label: "Frustrados", val: data.frustrados, dotClass: "bg-rose-500/10 text-rose-500", isNeg: true },
  ];

  return (
    <div className="d-animate overflow-hidden rounded-2xl border border-border/60 bg-card p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-foreground">Funil de Cobranca</h3>
      </div>
      <div className="flex flex-col gap-[5px]">
        {steps.map((s) => {
          const pct = total > 0 ? (s.val / total) * 100 : 0;
          return (
            <div key={s.label} className="relative flex items-center gap-3 overflow-hidden rounded-lg bg-muted/40 px-3.5 py-[11px] transition-colors hover:bg-muted/60">
              <div className={`relative z-10 flex h-[22px] w-[22px] items-center justify-center rounded-md text-[10px] font-bold ${s.dotClass}`}>
                {s.num}
              </div>
              <span className="relative z-10 flex-1 text-[12.5px] text-muted-foreground">{s.label}</span>
              <span className={`relative z-10 text-[13.5px] font-semibold ${s.isNeg ? "text-rose-500" : "text-foreground"}`}>
                {formatNumber(s.val)}
              </span>
              <span className="relative z-10 w-9 text-right text-[10.5px] text-muted-foreground">
                {pct.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
