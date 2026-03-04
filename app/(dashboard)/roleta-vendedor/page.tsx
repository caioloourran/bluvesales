import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { RoletaVendedorClient } from "@/components/roleta/roleta-vendedor-client";
import { todayBrazil } from "@/lib/format";

export const metadata = { title: "Roleta de Premios" };

export default async function RoletaVendedorPage() {
  const session = await requireAuth();
  if (session.role === "ADMIN_MASTER") redirect("/roleta");

  const settingsRows = await sql`
    SELECT enabled, spins_per_day FROM roleta_settings WHERE lock = true LIMIT 1
  `;
  const settings = settingsRows[0] ?? { enabled: false, spins_per_day: 1 };

  const prizes = settings.enabled
    ? await sql`SELECT id, label, color FROM roleta_prizes WHERE active = true ORDER BY position`
    : [];

  const today = todayBrazil();
  const spinsUsedRows = await sql`
    SELECT COUNT(*) AS cnt FROM roleta_spins
    WHERE seller_id = ${session.id}
      AND spun_at::date = ${today}::date
  `;
  const spinsUsed = Number(spinsUsedRows[0]?.cnt ?? 0);
  const spinsRemaining = Math.max(0, Number(settings.spins_per_day) - spinsUsed);

  return (
    <RoletaVendedorClient
      prizes={prizes.map((p) => ({
        id: p.id as number,
        label: p.label as string,
        color: p.color as string,
      }))}
      enabled={settings.enabled as boolean}
      spinsRemaining={spinsRemaining}
      spinsPerDay={Number(settings.spins_per_day)}
    />
  );
}
