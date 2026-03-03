import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { ApprovedEntryForm } from "@/components/cobranca/approved-entry-form";

export const metadata = {
  title: "Cobranca - Pagamentos Aprovados",
};

interface Props {
  searchParams: Promise<{ date?: string }>;
}

export default async function CobrancaPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN_MASTER") redirect("/dashboard");

  const params = await searchParams;
  const today = new Date().toISOString().split("T")[0];
  const date = params.date || today;

  // Get all active plans with product name
  const plans = await sql`
    SELECT p.id, p.name as plan_name, pr.name as product_name, p.sale_price_gross
    FROM plans p
    JOIN products pr ON pr.id = p.product_id
    WHERE p.active = true
    ORDER BY pr.name, p.name
  `;

  // Get summary of already-saved approved entries for this date (global, no seller filter)
  const todaySummary = await sql`
    SELECT plan_id, payment_method, SUM(quantity)::int as total_qty
    FROM daily_approved_payments
    WHERE date = ${date}
    GROUP BY plan_id, payment_method
  `;

  return (
    <ApprovedEntryForm
      plans={plans}
      todaySummary={todaySummary}
      date={date}
    />
  );
}
