import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { IntegracoesClient } from "@/components/admin/integracoes-client";

export const metadata = {
  title: "Integrações - Admin",
};

export default async function IntegracoesPage() {
  await requireAdmin();

  const integrations = await sql`
    SELECT ak.id, ak.origin, ak.api_key, ak.seller_id, ak.active, ak.created_at,
           u.name AS seller_name
    FROM api_keys ak
    JOIN users u ON u.id = ak.seller_id
    ORDER BY ak.created_at DESC
  `;

  const sellers = await sql`
    SELECT id, name FROM users WHERE role = 'SELLER' ORDER BY name
  `;

  return (
    <IntegracoesClient
      integrations={integrations as any}
      sellers={sellers as any}
    />
  );
}
