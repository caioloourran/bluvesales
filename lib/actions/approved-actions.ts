"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

const approvedEntrySchema = z.object({
  date: z.string().min(1),
  entries: z.array(
    z.object({
      planId: z.coerce.number().int().positive(),
      quantity: z.coerce.number().int().min(0),
      discount: z.coerce.number().min(0).default(0),
      notes: z.string().optional(),
      paymentMethod: z.enum(["PIX", "BOLETO", "CARTAO"]).default("PIX"),
    })
  ),
});

export async function saveApprovedEntries(formData: {
  date: string;
  entries: { planId: number; quantity: number; discount?: number; notes?: string; paymentMethod?: string }[];
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN_MASTER" && session.role !== "COBRANCA") return { error: "Nao autorizado" };

  const parsed = approvedEntrySchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { date, entries } = parsed.data;

  const userId = session.id;

  try {
    for (const entry of entries) {
      if (entry.quantity > 0) {
        await sql`
          INSERT INTO daily_approved_payments (date, plan_id, quantity, discount, notes, payment_method, created_by)
          VALUES (${date}, ${entry.planId}, ${entry.quantity}, ${entry.discount || 0}, ${entry.notes || null}, ${entry.paymentMethod}, ${userId})
          ON CONFLICT (date, plan_id, payment_method, created_by) WHERE created_by IS NOT NULL
          DO UPDATE SET
            quantity = daily_approved_payments.quantity + EXCLUDED.quantity,
            discount = daily_approved_payments.discount + EXCLUDED.discount,
            updated_at = NOW()
        `;
      }
    }

    revalidatePath("/cobranca");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Erro ao salvar lancamentos de cobranca" };
  }
}

export async function getApprovedEntriesForDay(date: string) {
  const rows = await sql`
    SELECT dap.*, p.name as plan_name
    FROM daily_approved_payments dap
    JOIN plans p ON p.id = dap.plan_id
    WHERE dap.date = ${date}
  `;
  return rows;
}

export async function updateApprovedEntry(data: {
  id: number;
  quantity: number;
  discount?: number;
  notes?: string;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN_MASTER" && session.role !== "COBRANCA") return { error: "Nao autorizado" };

  const schema = z.object({
    id: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().min(1),
    discount: z.coerce.number().min(0).default(0),
    notes: z.string().optional(),
  });

  const parsed = schema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  try {
    // COBRANCA users can only edit their own entries; ADMIN_MASTER can edit any
    const rows = session.role === "ADMIN_MASTER"
      ? await sql`
          UPDATE daily_approved_payments
          SET quantity = ${parsed.data.quantity}, discount = ${parsed.data.discount}, notes = ${parsed.data.notes || null}, updated_at = NOW()
          WHERE id = ${parsed.data.id}
          RETURNING id
        `
      : await sql`
          UPDATE daily_approved_payments
          SET quantity = ${parsed.data.quantity}, discount = ${parsed.data.discount}, notes = ${parsed.data.notes || null}, updated_at = NOW()
          WHERE id = ${parsed.data.id} AND created_by = ${session.id}
          RETURNING id
        `;
    if (rows.length === 0) return { error: "Lancamento nao encontrado ou sem permissao" };
    revalidatePath("/cobranca");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Erro ao atualizar lancamento" };
  }
}

export async function deleteApprovedEntry(id: number) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN_MASTER" && session.role !== "COBRANCA") return { error: "Nao autorizado" };

  try {
    // COBRANCA users can only delete their own entries; ADMIN_MASTER can delete any
    const rows = session.role === "ADMIN_MASTER"
      ? await sql`DELETE FROM daily_approved_payments WHERE id = ${id} RETURNING id`
      : await sql`DELETE FROM daily_approved_payments WHERE id = ${id} AND created_by = ${session.id} RETURNING id`;
    if (rows.length === 0) return { error: "Lancamento nao encontrado ou sem permissao" };
    revalidatePath("/cobranca");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Erro ao excluir lancamento" };
  }
}
