import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getSellerWithdrawals, getSellerWithdrawnTotal } from "@/lib/actions/withdrawal-actions";
import { FinanceiroClient } from "@/components/financeiro/financeiro-client";

export const metadata = {
  title: "Financeiro - Comissoes",
};

async function getSellerApprovedCommission(sellerId: number): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*) as qty, p.sale_price_gross, COALESCE(sc.percent, 0) as commission_pct
    FROM orders o
    JOIN plans p ON p.id = o.plan_id
    LEFT JOIN seller_commissions sc ON sc.seller_id = o.seller_id AND sc.plan_id = o.plan_id
    WHERE o.seller_id = ${sellerId} AND o.status = 'pagos'
    GROUP BY p.sale_price_gross, sc.percent
  `;
  let total = 0;
  for (const row of rows) {
    total += Number(row.qty) * Number(row.sale_price_gross) * (Number(row.commission_pct) / 100);
  }
  return total;
}

export default async function FinanceiroPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "SELLER") redirect("/dashboard");

  const [approvedCommission, withdrawals, withdrawnTotal] = await Promise.all([
    getSellerApprovedCommission(session.id),
    getSellerWithdrawals(session.id),
    getSellerWithdrawnTotal(session.id),
  ]);

  const availableBalance = Math.max(approvedCommission - withdrawnTotal, 0);

  return (
    <FinanceiroClient
      approvedCommission={approvedCommission}
      withdrawnTotal={withdrawnTotal}
      availableBalance={availableBalance}
      withdrawals={withdrawals}
    />
  );
}
