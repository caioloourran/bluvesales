import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { CommissionsClient } from "@/components/admin/commissions-client";

export const metadata = {
  title: "Comissoes - Admin",
};

export default async function CommissionsPage() {
  await requireAdmin();
  const sellers = await sql`SELECT id, name FROM users WHERE role = 'SELLER' ORDER BY name`;
  const plans = await sql`
    SELECT p.id, p.name as plan_name, pr.name as product_name
    FROM plans p JOIN products pr ON pr.id = p.product_id
    WHERE p.active = true ORDER BY pr.name, p.name
  `;
  const commissions = await sql`
    SELECT sc.*, u.name as seller_name, p.name as plan_name, pr.name as product_name
    FROM seller_commissions sc
    JOIN users u ON u.id = sc.seller_id
    JOIN plans p ON p.id = sc.plan_id
    JOIN products pr ON pr.id = p.product_id
    ORDER BY u.name, pr.name, p.name
  `;
  return (
    <CommissionsClient
      sellers={sellers}
      plans={plans}
      commissions={commissions}
    />
  );
}
