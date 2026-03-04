import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { RoletaAdminClient } from "@/components/roleta/roleta-admin-client";

export const metadata = { title: "Roleta de Premios - Admin" };

export default async function RoletaAdminPage() {
  await requireAdmin();

  let prizes: { id: number; label: string; color: string; position: number; active: boolean }[] = [];
  let settings = { enabled: false, spins_per_day: 1 };

  try {
    const prizeRows = await sql`
      SELECT * FROM roleta_prizes ORDER BY position, created_at
    `;
    prizes = prizeRows.map((r) => ({
      id: r.id as number,
      label: r.label as string,
      color: r.color as string,
      position: r.position as number,
      active: r.active as boolean,
    }));

    const settingsRows = await sql`
      SELECT enabled, spins_per_day FROM roleta_settings WHERE lock = true LIMIT 1
    `;
    if (settingsRows[0]) {
      settings = {
        enabled: settingsRows[0].enabled as boolean,
        spins_per_day: Number(settingsRows[0].spins_per_day),
      };
    }
  } catch {
    // roleta tables may not exist yet — run migration 012
  }

  return <RoletaAdminClient prizes={prizes} settings={settings} />;
}
