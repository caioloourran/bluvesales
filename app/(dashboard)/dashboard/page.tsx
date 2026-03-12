import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  calculateKPIs,
  getOrderStats,
  getOrdersByState,
  getWeeklyChart,
  getSellerRankings,
  getCobrancaPerformance,
  getDailyMetrics,
} from "@/lib/kpi";
import { getDateRange } from "@/lib/format";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const metadata = {
  title: "Dashboard - Painel Comercial",
};

interface Props {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const period = params.period || "30d";
  let dateFrom: string;
  let dateTo: string;

  if (period === "custom" && params.from && params.to) {
    dateFrom = params.from;
    dateTo = params.to;
  } else {
    const range = getDateRange(period);
    dateFrom = range.from;
    dateTo = range.to;
  }

  const isSeller = session.role === "SELLER";
  const sellerId = isSeller ? session.id : undefined;

  const [kpis, orderStats, stateRanking, weeklyData, sellerRankings, cobrancaPerf, dailyMetrics] =
    await Promise.all([
      calculateKPIs(dateFrom, dateTo, sellerId),
      getOrderStats(dateFrom, dateTo, sellerId),
      getOrdersByState(dateFrom, dateTo, sellerId),
      getWeeklyChart(dateFrom, dateTo, sellerId),
      isSeller ? Promise.resolve([]) : getSellerRankings(dateFrom, dateTo),
      isSeller ? Promise.resolve([]) : getCobrancaPerformance(dateFrom, dateTo),
      getDailyMetrics(dateFrom, dateTo, sellerId),
    ]);

  return (
    <DashboardClient
      kpis={kpis}
      orderStats={orderStats}
      stateRanking={stateRanking}
      weeklyData={weeklyData}
      sellerRankings={sellerRankings}
      cobrancaPerf={cobrancaPerf}
      dailyMetrics={dailyMetrics}
      period={period}
      dateFrom={dateFrom}
      dateTo={dateTo}
      isAdmin={!isSeller}
    />
  );
}
