"use client";

import { Suspense } from "react";
import { PeriodFilter } from "./period-filter";
import { DashTopKpis } from "./dash-top-kpis";
import { DashDualBlocks } from "./dash-dual-blocks";
import { DashAfterPay } from "./dash-afterpay";
import { DashRevenueChart } from "./dash-revenue-chart";
import { DashFunnel } from "./dash-funnel";
import { DashPerformance } from "./dash-performance";
import { DashAging } from "./dash-aging";
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
  stateRanking,
  weeklyData,
  sellerRankings,
  cobrancaPerf,
  dailyMetrics,
  funnelData,
  agingData,
  period,
  dateFrom,
  dateTo,
  isAdmin,
}: DashboardClientProps) {
  return (
    <div className="dash-dark -m-4 lg:-m-6 min-h-full">
      <div className="relative min-h-full" style={{ background: "var(--d-base)" }}>
        {/* Ambient orbs */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div
            className="absolute -right-[100px] -top-[180px] h-[500px] w-[500px] rounded-full opacity-35"
            style={{ filter: "blur(120px)", background: "radial-gradient(circle, rgba(52,211,153,0.08), transparent 70%)" }}
          />
          <div
            className="absolute -left-[80px] bottom-[-150px] h-[400px] w-[400px] rounded-full opacity-35"
            style={{ filter: "blur(120px)", background: "radial-gradient(circle, rgba(96,165,250,0.06), transparent 70%)" }}
          />
          <div
            className="absolute left-1/2 top-[40%] h-[300px] w-[300px] rounded-full opacity-35"
            style={{ filter: "blur(120px)", background: "radial-gradient(circle, rgba(167,139,250,0.04), transparent 70%)" }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-[1520px] px-5 pb-12 lg:px-9">
          {/* Header */}
          <header className="flex flex-col gap-4 border-b py-7 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--d-border)" }}>
            <div className="flex items-center gap-3.5">
              <div
                className="flex h-[42px] w-[42px] items-center justify-center rounded-xl text-xl font-medium"
                style={{
                  background: "linear-gradient(135deg, #34D399 0%, #22D3EE 100%)",
                  color: "#080A0F",
                  boxShadow: "0 0 32px rgba(52,211,153,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
              >
                B
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--d-t100)", letterSpacing: "-0.02em" }}>
                  Bluve Nutrition
                </h1>
                <p className="mt-px text-xs" style={{ color: "var(--d-t400)" }}>
                  Central de Operacoes — Performance & AfterPay
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <div
                className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium"
                style={{ background: "var(--d-green-s)", color: "var(--d-green)", border: "1px solid rgba(52,211,153,0.12)" }}
              >
                <span className="d-blink inline-block h-1.5 w-1.5 rounded-full" style={{ background: "var(--d-green)" }} />
                Ao vivo
              </div>
              <Suspense>
                <PeriodFilter period={period} dateFrom={dateFrom} dateTo={dateTo} />
              </Suspense>
            </div>
          </header>

          <div className="mt-8 flex flex-col gap-7">
            {/* Section: Performance Comercial */}
            <SectionLabel color="var(--d-red)" label="Performance Comercial" />
            <DashTopKpis kpis={kpis} orderStats={orderStats} isAdmin={isAdmin} />

            {isAdmin && <DashDualBlocks kpis={kpis} />}

            {/* Section: AfterPay */}
            {isAdmin && (
              <>
                <SectionLabel color="var(--d-green)" label="AfterPay — Cobranca & Recebimentos" />
                <DashAfterPay kpis={kpis} orderStats={orderStats} funnelData={funnelData} weeklyData={weeklyData} />
              </>
            )}

            {/* Main Grid: Chart + Funnel */}
            {isAdmin && (
              <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-[5fr_3fr]">
                <DashRevenueChart dailyMetrics={dailyMetrics} />
                <DashFunnel data={funnelData} />
              </div>
            )}

            {/* Bottom Grid: Performance + Ring + Aging */}
            {isAdmin && (
              <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-3">
                <DashPerformance sellers={sellerRankings} cobranca={cobrancaPerf} />
                <DashPaymentRing funnelData={funnelData} kpis={kpis} />
                <DashAging data={agingData} />
              </div>
            )}

            {/* Seller view - simplified */}
            {!isAdmin && (
              <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-[5fr_3fr]">
                <DashRevenueChart dailyMetrics={dailyMetrics} />
                <DashFunnel data={funnelData} />
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="mt-12 flex flex-col items-center justify-between gap-2 border-t py-5 text-[11px] sm:flex-row" style={{ borderColor: "var(--d-border)", color: "var(--d-t500)" }}>
            <span>Bluve Nutrition — Central de Operacoes</span>
            <span>Periodo: {dateFrom} a {dateTo}</span>
          </footer>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-2 w-2 rounded-[3px]" style={{ background: color }} />
      <h2 className="text-sm font-semibold" style={{ color: "var(--d-t100)", letterSpacing: "-0.01em" }}>
        {label}
      </h2>
      <div className="h-px flex-1" style={{ background: "var(--d-border)" }} />
    </div>
  );
}
