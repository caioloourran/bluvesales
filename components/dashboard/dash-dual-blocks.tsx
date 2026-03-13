"use client";

import { formatBRL, formatNumber, formatPercent } from "@/lib/format";
import type { KPIData } from "@/lib/kpi";
import { Calendar, CheckSquare } from "lucide-react";

interface Props {
  kpis: KPIData;
}

export function DashDualBlocks({ kpis }: Props) {
  const scheduledRoas = kpis.investment > 0 ? kpis.grossValue / kpis.investment : 0;
  const scheduledCpa = kpis.salesQty > 0 ? kpis.investment / kpis.salesQty : null;
  const approvedRoas = kpis.investment > 0 ? kpis.approvedRevenue / kpis.investment : 0;
  const approvedCpa = kpis.approvedCount > 0 ? kpis.investment / kpis.approvedCount : null;
  const leadsPerSchedule = kpis.salesQty > 0 ? kpis.leads / kpis.salesQty : null;
  const conversionRate = kpis.salesQty > 0 ? kpis.approvedCount / kpis.salesQty : 0;
  const ticketMedio = kpis.approvedCount > 0 ? kpis.approvedRevenue / kpis.approvedCount : 0;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Agendado */}
      <div className="d-animate overflow-hidden rounded-2xl border border-border/60 bg-card p-6" style={{ animationDelay: "0.2s" }}>
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
            <Calendar className="h-4 w-4" />
          </div>
          <h3 className="text-[15px] font-semibold text-foreground">Agendado</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MiniKpi label="Faturamento Agendado" value={formatBRL(kpis.grossValue)} sub="Total agendado" valueClass="text-blue-600 dark:text-blue-400" />
          <MiniKpi label="ROAS Agendado" value={`${formatNumber(scheduledRoas, 2)}x`} sub={`Fat: ${formatBRL(kpis.grossValue)}`} valueClass="text-amber-600 dark:text-amber-400" />
          <MiniKpi label="CPA de Agendamento" value={scheduledCpa !== null ? formatBRL(scheduledCpa) : "\u2014"} sub={`${formatNumber(kpis.salesQty)} agendamentos`} />
          <MiniKpi label="Agendamentos" value={formatNumber(kpis.salesQty)} sub="no periodo" />
          <MiniKpi label="Lucro Estimado" value={formatBRL(kpis.profit)} sub="Se todos pagarem" valueClass={kpis.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"} />
          <MiniKpi label="Leads p/ Agendamento" value={leadsPerSchedule !== null ? formatNumber(leadsPerSchedule, 1) : "\u2014"} sub={`${formatNumber(kpis.leads)} leads / ${formatNumber(kpis.salesQty)} agend.`} valueClass="text-primary" />
        </div>
      </div>

      {/* Aprovado */}
      <div className="d-animate overflow-hidden rounded-2xl border border-border/60 bg-card p-6" style={{ animationDelay: "0.24s" }}>
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <CheckSquare className="h-4 w-4" />
          </div>
          <h3 className="text-[15px] font-semibold text-foreground">Aprovado</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MiniKpi label="Faturamento Aprovado" value={formatBRL(kpis.approvedRevenue)} sub="Pag. aprovados (R$)" valueClass="text-emerald-600 dark:text-emerald-400" />
          <MiniKpi label="ROAS Aprovado" value={`${formatNumber(approvedRoas, 2)}x`} sub={`Pag: ${formatBRL(kpis.approvedRevenue)}`} valueClass="text-amber-600 dark:text-amber-400" />
          <MiniKpi label="CPA de Aprovados" value={approvedCpa !== null ? formatBRL(approvedCpa) : "\u2014"} sub={`${formatNumber(kpis.approvedCount)} aprovados`} valueClass="text-orange-600 dark:text-orange-400" />
          <MiniKpi label="Pag. Aprovados" value={formatNumber(kpis.approvedCount)} sub="no periodo" />
          <MiniKpi label="Taxa Conversao" value={formatPercent(conversionRate)} sub={`${formatNumber(kpis.approvedCount)} / ${formatNumber(kpis.salesQty)} agendados`} valueClass="text-emerald-600 dark:text-emerald-400" />
          <MiniKpi label="Ticket Medio" value={formatBRL(ticketMedio)} sub="por aprovado" valueClass="text-primary" />
        </div>
      </div>
    </div>
  );
}

function MiniKpi({ label, value, sub, valueClass }: {
  label: string; value: string; sub: string; valueClass?: string;
}) {
  return (
    <div className="rounded-[10px] border border-border/40 bg-muted/30 px-3.5 py-4">
      <p className="text-[9.5px] font-semibold uppercase leading-snug tracking-[1.2px] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 text-xl font-bold leading-none tracking-tight ${valueClass || "text-foreground"}`}>
        {value}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}
