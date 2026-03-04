import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDailyResults } from "@/lib/kpi";
import { DailyResultsTable } from "@/components/resultado-diario/daily-results-table";
import { todayBrazil, firstOfMonthBrazil } from "@/lib/format";

export const metadata = {
  title: "Resultado Diario",
};

interface Props {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function ResultadoDiarioPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "COBRANCA") redirect("/cobranca");

  const params = await searchParams;
  const dateFrom = params.from || firstOfMonthBrazil();
  const dateTo = params.to || todayBrazil();

  const rows = await getDailyResults(dateFrom, dateTo);

  return (
    <DailyResultsTable
      rows={rows}
      dateFrom={dateFrom}
      dateTo={dateTo}
    />
  );
}
