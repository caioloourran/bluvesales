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

  const sparkAprovados = weeklyData.slice(-11).map(w => w.aprovados);
  const sparkMax = Math.max(...sparkAprovados, 1);

  return (
    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-5">
      <ApCard delay={0} topColor="bg-emerald-500" label="Receita Confirmada"
        value={formatBRL(kpis.approvedRevenue)} valueClass="text-emerald-600 dark:text-emerald-400"
        sub={`${formatNumber(kpis.approvedCount)} pagamentos`}>
        <div className="d-sparkline">
          {sparkAprovados.map((v, i) => (
            <div key={i} className="bar rounded-sm bg-emerald-500" style={{ height: `${(v / sparkMax) * 100}%`, opacity: 0.15 + (i / sparkAprovados.length) * 0.6 }} />
          ))}
        </div>
      </ApCard>

      <ApCard delay={1} topColor="bg-rose-500" label="Inadimplencia"
        value={formatPercent(inadimplenciaRate)} valueClass="text-rose-500"
        sub={`${formatNumber(funnelData.inadimplentes)} inadimplentes`}>
        <div className="d-sparkline">
          {weeklyData.slice(-11).map((w, i) => {
            const rate = w.agendados > 0 ? w.frustrados / w.agendados : 0;
            return <div key={i} className="bar rounded-sm bg-rose-500" style={{ height: `${Math.max(rate * 300, 5)}%`, opacity: 0.15 + (i / 11) * 0.35 }} />;
          })}
        </div>
      </ApCard>

      <ApCard delay={2} topColor="bg-amber-500" label="Cobrancas Pendentes"
        value={formatBRL(Math.max(pendingValue, 0))} valueClass="text-amber-600 dark:text-amber-400"
        sub={`${formatNumber(funnelData.cobrados)} pedidos aguardando`} />

      <ApCard delay={3} topColor="bg-primary" label="Pedidos no Periodo"
        value={formatNumber(orderStats.totalOrders)} valueClass="text-foreground"
        sub={`${formatNumber(orderStats.pagosCount)} pagos`} />

      <ApCard delay={4} topColor="bg-violet-500" label="Ticket Medio"
        value={formatBRL(ticketMedio)} valueClass="text-violet-600 dark:text-violet-400"
        sub="por aprovado" />
    </div>
  );
}

function ApCard({
  delay, topColor, label, value, valueClass, sub, children,
}: {
  delay: number; topColor: string; label: string; value: string;
  valueClass: string; sub: string; children?: React.ReactNode;
}) {
  return (
    <div className="d-animate relative overflow-hidden rounded-2xl border border-border/60 bg-card px-5 pb-4 pt-5" style={{ animationDelay: `${0.28 + delay * 0.04}s` }}>
      <div className={`absolute inset-x-0 top-0 h-[2px] ${topColor}`} style={{ maskImage: "linear-gradient(90deg, black, transparent 80%)", WebkitMaskImage: "linear-gradient(90deg, black, transparent 80%)" }} />
      <p className="text-[10px] font-semibold uppercase tracking-[1.3px] text-muted-foreground">{label}</p>
      <p className={`mt-2.5 text-[26px] font-bold leading-none tracking-tight ${valueClass}`}>{value}</p>
      <p className="mt-1.5 text-[11.5px] text-muted-foreground">{sub}</p>
      {children}
    </div>
  );
}
