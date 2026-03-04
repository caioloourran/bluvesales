import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { HistoryClient } from "@/components/sales/history-client";
import { todayBrazil, firstOfMonthBrazil } from "@/lib/format";

export const metadata = {
  title: "Historico de Lancamentos",
};

interface Props {
  searchParams: Promise<{
    from?: string;
    to?: string;
    seller?: string;
  }>;
}

export default async function HistoryPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const isAdmin = session.role === "ADMIN_MASTER";
  const dateFrom = params.from || firstOfMonthBrazil();
  const dateTo = params.to || todayBrazil();
  const filterSeller = isAdmin && params.seller ? Number(params.seller) : null;

  let entries;
  if (isAdmin) {
    if (filterSeller) {
      entries = await sql`
        SELECT 
          dse.id, dse.date, dse.quantity, dse.discount, dse.notes, dse.payment_method, dse.created_at,
          p.name as plan_name, pr.name as product_name,
          p.sale_price_gross,
          u.name as seller_name, u.id as seller_id
        FROM daily_sales_entries dse
        JOIN plans p ON p.id = dse.plan_id
        JOIN products pr ON pr.id = p.product_id
        JOIN users u ON u.id = dse.seller_id
        WHERE dse.date >= ${dateFrom} AND dse.date <= ${dateTo} AND dse.seller_id = ${filterSeller}
        ORDER BY dse.date DESC, u.name, pr.name, p.name
      `;
    } else {
      entries = await sql`
        SELECT 
          dse.id, dse.date, dse.quantity, dse.discount, dse.notes, dse.payment_method, dse.created_at,
          p.name as plan_name, pr.name as product_name,
          p.sale_price_gross,
          u.name as seller_name, u.id as seller_id
        FROM daily_sales_entries dse
        JOIN plans p ON p.id = dse.plan_id
        JOIN products pr ON pr.id = p.product_id
        JOIN users u ON u.id = dse.seller_id
        WHERE dse.date >= ${dateFrom} AND dse.date <= ${dateTo}
        ORDER BY dse.date DESC, u.name, pr.name, p.name
      `;
    }
  } else {
    entries = await sql`
      SELECT
        dse.id, dse.date, dse.quantity, dse.discount, dse.notes, dse.payment_method, dse.created_at,
        p.name as plan_name, pr.name as product_name,
        p.sale_price_gross,
        u.name as seller_name, u.id as seller_id
      FROM daily_sales_entries dse
      JOIN plans p ON p.id = dse.plan_id
      JOIN products pr ON pr.id = p.product_id
      JOIN users u ON u.id = dse.seller_id
      WHERE dse.date >= ${dateFrom} AND dse.date <= ${dateTo} AND dse.seller_id = ${session.id}
      ORDER BY dse.date DESC, pr.name, p.name
    `;
  }

  let sellers: { id: number; name: string }[] = [];
  if (isAdmin) {
    const sellerRows = await sql`SELECT id, name FROM users WHERE role = 'SELLER' ORDER BY name`;
    sellers = sellerRows.map((r) => ({ id: r.id, name: r.name }));
  }

  return (
    <HistoryClient
      entries={entries}
      sellers={sellers}
      isAdmin={isAdmin}
      dateFrom={dateFrom}
      dateTo={dateTo}
      filterSeller={filterSeller}
    />
  );
}
