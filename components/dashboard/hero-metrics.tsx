"use client";

import { formatBRL, formatPercent, formatNumber } from "@/lib/format";
import type { KPIData, OrderStats } from "@/lib/kpi";
import { TrendingDown, DollarSign, AlertTriangle, ShoppingBag, BarChart2, Users, Zap } from "lucide-react";

interface HeroMetricsProps {
  kpis: KPIData;
  orderStats: OrderStats;
  isAdmin: boolean;
}

export function HeroMetrics({ kpis, orderStats, isAdmin }: HeroMetricsProps) {
  const leadsPerSchedule = kpis.salesQty > 0 ? kpis.leads / kpis.salesQty : null;

  if (!isAdmin) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Pedidos Agendados"
          value={formatNumber(kpis.salesQty)}
          sub="no periodo"
          accent="indigo"
          icon={<ShoppingBag className="h-5 w-5" />}
        />
        <MetricCard
          label="Fat. Agendado"
          value={formatBRL(kpis.grossValue)}
          sub="Total agendado"
          accent="blue"
          icon={<BarChart2 className="h-5 w-5" />}
        />
        <MetricCard
          label="Total de Leads"
          value={formatNumber(kpis.leads)}
          sub={`CPL: ${kpis.cpl !== null ? formatBRL(kpis.cpl) : "N/A"}`}
          accent="violet"
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          label="Leads p/ Agend."
          value={leadsPerSchedule !== null ? formatNumber(leadsPerSchedule, 1) : "\u2014"}
          sub={`${formatNumber(kpis.leads)} leads / ${formatNumber(kpis.salesQty)} agend.`}
          accent="orange"
          icon={<Zap className="h-5 w-5" />}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Gastos em Anuncios */}
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card p-5">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-rose-500/5" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Gastos em Anuncios
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-rose-500">
              {formatBRL(kpis.investment)}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {kpis.daysInPeriod > 0
                ? `${kpis.daysInPeriod} dia${kpis.daysInPeriod > 1 ? "s" : ""} registrado${kpis.daysInPeriod > 1 ? "s" : ""}`
                : "Nenhum registro"}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
            <TrendingDown className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Lucro (aprovados) */}
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card p-5">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/5" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Lucro
            </p>
            <p className={`mt-2 text-3xl font-bold tabular-nums ${kpis.approvedProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {formatBRL(kpis.approvedProfit)}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Somente pagamentos aprovados
            </p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpis.approvedProfit >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Taxa de Frustrados */}
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card p-5">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/5" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Taxa de Frustrados
            </p>
            <p className={`mt-2 text-3xl font-bold tabular-nums ${orderStats.frustradosRate > 0.3 ? "text-rose-500" : orderStats.frustradosRate > 0.15 ? "text-amber-500" : "text-foreground"}`}>
              {formatPercent(orderStats.frustradosRate)}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {formatNumber(orderStats.frustradosCount)} de {formatNumber(orderStats.totalOrders)} pedidos
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
  icon: React.ReactNode;
}) {
  const colors: Record<string, { bg: string; text: string; valueText: string }> = {
    indigo: { bg: "bg-indigo-500/10", text: "text-indigo-500", valueText: "text-foreground" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-500", valueText: "text-blue-500" },
    violet: { bg: "bg-violet-500/10", text: "text-violet-500", valueText: "text-foreground" },
    orange: { bg: "bg-orange-500/10", text: "text-orange-500", valueText: "text-orange-500" },
  };
  const c = colors[accent] || colors.indigo;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.bg} ${c.text}`}>
          {icon}
        </div>
      </div>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${c.valueText}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
