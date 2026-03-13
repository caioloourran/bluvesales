"use client";

import { formatBRL, formatNumber, formatPercent } from "@/lib/format";
import type { KPIData, OrderStats } from "@/lib/kpi";

interface Props {
  kpis: KPIData;
  orderStats: OrderStats;
  isAdmin: boolean;
}

export function DashTopKpis({ kpis, orderStats, isAdmin }: Props) {
  const leadToPayment = kpis.leads > 0 ? kpis.approvedCount / kpis.leads : 0;
  const leadsPerSchedule = kpis.salesQty > 0 ? kpis.leads / kpis.salesQty : null;

  if (!isAdmin) {
    return (
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <KpiCard
          label="Pedidos Agendados"
          value={formatNumber(kpis.salesQty)}
          sub="no periodo"
          accentColor="var(--d-blue)"
          accentBg="var(--d-blue-s)"
          icon="📋"
          delay={0}
        />
        <KpiCard
          label="Fat. Agendado"
          value={formatBRL(kpis.grossValue)}
          sub="Total agendado"
          accentColor="var(--d-green)"
          accentBg="var(--d-green-s)"
          icon="💰"
          delay={1}
        />
        <KpiCard
          label="Total de Leads"
          value={formatNumber(kpis.leads)}
          sub={`CPL: ${kpis.cpl !== null ? formatBRL(kpis.cpl) : "N/A"}`}
          accentColor="var(--d-purple)"
          accentBg="var(--d-purple-s)"
          icon="👥"
          delay={2}
        />
        <KpiCard
          label="Leads p/ Agend."
          value={leadsPerSchedule !== null ? formatNumber(leadsPerSchedule, 1) : "\u2014"}
          sub={`${formatNumber(kpis.leads)} leads / ${formatNumber(kpis.salesQty)} agend.`}
          accentColor="var(--d-cyan)"
          accentBg="rgba(34,211,238,0.1)"
          icon="\u26A1"
          delay={3}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      <KpiCard
        label="Gastos em Anuncios"
        value={formatBRL(kpis.investment)}
        sub={kpis.daysInPeriod > 0 ? `${kpis.daysInPeriod} dia${kpis.daysInPeriod > 1 ? "s" : ""} registrado${kpis.daysInPeriod > 1 ? "s" : ""}` : "Nenhum registro"}
        accentColor="var(--d-red)"
        accentBg="var(--d-red-s)"
        valueColor="var(--d-red)"
        icon="\uD83D\uDCE2"
        delay={0}
      />
      <KpiCard
        label="Total de Leads"
        value={formatNumber(kpis.leads)}
        sub={`CPL medio: ${kpis.cpl !== null ? formatBRL(kpis.cpl) : "N/A"}`}
        accentColor="var(--d-purple)"
        accentBg="var(--d-purple-s)"
        icon="\uD83D\uDC65"
        delay={1}
      />
      <KpiCard
        label="Taxa Lead \u2192 Pagamento"
        value={formatPercent(leadToPayment)}
        sub={kpis.daysInPeriod > 0 ? `${kpis.daysInPeriod} dia${kpis.daysInPeriod > 1 ? "s" : ""} registrado${kpis.daysInPeriod > 1 ? "s" : ""}` : "Nenhum registro"}
        accentColor="var(--d-amber)"
        accentBg="var(--d-amber-s)"
        valueColor="var(--d-amber)"
        icon="%"
        delay={2}
      />
      <KpiCard
        label="Lucro Total (Periodo)"
        value={formatBRL(kpis.approvedProfit)}
        sub="Somente pagamentos aprovados"
        accentColor={kpis.approvedProfit >= 0 ? "var(--d-green)" : "var(--d-red)"}
        accentBg={kpis.approvedProfit >= 0 ? "var(--d-green-s)" : "var(--d-red-s)"}
        valueColor={kpis.approvedProfit >= 0 ? "var(--d-green)" : "var(--d-red)"}
        icon="$"
        delay={3}
      />
    </div>
  );
}

function KpiCard({
  label, value, sub, accentColor, accentBg, valueColor, icon, delay,
}: {
  label: string; value: string; sub: string;
  accentColor: string; accentBg: string;
  valueColor?: string; icon: string; delay: number;
}) {
  return (
    <div
      className="d-card d-animate relative overflow-hidden px-6 py-5"
      style={{ animationDelay: `${delay * 0.04}s` }}
    >
      <div
        className="absolute bottom-0 left-0 top-0 w-[3px]"
        style={{ background: accentColor, borderRadius: "0 3px 3px 0" }}
      />
      <div
        className="absolute right-[18px] top-4 flex h-9 w-9 items-center justify-center rounded-[10px] text-base"
        style={{ background: accentBg, color: accentColor }}
      >
        {icon}
      </div>
      <p className="text-[10.5px] font-semibold uppercase tracking-[1.4px]" style={{ color: "var(--d-t400)" }}>
        {label}
      </p>
      <p
        className="mt-2.5 text-[28px] font-bold leading-none"
        style={{ color: valueColor || "var(--d-t100)", letterSpacing: "-0.03em" }}
      >
        {value}
      </p>
      <p className="mt-1.5 text-xs" style={{ color: "var(--d-t400)" }}>{sub}</p>
    </div>
  );
}
