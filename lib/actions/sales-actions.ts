"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

const salesEntrySchema = z.object({
  date: z.string().min(1),
  sellerId: z.coerce.number().int().positive(),
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

export async function saveSalesEntries(formData: {
  date: string;
  sellerId: number;
  entries: { planId: number; quantity: number; discount?: number; notes?: string; paymentMethod?: string }[];
}) {
  const session = await getSession();
  if (!session) return { error: "Nao autorizado" };

  // Sellers can only save their own entries
  if (session.role === "SELLER" && formData.sellerId !== session.id) {
    return { error: "Sem permissao" };
  }

  const parsed = salesEntrySchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { date, sellerId, entries } = parsed.data;

  try {
    // INSERT new entries; if same (date, seller, plan, method) already exists, accumulate quantity/discount
    for (const entry of entries) {
      if (entry.quantity > 0) {
        await sql`
          INSERT INTO daily_sales_entries (date, seller_id, plan_id, quantity, discount, notes, payment_method)
          VALUES (${date}, ${sellerId}, ${entry.planId}, ${entry.quantity}, ${entry.discount || 0}, ${entry.notes || null}, ${entry.paymentMethod})
          ON CONFLICT (date, seller_id, plan_id, payment_method) DO UPDATE
            SET quantity = daily_sales_entries.quantity + EXCLUDED.quantity,
                discount = daily_sales_entries.discount + EXCLUDED.discount,
                updated_at = NOW()
        `;
      }
    }

    revalidatePath("/sales");
    revalidatePath("/history");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Erro ao salvar lancamentos" };
  }
}

export async function getSalesEntriesForDay(date: string, sellerId: number) {
  const rows = await sql`
    SELECT dse.*, p.name as plan_name
    FROM daily_sales_entries dse
    JOIN plans p ON p.id = dse.plan_id
    WHERE dse.date = ${date} AND dse.seller_id = ${sellerId}
  `;
  return rows;
}

export async function updateSalesEntry(data: {
  id: number;
  quantity: number;
  discount?: number;
  notes?: string;
}) {
  const session = await getSession();
  if (!session) return { error: "Nao autorizado" };

  const schema = z.object({
    id: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().min(1),
    discount: z.coerce.number().min(0).default(0),
    notes: z.string().optional(),
  });

  const parsed = schema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  // Check ownership for sellers
  if (session.role === "SELLER") {
    const rows = await sql`SELECT seller_id FROM daily_sales_entries WHERE id = ${parsed.data.id}`;
    if (rows.length === 0) return { error: "Lancamento nao encontrado" };
    if (rows[0].seller_id !== session.id) return { error: "Sem permissao" };
  }

  try {
    await sql`
      UPDATE daily_sales_entries
      SET quantity = ${parsed.data.quantity}, discount = ${parsed.data.discount}, notes = ${parsed.data.notes || null}, updated_at = NOW()
      WHERE id = ${parsed.data.id}
    `;
    revalidatePath("/history");
    revalidatePath("/sales");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Erro ao atualizar lancamento" };
  }
}

export async function deleteSalesEntry(id: number) {
  const session = await getSession();
  if (!session) return { error: "Nao autorizado" };

  // Check ownership for sellers
  if (session.role === "SELLER") {
    const rows = await sql`SELECT seller_id FROM daily_sales_entries WHERE id = ${id}`;
    if (rows.length === 0) return { error: "Lancamento nao encontrado" };
    if (rows[0].seller_id !== session.id) return { error: "Sem permissao" };
  }

  try {
    await sql`DELETE FROM daily_sales_entries WHERE id = ${id}`;
    revalidatePath("/history");
    revalidatePath("/sales");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Erro ao excluir lancamento" };
  }
}
