"use client";

import { Suspense } from "react";
import { PeriodFilter } from "./period-filter";
import { DashTopKpis } from "./dash-top-kpis";
import { DashDualBlocks } from "./dash-dual-blocks";
import { DashAfterPay } from "./dash-afterpay";
import { DashRevenueChart } from "./dash-revenue-chart";
import { DashFunnel } from "./dash-funnel";
import { DashPerformance } from "./dash-performance";
import { DashPaymentRing } from "./dash-payment-ring";
import type {
  KPIData, OrderStats, StateRanking, WeeklyData,
  SellerRanking, CobrancaPerformance, DailyMetric,
  FunnelData, AgingBucket,
} from "@/lib/kpi";

interface DashboardClientProps {
  kpis: KPIData;
  orderStats: OrderStats;
  stateRanking: StateRanking[];
  weeklyData: WeeklyData[];
  sellerRankings: SellerRanking[];
  cobrancaPerf: CobrancaPerformance[];
  dailyMetrics: DailyMetric[];
  funnelData: FunnelData;
  agingData: AgingBucket[];
  period: string;
  dateFrom: string;
  dateTo: string;
  isAdmin: boolean;
}

export function DashboardClient({
  kpis,
  orderStats,
  weeklyData,
  sellerRankings,
  cobrancaPerf,
  dailyMetrics,
  funnelData,
  period,
  dateFrom,
  dateTo,
  isAdmin,
}: DashboardClientProps) {
  return (
    <div className="flex flex-col gap-7">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground shadow-md shadow-primary/20">
            B
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Bluve Nutrition
            </h1>
            <p className="mt-px text-xs text-muted-foreground">
              Central de Operacoes — Performance & AfterPay
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="d-blink inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Ao vivo
          </div>
          <Suspense>
            <PeriodFilter period={period} dateFrom={dateFrom} dateTo={dateTo} />
          </Suspense>
        </div>
      </div>

      {/* Section: Performance Comercial */}
      <SectionLabel dotClass="bg-primary" label="Performance Comercial" />
      <DashTopKpis kpis={kpis} orderStats={orderStats} isAdmin={isAdmin} />
      {isAdmin && <DashDualBlocks kpis={kpis} />}

      {/* Section: AfterPay */}
      {isAdmin && (
        <>
          <SectionLabel dotClass="bg-emerald-500" label="AfterPay — Cobranca & Recebimentos" />
          <DashAfterPay kpis={kpis} orderStats={orderStats} funnelData={funnelData} weeklyData={weeklyData} />
        </>
      )}

      {/* Main Grid: Chart + Funnel */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[5fr_3fr]">
        <DashRevenueChart dailyMetrics={dailyMetrics} />
        <DashFunnel data={funnelData} />
      </div>

      {/* Bottom Grid: Performance + Ring (admin only) */}
      {isAdmin && (sellerRankings.length > 0 || cobrancaPerf.length > 0) && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <DashPerformance sellers={sellerRankings} cobranca={cobrancaPerf} />
          <DashPaymentRing funnelData={funnelData} kpis={kpis} />
        </div>
      )}

      {/* Footer */}
      <footer className="flex flex-col items-center justify-between gap-2 border-t border-border/60 pt-5 text-[11px] text-muted-foreground sm:flex-row">
        <span>Bluve Nutrition — Central de Operacoes</span>
        <span>Periodo: {dateFrom} a {dateTo}</span>
      </footer>
    </div>
  );
}

function SectionLabel({ dotClass, label }: { dotClass: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`h-2 w-2 rounded-[3px] ${dotClass}`} />
      <h2 className="text-sm font-semibold text-foreground">{label}</h2>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  );
}
