import { requireAuth } from "@/lib/auth";
import { getSellerRankings } from "@/lib/kpi";
import { sql } from "@/lib/db";
import { todayBrazil, firstOfMonthBrazil } from "@/lib/format";
import { RankingClient } from "@/components/ranking/ranking-client";

export const metadata = {
  title: "Ranking de Vendedores",
};

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function RankingPage({ searchParams }: Props) {
  const session = await requireAuth();

  const params = await searchParams;
  const tab = params.tab === "today" ? "today" : "month";

  const today = todayBrazil();
  const dateFrom = tab === "today" ? today : firstOfMonthBrazil();
  const dateTo = today;

  const rankings = await getSellerRankings(dateFrom, dateTo);

  const settingsRows = await sql`SELECT team_goal FROM ranking_settings WHERE id = 1`;
  const teamGoal = Number(settingsRows[0]?.team_goal ?? 0);

  const isAdmin = session.role === "ADMIN_MASTER";

  return (
    <RankingClient
      rankings={rankings}
      tab={tab}
      isAdmin={isAdmin}
      currentUserId={session.id}
      teamGoal={teamGoal}
    />
  );
}
