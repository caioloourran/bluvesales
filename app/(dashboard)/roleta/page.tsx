import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { RoletaAdminClient } from "@/components/roleta/roleta-admin-client";

export const metadata = { title: "Roleta de Premios - Admin" };

export default async function RoletaAdminPage() {
  await requireAdmin();

  const prizes = await sql`
    SELECT * FROM roleta_prizes ORDER BY position, created_at
  `;
  const settingsRows = await sql`
    SELECT enabled, spins_per_day FROM roleta_settings WHERE lock = true LIMIT 1
  `;
  const settings = settingsRows[0] ?? { enabled: false, spins_per_day: 1 };

  return (
    <RoletaAdminClient
      prizes={prizes.map((r) => ({
        id: r.id as number,
        label: r.label as string,
        color: r.color as string,
        position: r.position as number,
        active: r.active as boolean,
      }))}
      settings={{
        enabled: settings.enabled as boolean,
        spins_per_day: Number(settings.spins_per_day),
      }}
    />
  );
}
