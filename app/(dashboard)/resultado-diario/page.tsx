import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDailyResults } from "@/lib/kpi";
import { DailyResultsTable } from "@/components/resultado-diario/daily-results-table";

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
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  )
    .toISOString()
    .split("T")[0];

  const dateFrom = params.from || firstOfMonth;
  const dateTo = params.to || today;

  const rows = await getDailyResults(dateFrom, dateTo);

  return (
    <DailyResultsTable
      rows={rows}
      dateFrom={dateFrom}
      dateTo={dateTo}
    />
  );
}
