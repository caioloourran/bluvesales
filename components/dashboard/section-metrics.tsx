"use client";

import { formatBRL, formatNumber } from "@/lib/format";
import type { KPIData } from "@/lib/kpi";

interface SectionMetricsProps {
  kpis: KPIData;
}

export function SectionMetrics({ kpis }: SectionMetricsProps) {
  const scheduledRoas = kpis.investment > 0 ? kpis.grossValue / kpis.investment : 0;
  const scheduledCpa = kpis.salesQty > 0 ? kpis.investment / kpis.salesQty : null;
  const approvedRoas = kpis.investment > 0 ? kpis.approvedRevenue / kpis.investment : 0;
  const approvedCpa = kpis.approvedCount > 0 ? kpis.investment / kpis.approvedCount : null;
  const leadsPerSchedule = kpis.salesQty > 0 ? kpis.leads / kpis.salesQty : null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* AGENDADO */}
      <div className="rounded-xl border border-border/60 bg-card">
        <div className="flex items-center gap-2.5 border-b border-border/40 px-5 py-3.5">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <h2 className="text-sm font-semibold text-foreground">Agendado</h2>
        </div>
        <div className="grid grid-cols-2 gap-px bg-border/30 sm:grid-cols-3">
          <SectionCell
            label="Faturamento"
            value={formatBRL(kpis.grossValue)}
            valueColor="text-blue-500"
          />
          <SectionCell
            label="ROAS"
            value={`${formatNumber(scheduledRoas, 2)}x`}
            valueColor="text-amber-500"
            sub={`Inv: ${formatBRL(kpis.investment)}`}
          />
          <SectionCell
            label="CPA"
            value={scheduledCpa !== null ? formatBRL(scheduledCpa) : "\u2014"}
            sub={`${formatNumber(kpis.salesQty)} agendamentos`}
          />
          <SectionCell
            label="Agendamentos"
            value={formatNumber(kpis.salesQty)}
          />
          <SectionCell
            label="Lucro Estimado"
            value={formatBRL(kpis.profit)}
            valueColor={kpis.profit >= 0 ? "text-emerald-500" : "text-rose-500"}
            sub="Se todos pagarem"
          />
          <SectionCell
            label="Leads p/ Agend."
            value={leadsPerSchedule !== null ? formatNumber(leadsPerSchedule, 1) : "\u2014"}
            valueColor="text-orange-500"
            sub={`${formatNumber(kpis.leads)} leads`}
          />
        </div>
      </div>

      {/* APROVADO */}
      <div className="rounded-xl border border-border/60 bg-card">
        <div className="flex items-center gap-2.5 border-b border-border/40 px-5 py-3.5">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <h2 className="text-sm font-semibold text-foreground">Aprovado</h2>
        </div>
        <div className="grid grid-cols-2 gap-px bg-border/30">
          <SectionCell
            label="Faturamento"
            value={formatBRL(kpis.approvedRevenue)}
            valueColor="text-emerald-500"
          />
          <SectionCell
            label="ROAS"
            value={`${formatNumber(approvedRoas, 2)}x`}
            valueColor="text-amber-500"
            sub={`Pag: ${formatBRL(kpis.approvedRevenue)}`}
          />
          <SectionCell
            label="CPA"
            value={approvedCpa !== null ? formatBRL(approvedCpa) : "\u2014"}
            valueColor="text-orange-500"
            sub={`${formatNumber(kpis.approvedCount)} aprovados`}
          />
          <SectionCell
            label="Pag. Aprovados"
            value={formatNumber(kpis.approvedCount)}
          />
        </div>
      </div>
    </div>
  );
}

function SectionCell({
  label,
  value,
  valueColor,
  sub,
}: {
  label: string;
  value: string;
  valueColor?: string;
  sub?: string;
}) {
  return (
    <div className="bg-card px-4 py-3.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1.5 text-lg font-bold tabular-nums ${valueColor || "text-foreground"}`}>
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}
