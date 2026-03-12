// app/(dashboard)/pedidos/page.tsx
import { requireAuth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { PedidosDashboard } from "@/components/pedidos/pedidos-dashboard";

export const metadata = {
  title: "Pedidos - AfterPay",
};

export default async function PedidosPage() {
  const session = await requireAuth();
  const isSeller = session.role === "SELLER";

  // Fetch orders — sellers see only their own
  const orders = isSeller
    ? await sql`
        SELECT
          o.*,
          u.name AS seller_name,
          pr.name AS product_name,
          pl.name AS plan_name
        FROM orders o
        JOIN users u ON u.id = o.seller_id
        LEFT JOIN products pr ON pr.id = o.product_id
        LEFT JOIN plans pl ON pl.id = o.plan_id
        WHERE o.seller_id = ${session.id}
        ORDER BY o.created_at DESC
      `
    : await sql`
        SELECT
          o.*,
          u.name AS seller_name,
          pr.name AS product_name,
          pl.name AS plan_name
        FROM orders o
        JOIN users u ON u.id = o.seller_id
        LEFT JOIN products pr ON pr.id = o.product_id
        LEFT JOIN plans pl ON pl.id = o.plan_id
        ORDER BY o.created_at DESC
      `;

  // Fetch sellers for filter (only for non-sellers)
  const sellers = isSeller
    ? []
    : await sql`SELECT id, name FROM users WHERE role = 'SELLER' ORDER BY name`;

  const products = await sql`SELECT id, name FROM products WHERE active = true ORDER BY name`;
  const plans = await sql`
    SELECT pl.id, pl.product_id, pl.name AS plan_name, pl.payt_checkout_id
    FROM plans pl
    WHERE pl.active = true
    ORDER BY pl.name
  `;

  return (
    <PedidosDashboard
      initialOrders={orders as any}
      products={products as any}
      plans={plans as any}
      sellers={sellers as any}
    />
  );
}
