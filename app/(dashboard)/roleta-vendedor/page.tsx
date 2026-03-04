import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { RoletaVendedorClient } from "@/components/roleta/roleta-vendedor-client";
import { todayBrazil } from "@/lib/format";

export const metadata = { title: "Roleta de Premios" };

export default async function RoletaVendedorPage() {
  const session = await requireAuth();
  if (session.role === "ADMIN_MASTER") redirect("/roleta");

  let prizes: { id: number; label: string; color: string }[] = [];
  let enabled = false;
  let spinsPerDay = 1;
  let spinsRemaining = 0;

  try {
    const settingsRows = await sql`
      SELECT enabled, spins_per_day FROM roleta_settings WHERE lock = true LIMIT 1
    `;
    const settings = settingsRows[0] ?? { enabled: false, spins_per_day: 1 };
    enabled = settings.enabled as boolean;
    spinsPerDay = Number(settings.spins_per_day);

    if (enabled) {
      const prizeRows = await sql`
        SELECT id, label, color FROM roleta_prizes WHERE active = true ORDER BY position
      `;
      prizes = prizeRows.map((p) => ({
        id: p.id as number,
        label: p.label as string,
        color: p.color as string,
      }));

      const today = todayBrazil();
      const spinsUsedRows = await sql`
        SELECT COUNT(*) AS cnt FROM roleta_spins
        WHERE seller_id = ${session.id}
          AND spun_at::date = ${today}::date
      `;
      const spinsUsed = Number(spinsUsedRows[0]?.cnt ?? 0);
      spinsRemaining = Math.max(0, spinsPerDay - spinsUsed);
    }
  } catch {
    // roleta tables may not exist yet — run migration 012
  }

  return (
    <RoletaVendedorClient
      prizes={prizes}
      enabled={enabled}
      spinsRemaining={spinsRemaining}
      spinsPerDay={spinsPerDay}
    />
  );
}
