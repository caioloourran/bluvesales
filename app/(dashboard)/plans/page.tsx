import { requireAdminOrAffiliate } from "@/lib/auth";
import { sql } from "@/lib/db";
import { PlansClient } from "@/components/admin/plans-client";
import { AffiliatePlansClient } from "@/components/affiliate/affiliate-plans-client";

export const metadata = {
  title: "Planos",
};

export default async function PlansPage() {
  const session = await requireAdminOrAffiliate();
  const isAffiliate = session.role === "AFFILIATE";

  const plans = await sql`
    SELECT p.*, pr.name as product_name
    FROM plans p
    JOIN products pr ON pr.id = p.product_id
    ORDER BY pr.name, p.name
  `;

  if (isAffiliate) {
    const checkouts = await sql`
      SELECT plan_id, payt_checkout_id
      FROM affiliate_plan_checkouts
      WHERE affiliate_id = ${session.id}
    `;
    const checkoutMap: Record<number, string> = {};
    for (const row of checkouts) {
      checkoutMap[row.plan_id] = row.payt_checkout_id;
    }
    return <AffiliatePlansClient plans={plans as any} checkoutMap={checkoutMap} />;
  }

  const products = await sql`SELECT id, name FROM products WHERE active = true ORDER BY name`;
  return <PlansClient plans={plans as any} products={products as any} />;
}
