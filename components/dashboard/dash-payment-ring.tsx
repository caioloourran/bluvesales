"use client";

import { formatBRL, formatPercent } from "@/lib/format";
import type { FunnelData, KPIData } from "@/lib/kpi";

interface Props {
  funnelData: FunnelData;
  kpis: KPIData;
}

export function DashPaymentRing({ funnelData, kpis }: Props) {
  const total = funnelData.total || 1;
  const confirmadoPct = funnelData.pagos / total;
  const cobradosPct = funnelData.cobrados / total;
  const inadPct = funnelData.inadimplentes / total;
  const outroPct = Math.max(1 - confirmadoPct - cobradosPct - inadPct, 0);

  const circumference = 2 * Math.PI * 48;
  const segments = [
    { pct: confirmadoPct, cls: "stroke-emerald-500", label: "Confirmado", value: formatBRL(kpis.approvedRevenue), dotCls: "bg-emerald-500" },
    { pct: cobradosPct, cls: "stroke-amber-500", label: "Pendente", value: formatBRL(Math.max(kpis.grossValue - kpis.approvedRevenue, 0)), dotCls: "bg-amber-500" },
    { pct: inadPct, cls: "stroke-rose-500", label: "Inadimplente", value: formatPercent(inadPct), dotCls: "bg-rose-500" },
    { pct: outroPct, cls: "stroke-primary", label: "Outros", value: formatPercent(outroPct), dotCls: "bg-primary" },
  ];

  let offset = 0;

  return (
    <div className="d-animate overflow-hidden rounded-2xl border border-border/60 bg-card p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-foreground">Status de Pagamentos</h3>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative h-[130px] w-[130px] shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r="48" fill="none" className="stroke-muted" strokeWidth="11" />
            {segments.map((seg, i) => {
              const dashLength = seg.pct * circumference;
              const currentOffset = offset;
              offset += dashLength;
              return (
                <circle
                  key={i}
                  cx="60" cy="60" r="48"
                  fill="none"
                  className={seg.cls}
                  strokeWidth="11"
                  strokeDasharray={`${dashLength} ${circumference}`}
                  strokeDashoffset={-currentOffset}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[28px] font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {(confirmadoPct * 100).toFixed(0)}%
            </span>
            <span className="text-[10px] text-muted-foreground">confirmado</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className={`h-2 w-2 shrink-0 rounded-[3px] ${seg.dotCls}`} />
              <span className="flex-1">{seg.label}</span>
              <span className="min-w-[55px] text-right font-semibold text-foreground">{seg.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
