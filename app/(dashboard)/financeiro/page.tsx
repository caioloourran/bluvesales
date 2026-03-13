import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { calculateKPIs } from "@/lib/kpi";
import { getDateRange } from "@/lib/format";
import { getSellerWithdrawals, getSellerWithdrawnTotal } from "@/lib/actions/withdrawal-actions";
import { FinanceiroClient } from "@/components/financeiro/financeiro-client";

export const metadata = {
  title: "Financeiro - Comissoes",
};

export default async function FinanceiroPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "SELLER") redirect("/dashboard");

  // Get all-time KPIs for approved commission (use a wide date range)
  const allTimeRange = { from: "2020-01-01", to: new Date().toISOString().split("T")[0] };
  const kpis = await calculateKPIs(allTimeRange.from, allTimeRange.to, session.id);

  const withdrawals = await getSellerWithdrawals(session.id);
  const withdrawnTotal = await getSellerWithdrawnTotal(session.id);

  const availableBalance = Math.max(kpis.approvedCommission - withdrawnTotal, 0);

  return (
    <FinanceiroClient
      approvedCommission={kpis.approvedCommission}
      withdrawnTotal={withdrawnTotal}
      availableBalance={availableBalance}
      withdrawals={withdrawals}
    />
  );
}
