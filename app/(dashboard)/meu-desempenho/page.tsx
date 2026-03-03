import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { DesempenhoClient } from "@/components/cobranca/desempenho-client";

export const metadata = {
  title: "Meu Desempenho - Cobranca",
};

interface Props {
  searchParams: Promise<{ from?: string; to?: string }>;
}

const COMMISSION_RATE = 0.01; // 1%

export default async function MeuDesempenhoPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN_MASTER" && session.role !== "COBRANCA") redirect("/dashboard");

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

  // Breakdown by plan — filtered by the current user's own entries
  const planRows = await sql`
    SELECT
      p.id as plan_id,
      p.name as plan_name,
      pr.name as product_name,
      p.sale_price_gross,
      SUM(dap.quantity)::int as total_qty,
      SUM(dap.quantity * p.sale_price_gross) as total_revenue
    FROM daily_approved_payments dap
    JOIN plans p ON p.id = dap.plan_id
    JOIN products pr ON pr.id = p.product_id
    WHERE dap.date >= ${dateFrom} AND dap.date <= ${dateTo}
      AND dap.created_by = ${session.id}
    GROUP BY p.id, p.name, pr.name, p.sale_price_gross
    ORDER BY total_revenue DESC
  `;

  const rows = planRows.map((r) => ({
    planId: Number(r.plan_id),
    planName: String(r.plan_name),
    productName: String(r.product_name),
    salePriceGross: Number(r.sale_price_gross),
    totalQty: Number(r.total_qty),
    totalRevenue: Number(r.total_revenue),
    commission: Number(r.total_revenue) * COMMISSION_RATE,
  }));

  const totals = rows.reduce(
    (acc, r) => ({
      qty: acc.qty + r.totalQty,
      revenue: acc.revenue + r.totalRevenue,
      commission: acc.commission + r.commission,
    }),
    { qty: 0, revenue: 0, commission: 0 }
  );

  return (
    <DesempenhoClient
      rows={rows}
      totals={totals}
      dateFrom={dateFrom}
      dateTo={dateTo}
      userName={session.name}
      commissionRate={COMMISSION_RATE}
    />
  );
}
