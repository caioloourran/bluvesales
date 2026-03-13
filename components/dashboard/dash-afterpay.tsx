"use client";

import { formatBRL, formatNumber, formatPercent } from "@/lib/format";
import type { KPIData, OrderStats, FunnelData, WeeklyData } from "@/lib/kpi";

interface Props {
  kpis: KPIData;
  orderStats: OrderStats;
  funnelData: FunnelData;
  weeklyData: WeeklyData[];
}

export function DashAfterPay({ kpis, orderStats, funnelData, weeklyData }: Props) {
  const inadimplenciaRate = funnelData.total > 0 ? funnelData.inadimplentes / funnelData.total : 0;
  const pendingValue = kpis.grossValue - kpis.approvedRevenue;
  const ticketMedio = kpis.approvedCount > 0 ? kpis.approvedRevenue / kpis.approvedCount : 0;

  // Sparkline data from weekly data
  const sparkAprovados = weeklyData.slice(-11).map(w => w.aprovados);
  const sparkMax = Math.max(...sparkAprovados, 1);

  return (
    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-5">
      {/* Receita Confirmada */}
      <div className="d-card d-animate relative overflow-hidden px-5 pb-4 pt-5" style={{ animationDelay: "0.28s" }}>
        <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: "linear-gradient(90deg, var(--d-green), transparent 80%)" }} />
        <p className="text-[10px] font-semibold uppercase tracking-[1.3px]" style={{ color: "var(--d-t400)" }}>Receita Confirmada</p>
        <p className="mt-2.5 text-[26px] font-bold leading-none" style={{ color: "var(--d-green)", letterSpacing: "-0.03em" }}>
          {formatBRL(kpis.approvedRevenue)}
        </p>
        <p className="mt-1.5 text-[11.5px]" style={{ color: "var(--d-t400)" }}>
          {formatNumber(kpis.approvedCount)} pagamentos
        </p>
        <div className="d-sparkline">
          {sparkAprovados.map((v, i) => (
            <div
              key={i}
              className="bar"
              style={{
                height: `${(v / sparkMax) * 100}%`,
                background: "var(--d-green)",
                opacity: 0.15 + (i / sparkAprovados.length) * 0.6,
              }}
            />
          ))}
        </div>
      </div>

      {/* Inadimplencia */}
      <div className="d-card d-animate relative overflow-hidden px-5 pb-4 pt-5" style={{ animationDelay: "0.32s" }}>
        <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: "linear-gradient(90deg, var(--d-red), transparent 80%)" }} />
        <p className="text-[10px] font-semibold uppercase tracking-[1.3px]" style={{ color: "var(--d-t400)" }}>Inadimplencia</p>
        <p className="mt-2.5 text-[26px] font-bold leading-none" style={{ color: "var(--d-red)", letterSpacing: "-0.03em" }}>
          {formatPercent(inadimplenciaRate)}
        </p>
        <p className="mt-1.5 text-[11.5px]" style={{ color: "var(--d-t400)" }}>
          {formatNumber(funnelData.inadimplentes)} inadimplentes
        </p>
        <div className="d-sparkline">
          {weeklyData.slice(-11).map((w, i) => {
            const rate = w.agendados > 0 ? w.frustrados / w.agendados : 0;
            return (
              <div
                key={i}
                className="bar"
                style={{
                  height: `${Math.max(rate * 300, 5)}%`,
                  background: "var(--d-red)",
                  opacity: 0.15 + (i / 11) * 0.35,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Cobrancas Pendentes */}
      <div className="d-card d-animate relative overflow-hidden px-5 pb-4 pt-5" style={{ animationDelay: "0.36s" }}>
        <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: "linear-gradient(90deg, var(--d-amber), transparent 80%)" }} />
        <p className="text-[10px] font-semibold uppercase tracking-[1.3px]" style={{ color: "var(--d-t400)" }}>Cobrancas Pendentes</p>
        <p className="mt-2.5 text-[26px] font-bold leading-none" style={{ color: "var(--d-amber)", letterSpacing: "-0.03em" }}>
          {formatBRL(Math.max(pendingValue, 0))}
        </p>
        <p className="mt-1.5 text-[11.5px]" style={{ color: "var(--d-t400)" }}>
          {formatNumber(funnelData.cobrados)} pedidos aguardando
        </p>
      </div>

      {/* Pedidos no Periodo */}
      <div className="d-card d-animate relative overflow-hidden px-5 pb-4 pt-5" style={{ animationDelay: "0.40s" }}>
        <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: "linear-gradient(90deg, var(--d-blue), transparent 80%)" }} />
        <p className="text-[10px] font-semibold uppercase tracking-[1.3px]" style={{ color: "var(--d-t400)" }}>Pedidos no Periodo</p>
        <p className="mt-2.5 text-[26px] font-bold leading-none" style={{ color: "var(--d-t100)", letterSpacing: "-0.03em" }}>
          {formatNumber(orderStats.totalOrders)}
        </p>
        <p className="mt-1.5 text-[11.5px]" style={{ color: "var(--d-t400)" }}>
          {formatNumber(orderStats.pagosCount)} pagos
        </p>
      </div>

      {/* Ticket Medio */}
      <div className="d-card d-animate relative overflow-hidden px-5 pb-4 pt-5" style={{ animationDelay: "0.44s" }}>
        <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: "linear-gradient(90deg, var(--d-purple), transparent 80%)" }} />
        <p className="text-[10px] font-semibold uppercase tracking-[1.3px]" style={{ color: "var(--d-t400)" }}>Ticket Medio</p>
        <p className="mt-2.5 text-[26px] font-bold leading-none" style={{ color: "var(--d-purple)", letterSpacing: "-0.03em" }}>
          {formatBRL(ticketMedio)}
        </p>
        <p className="mt-1.5 text-[11.5px]" style={{ color: "var(--d-t400)" }}>
          por aprovado
        </p>
      </div>
    </div>
  );
}
