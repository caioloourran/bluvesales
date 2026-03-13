"use client";

import { formatBRL, formatNumber, formatPercent } from "@/lib/format";
import type { KPIData, OrderStats } from "@/lib/kpi";
import { TrendingDown, Users, Percent, DollarSign, ShoppingBag, BarChart2, Zap, BadgeCheck } from "lucide-react";

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
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-5">
        <KpiCard label="Pedidos Agendados" value={formatNumber(kpis.salesQty)} sub="no periodo"
          icon={<ShoppingBag className="h-4 w-4" />} accentClass="text-primary bg-primary/10" delay={0} />
        <KpiCard label="Fat. Agendado" value={formatBRL(kpis.grossValue)} sub="Total agendado"
          icon={<BarChart2 className="h-4 w-4" />} accentClass="text-blue-500 bg-blue-500/10" valueClass="text-blue-600 dark:text-blue-400" delay={1} />
        <KpiCard label="Total de Leads" value={formatNumber(kpis.leads)} sub={`CPL: ${kpis.cpl !== null ? formatBRL(kpis.cpl) : "N/A"}`}
          icon={<Users className="h-4 w-4" />} accentClass="text-violet-500 bg-violet-500/10" delay={2} />
        <KpiCard label="Comissão Estimada" value={formatBRL(kpis.grossCommission)} sub="Baseado no fat. bruto"
          icon={<DollarSign className="h-4 w-4" />}
          accentClass={kpis.grossCommission >= 0 ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"}
          valueClass={kpis.grossCommission >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}
          barClass={kpis.grossCommission >= 0 ? "bg-emerald-500" : "bg-rose-500"}
          delay={3} />
        <KpiCard label="Comissão Aprovada" value={formatBRL(kpis.approvedCommission)} sub="Pagamentos confirmados"
          icon={<BadgeCheck className="h-4 w-4" />}
          accentClass="text-emerald-500 bg-emerald-500/10"
          valueClass="text-emerald-600 dark:text-emerald-400"
          barClass="bg-emerald-500"
          delay={4} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      <KpiCard
        label="Gastos em Anuncios"
        value={formatBRL(kpis.investment)}
        sub={kpis.daysInPeriod > 0 ? `${kpis.daysInPeriod} dia${kpis.daysInPeriod > 1 ? "s" : ""} registrado${kpis.daysInPeriod > 1 ? "s" : ""}` : "Nenhum registro"}
        icon={<TrendingDown className="h-4 w-4" />}
        accentClass="text-rose-500 bg-rose-500/10"
        valueClass="text-rose-500"
        barClass="bg-rose-500"
        delay={0}
      />
      <KpiCard
        label="Total de Leads"
        value={formatNumber(kpis.leads)}
        sub={`CPL medio: ${kpis.cpl !== null ? formatBRL(kpis.cpl) : "N/A"}`}
        icon={<Users className="h-4 w-4" />}
        accentClass="text-violet-500 bg-violet-500/10"
        barClass="bg-violet-500"
        delay={1}
      />
      <KpiCard
        label="Taxa Lead Pagamento"
        value={formatPercent(leadToPayment)}
        sub={kpis.daysInPeriod > 0 ? `${kpis.daysInPeriod} dia${kpis.daysInPeriod > 1 ? "s" : ""} registrado${kpis.daysInPeriod > 1 ? "s" : ""}` : "Nenhum registro"}
        icon={<Percent className="h-4 w-4" />}
        accentClass="text-amber-500 bg-amber-500/10"
        valueClass="text-amber-600 dark:text-amber-400"
        barClass="bg-amber-500"
        delay={2}
      />
      <KpiCard
        label="Lucro Total (Periodo)"
        value={formatBRL(kpis.approvedProfit)}
        sub="Somente pagamentos aprovados"
        icon={<DollarSign className="h-4 w-4" />}
        accentClass={kpis.approvedProfit >= 0 ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"}
        valueClass={kpis.approvedProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}
        barClass={kpis.approvedProfit >= 0 ? "bg-emerald-500" : "bg-rose-500"}
        delay={3}
      />
    </div>
  );
}

function KpiCard({
  label, value, sub, icon, accentClass, valueClass, barClass, delay,
}: {
  label: string; value: string; sub: string;
  icon: React.ReactNode; accentClass: string;
  valueClass?: string; barClass?: string; delay: number;
}) {
  return (
    <div
      className="d-animate relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all hover:border-border hover:shadow-sm"
      style={{ animationDelay: `${delay * 0.04}s` }}
    >
      {barClass && (
        <div className={`absolute bottom-0 left-0 top-0 w-[3px] rounded-r ${barClass}`} />
      )}
      <div className={`absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-[10px] ${accentClass}`}>
        {icon}
      </div>
      <p className="text-[10.5px] font-semibold uppercase tracking-[1.4px] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2.5 text-[28px] font-bold leading-none tracking-tight ${valueClass || "text-foreground"}`}>
        {value}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
