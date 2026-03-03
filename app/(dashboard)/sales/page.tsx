import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { SalesEntryForm } from "@/components/sales/sales-entry-form";

export const metadata = {
  title: "Vendas - Lancamento Diario",
};

interface Props {
  searchParams: Promise<{ date?: string; seller?: string }>;
}

export default async function SalesPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const today = new Date().toISOString().split("T")[0];
  const date = params.date || today;
  const isAdmin = session.role === "ADMIN_MASTER";
  const sellerId = isAdmin && params.seller ? Number(params.seller) : session.id;

  // Get all active plans with product name
  const plans = await sql`
    SELECT p.id, p.name as plan_name, pr.name as product_name, p.sale_price_gross
    FROM plans p
    JOIN products pr ON pr.id = p.product_id
    WHERE p.active = true
    ORDER BY pr.name, p.name
  `;

  // Get summary of already-saved entries for this seller and date (aggregated)
  const todaySummary = await sql`
    SELECT plan_id, SUM(quantity)::int as total_qty
    FROM daily_sales_entries
    WHERE date = ${date} AND seller_id = ${sellerId}
    GROUP BY plan_id
  `;

  // Get sellers list for admin
  let sellers: { id: number; name: string }[] = [];
  if (isAdmin) {
    const sellerRows = await sql`
      SELECT id, name FROM users WHERE role = 'SELLER' ORDER BY name
    `;
    sellers = sellerRows.map((r) => ({ id: r.id, name: r.name }));
  }

  return (
    <SalesEntryForm
      plans={plans}
      todaySummary={todaySummary}
      sellers={sellers}
      date={date}
      sellerId={sellerId}
      isAdmin={isAdmin}
    />
  );
}
