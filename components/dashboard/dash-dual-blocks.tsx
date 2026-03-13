"use client";

import { formatBRL, formatNumber, formatPercent } from "@/lib/format";
import type { KPIData } from "@/lib/kpi";

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
    <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
      {/* Agendado */}
      <div className="d-card d-animate overflow-hidden p-6" style={{ animationDelay: "0.2s" }}>
        <div className="mb-5 flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm"
            style={{ background: "var(--d-amber-s)", color: "var(--d-amber)" }}
          >
            📅
          </div>
          <h3 className="text-[15px] font-semibold" style={{ color: "var(--d-t100)" }}>Agendado</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MiniKpi label="Faturamento Agendado" value={formatBRL(kpis.grossValue)} sub="Total agendado" valueColor="var(--d-green)" />
          <MiniKpi label="ROAS Agendado" value={`${formatNumber(scheduledRoas, 2)}x`} sub={`Fat. agendado: ${formatBRL(kpis.grossValue)}`} valueColor="var(--d-amber)" />
          <MiniKpi label="CPA de Agendamento" value={scheduledCpa !== null ? formatBRL(scheduledCpa) : "\u2014"} sub={`${formatNumber(kpis.salesQty)} agendamentos`} />
          <MiniKpi label="Agendamentos" value={formatNumber(kpis.salesQty)} sub="no periodo" />
          <MiniKpi label="Lucro Estimado" value={formatBRL(kpis.profit)} sub="Se todos pagarem" valueColor={kpis.profit >= 0 ? "var(--d-green)" : "var(--d-red)"} />
          <MiniKpi label="Leads p/ Agendamento" value={leadsPerSchedule !== null ? formatNumber(leadsPerSchedule, 1) : "\u2014"} sub={`${formatNumber(kpis.leads)} leads / ${formatNumber(kpis.salesQty)} agend.`} valueColor="var(--d-cyan)" />
        </div>
      </div>

      {/* Aprovado */}
      <div className="d-card d-animate overflow-hidden p-6" style={{ animationDelay: "0.24s" }}>
        <div className="mb-5 flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm"
            style={{ background: "var(--d-green-s)", color: "var(--d-green)" }}
          >
            ✓
          </div>
          <h3 className="text-[15px] font-semibold" style={{ color: "var(--d-t100)" }}>Aprovado</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MiniKpi label="Faturamento Aprovado" value={formatBRL(kpis.approvedRevenue)} sub="Pag. aprovados (R$)" valueColor="var(--d-green)" />
          <MiniKpi label="ROAS Aprovado" value={`${formatNumber(approvedRoas, 2)}x`} sub={`Pag. aprovados: ${formatBRL(kpis.approvedRevenue)}`} valueColor="var(--d-amber)" />
          <MiniKpi label="CPA de Aprovados" value={approvedCpa !== null ? formatBRL(approvedCpa) : "\u2014"} sub={`${formatNumber(kpis.approvedCount)} aprovados`} valueColor="var(--d-orange)" />
          <MiniKpi label="Pag. Aprovados" value={formatNumber(kpis.approvedCount)} sub="no periodo" />
          <MiniKpi label="Taxa Conversao" value={formatPercent(conversionRate)} sub={`${formatNumber(kpis.approvedCount)} / ${formatNumber(kpis.salesQty)} agendados`} valueColor="var(--d-green)" />
          <MiniKpi label="Ticket Medio" value={formatBRL(ticketMedio)} sub="por aprovado" valueColor="var(--d-cyan)" />
        </div>
      </div>
    </div>
  );
}

function MiniKpi({ label, value, sub, valueColor }: {
  label: string; value: string; sub: string; valueColor?: string;
}) {
  return (
    <div className="rounded-[10px] border px-3.5 py-4" style={{ background: "var(--d-elevated)", borderColor: "var(--d-border)" }}>
      <p className="text-[9.5px] font-semibold uppercase leading-snug tracking-[1.2px]" style={{ color: "var(--d-t400)" }}>
        {label}
      </p>
      <p className="mt-2 text-xl font-bold leading-none" style={{ color: valueColor || "var(--d-t100)", letterSpacing: "-0.02em" }}>
        {value}
      </p>
      <p className="mt-1 text-[11px]" style={{ color: "var(--d-t400)" }}>{sub}</p>
    </div>
  );
}
