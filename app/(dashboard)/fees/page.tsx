import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { FeesClient } from "@/components/admin/fees-client";

export const metadata = {
  title: "Taxas - Admin",
};

export default async function FeesPage() {
  await requireAdmin();
  const fees = await sql`SELECT * FROM fees ORDER BY applies_to, name`;
  return <FeesClient fees={fees} />;
}
