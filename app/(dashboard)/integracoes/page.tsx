import { requireAdminOrAffiliate } from "@/lib/auth";
import { sql } from "@/lib/db";
import { IntegracoesClient } from "@/components/admin/integracoes-client";

export const metadata = {
  title: "Integrações",
};

export default async function IntegracoesPage() {
  const session = await requireAdminOrAffiliate();
  const isAffiliate = session.role === "AFFILIATE";

  // Affiliates only see their Checkout ID config, not API keys
  let integrations: any[] = [];
  let paytCheckoutId = "";

  if (isAffiliate) {
    const rows = await sql`SELECT payt_checkout_id FROM users WHERE id = ${session.id}`;
    paytCheckoutId = rows[0]?.payt_checkout_id || "";
  } else {
    integrations = await sql`
      SELECT id, origin, api_key, active, created_at, outbound_url, outbound_api_key
      FROM api_keys
      ORDER BY created_at DESC
    ` as any;
  }

  const hasAsaasKey = !!process.env.ASAAS_API_KEY;

  return (
    <IntegracoesClient
      integrations={integrations}
      asaasConfigured={hasAsaasKey}
      isAffiliate={isAffiliate}
      paytCheckoutId={paytCheckoutId}
    />
  );
}
