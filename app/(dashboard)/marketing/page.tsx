import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { MarketingClient } from "@/components/admin/marketing-client";

export const metadata = {
  title: "Marketing - Admin",
};

export default async function MarketingPage() {
  await requireAdmin();
  const metrics = await sql`
    SELECT dam.*, u.name as seller_name 
    FROM daily_ad_metrics dam 
    LEFT JOIN users u ON u.id = dam.seller_id
    ORDER BY dam.date DESC LIMIT 90
  `;
  const sellers = await sql`SELECT id, name FROM users WHERE role = 'SELLER' ORDER BY name`;
  return <MarketingClient metrics={metrics} sellers={sellers} />;
}
