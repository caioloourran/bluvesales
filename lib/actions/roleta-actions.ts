"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/auth";
import { todayBrazil } from "@/lib/format";

// ---------- PRIZES ----------

const prizeSchema = z.object({
  label: z.string().min(1, "Nome do premio obrigatorio").max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor invalida"),
  position: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export async function createPrize(data: {
  label: string;
  color: string;
  position: number;
  active: boolean;
}) {
  await requireAdmin();
  const parsed = prizeSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  try {
    await sql`
      INSERT INTO roleta_prizes (label, color, position, active)
      VALUES (${parsed.data.label}, ${parsed.data.color},
              ${parsed.data.position}, ${parsed.data.active})
    `;
    revalidatePath("/roleta");
    revalidatePath("/roleta-vendedor");
    return { success: true };
  } catch {
    return { error: "Erro ao criar premio" };
  }
}

export async function updatePrize(
  id: number,
  data: { label: string; color: string; position: number; active: boolean }
) {
  await requireAdmin();
  const parsed = prizeSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  try {
    await sql`
      UPDATE roleta_prizes
      SET label = ${parsed.data.label}, color = ${parsed.data.color},
          position = ${parsed.data.position}, active = ${parsed.data.active},
          updated_at = NOW()
      WHERE id = ${id}
    `;
    revalidatePath("/roleta");
    revalidatePath("/roleta-vendedor");
    return { success: true };
  } catch {
    return { error: "Erro ao atualizar premio" };
  }
}

export async function deletePrize(id: number) {
  await requireAdmin();
  try {
    await sql`DELETE FROM roleta_prizes WHERE id = ${id}`;
    revalidatePath("/roleta");
    revalidatePath("/roleta-vendedor");
    return { success: true };
  } catch {
    return { error: "Erro ao deletar premio" };
  }
}

// ---------- SETTINGS ----------

export async function updateRoletaSettings(data: {
  enabled: boolean;
  spinsPerDay: number;
}) {
  await requireAdmin();
  const parsed = z
    .object({ enabled: z.boolean(), spinsPerDay: z.coerce.number().int().min(1) })
    .safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  try {
    await sql`
      UPDATE roleta_settings
      SET enabled = ${parsed.data.enabled},
          spins_per_day = ${parsed.data.spinsPerDay}
      WHERE lock = true
    `;
    revalidatePath("/roleta");
    revalidatePath("/roleta-vendedor");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Erro ao atualizar configuracoes" };
  }
}

// ---------- SPIN (seller action) ----------

export async function spinRoleta() {
  const session = await requireAuth();

  // 1. Check wheel is enabled
  const settings = await sql`
    SELECT enabled, spins_per_day FROM roleta_settings WHERE lock = true LIMIT 1
  `;
  if (!settings[0]?.enabled) return { error: "A roleta esta desativada" };

  // 2. Check daily spin quota
  const today = todayBrazil();
  const spinsToday = await sql`
    SELECT COUNT(*) AS cnt FROM roleta_spins
    WHERE seller_id = ${session.id}
      AND spun_at::date = ${today}::date
  `;
  const used = Number(spinsToday[0]?.cnt ?? 0);
  const allowed = Number(settings[0].spins_per_day);
  if (used >= allowed) {
    return { error: "Voce ja usou todos os seus giros de hoje" };
  }

  // 3. Pick a random active prize (server-side to prevent cheating)
  const prizes = await sql`
    SELECT * FROM roleta_prizes WHERE active = true ORDER BY position
  `;
  if (prizes.length === 0) return { error: "Nenhum premio disponivel" };

  const winner = prizes[Math.floor(Math.random() * prizes.length)];

  // 4. Record the spin
  await sql`
    INSERT INTO roleta_spins (seller_id, prize_id, result_label)
    VALUES (${session.id}, ${winner.id}, ${winner.label})
  `;

  revalidatePath("/roleta-vendedor");

  return {
    success: true,
    winnerIndex: prizes.findIndex((p: { id: number }) => p.id === winner.id),
    winnerLabel: winner.label as string,
    prizes: prizes.map((p: { id: number; label: string; color: string }) => ({
      id: p.id,
      label: p.label,
      color: p.color,
    })),
  };
}
