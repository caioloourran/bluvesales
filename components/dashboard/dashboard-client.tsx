"use client";

import { Suspense } from "react";
import { PeriodFilter } from "./period-filter";
import { HeroMetrics } from "./hero-metrics";
import { SectionMetrics } from "./section-metrics";
import { WeeklyChart } from "./weekly-chart";
import { StatesRanking } from "./states-ranking";
import { PerformanceVendedor } from "./performance-vendedor";
import { PerformanceCobranca } from "./performance-cobranca";
import { DailyChart } from "./daily-chart";
import type { KPIData, OrderStats, StateRanking, WeeklyData, SellerRanking, CobrancaPerformance, DailyMetric } from "@/lib/kpi";

interface DashboardClientProps {
  kpis: KPIData;
  orderStats: OrderStats;
  stateRanking: StateRanking[];
  weeklyData: WeeklyData[];
  sellerRankings: SellerRanking[];
  cobrancaPerf: CobrancaPerformance[];
  dailyMetrics: DailyMetric[];
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
  period,
  dateFrom,
  dateTo,
  isAdmin,
}: DashboardClientProps) {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Visao geral da performance comercial
          </p>
        </div>
        <Suspense>
          <PeriodFilter period={period} dateFrom={dateFrom} dateTo={dateTo} />
        </Suspense>
      </div>

      {/* Hero Metrics - Top 3 */}
      <HeroMetrics kpis={kpis} orderStats={orderStats} isAdmin={isAdmin} />

      {/* Agendado & Aprovado Sections */}
      {isAdmin && <SectionMetrics kpis={kpis} />}

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <WeeklyChart data={weeklyData} />
        </div>
        <div className="xl:col-span-2">
          <StatesRanking data={stateRanking} />
        </div>
      </div>

      {/* Daily Chart */}
      <DailyChart data={dailyMetrics} isAdmin={isAdmin} />

      {/* Performance Tables (admin only) */}
      {isAdmin && sellerRankings.length > 0 && (
        <PerformanceVendedor rankings={sellerRankings} />
      )}
      {isAdmin && cobrancaPerf.length > 0 && (
        <PerformanceCobranca data={cobrancaPerf} />
      )}
    </div>
  );
}
