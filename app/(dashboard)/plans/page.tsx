import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { PlansClient } from "@/components/admin/plans-client";

export const metadata = {
  title: "Planos - Admin",
};

export default async function PlansPage() {
  await requireAdmin();
  const plans = await sql`
    SELECT p.*, pr.name as product_name
    FROM plans p
    JOIN products pr ON pr.id = p.product_id
    ORDER BY pr.name, p.name
  `;
  const products = await sql`SELECT id, name FROM products WHERE active = true ORDER BY name`;
  return <PlansClient plans={plans} products={products} />;
}
