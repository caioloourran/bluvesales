import { requireAdmin } from "@/lib/auth";
import { getSellerRankings } from "@/lib/kpi";
import { getDateRange } from "@/lib/format";
import { RankingClient } from "@/components/ranking/ranking-client";

export const metadata = {
  title: "Ranking de Vendedores",
};

interface Props {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}

export default async function RankingPage({ searchParams }: Props) {
  await requireAdmin();

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

  const rankings = await getSellerRankings(dateFrom, dateTo);

  return (
    <RankingClient
      rankings={rankings}
      period={period}
      dateFrom={dateFrom}
      dateTo={dateTo}
    />
  );
}
