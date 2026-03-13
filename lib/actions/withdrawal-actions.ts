"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function requestWithdrawal(amount: number) {
  const session = await getSession();
  if (!session || session.role !== "SELLER") return { error: "Nao autorizado" };

  const parsed = z.coerce.number().positive().safeParse(amount);
  if (!parsed.success) return { error: "Valor invalido" };

  try {
    await sql`
      INSERT INTO withdrawals (seller_id, amount, status, requested_at)
      VALUES (${session.id}, ${parsed.data}, 'pending', NOW())
    `;
    revalidatePath("/financeiro");
    revalidatePath("/saques");
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: `Erro ao solicitar saque: ${msg}` };
  }
}

export async function updateWithdrawalStatus(data: {
  id: number;
  status: "processing" | "paid" | "rejected";
  adminNotes?: string;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN_MASTER") return { error: "Nao autorizado" };

  const schema = z.object({
    id: z.coerce.number().int().positive(),
    status: z.enum(["processing", "paid", "rejected"]),
    adminNotes: z.string().optional(),
  });

  const parsed = schema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { id, status, adminNotes } = parsed.data;

  try {
    const processedAt = status === "processing" || status === "rejected" ? "NOW()" : null;
    const paidAt = status === "paid" ? "NOW()" : null;

    await sql`
      UPDATE withdrawals
      SET status = ${status},
          admin_notes = ${adminNotes || null},
          processed_at = CASE WHEN ${status} IN ('processing', 'rejected') THEN NOW() ELSE processed_at END,
          paid_at = CASE WHEN ${status} = 'paid' THEN NOW() ELSE paid_at END,
          updated_at = NOW()
      WHERE id = ${id}
    `;
    revalidatePath("/financeiro");
    revalidatePath("/saques");
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: `Erro ao atualizar saque: ${msg}` };
  }
}

export async function getSellerWithdrawals(sellerId: number) {
  const rows = await sql`
    SELECT id, amount, status, admin_notes, requested_at, processed_at, paid_at
    FROM withdrawals
    WHERE seller_id = ${sellerId}
    ORDER BY requested_at DESC
  `;
  return rows;
}

export async function getAllWithdrawals() {
  const rows = await sql`
    SELECT w.id, w.amount, w.status, w.admin_notes, w.requested_at, w.processed_at, w.paid_at,
           u.name as seller_name, u.id as seller_id
    FROM withdrawals w
    JOIN users u ON u.id = w.seller_id
    ORDER BY
      CASE w.status WHEN 'pending' THEN 0 WHEN 'processing' THEN 1 ELSE 2 END,
      w.requested_at DESC
  `;
  return rows;
}

export async function getSellerWithdrawnTotal(sellerId: number): Promise<number> {
  const rows = await sql`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM withdrawals
    WHERE seller_id = ${sellerId} AND status IN ('pending', 'processing', 'paid')
  `;
  return Number(rows[0].total);
}
