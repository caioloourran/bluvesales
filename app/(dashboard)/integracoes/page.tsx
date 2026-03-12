import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { IntegracoesClient } from "@/components/admin/integracoes-client";

export const metadata = {
  title: "Integrações - Admin",
};

export default async function IntegracoesPage() {
  await requireAdmin();

  const integrations = await sql`
    SELECT id, origin, api_key, active, created_at, outbound_url, outbound_api_key
    FROM api_keys
    ORDER BY created_at DESC
  `;

  const hasAsaasKey = !!process.env.ASAAS_API_KEY;

  return <IntegracoesClient integrations={integrations as any} asaasConfigured={hasAsaasKey} />;
}
