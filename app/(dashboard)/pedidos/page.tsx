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
  const isAffiliate = session.role === "AFFILIATE";

  // Fetch orders — sellers see only their own, affiliates see their sellers' orders
  let orders;
  if (isSeller) {
    orders = await sql`
      SELECT o.*, u.name AS seller_name, pr.name AS product_name, pl.name AS plan_name
      FROM orders o
      JOIN users u ON u.id = o.seller_id
      LEFT JOIN products pr ON pr.id = o.product_id
      LEFT JOIN plans pl ON pl.id = o.plan_id
      WHERE o.seller_id = ${session.id}
      ORDER BY o.created_at DESC
    `;
  } else if (isAffiliate) {
    orders = await sql`
      SELECT o.*, u.name AS seller_name, pr.name AS product_name, pl.name AS plan_name
      FROM orders o
      JOIN users u ON u.id = o.seller_id
      LEFT JOIN products pr ON pr.id = o.product_id
      LEFT JOIN plans pl ON pl.id = o.plan_id
      WHERE u.affiliate_id = ${session.id} OR o.seller_id = ${session.id}
      ORDER BY o.created_at DESC
    `;
  } else {
    orders = await sql`
      SELECT o.*, u.name AS seller_name, pr.name AS product_name, pl.name AS plan_name
      FROM orders o
      JOIN users u ON u.id = o.seller_id
      LEFT JOIN products pr ON pr.id = o.product_id
      LEFT JOIN plans pl ON pl.id = o.plan_id
      ORDER BY o.created_at DESC
    `;
  }

  // Fetch sellers for filter
  let sellers: any[] = [];
  if (isAffiliate) {
    sellers = await sql`SELECT id, name FROM users WHERE affiliate_id = ${session.id} AND role = 'SELLER' ORDER BY name`;
  } else if (!isSeller) {
    sellers = await sql`SELECT id, name FROM users WHERE role = 'SELLER' ORDER BY name`;
  }

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
      userRole={session.role}
    />
  );
}
