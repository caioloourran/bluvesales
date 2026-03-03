"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function updateAvatarAction(base64: string) {
  const session = await getSession();
  if (!session) return { error: "Não autorizado" };

  if (base64 !== "" && !base64.startsWith("data:image/")) {
    return { error: "Arquivo inválido" };
  }

  if (base64.length > 300_000) {
    return { error: "Imagem muito grande. Escolha uma imagem menor." };
  }

  await sql`
    UPDATE users
    SET avatar = ${base64 || null}, updated_at = NOW()
    WHERE id = ${session.id}
  `;

  revalidatePath("/", "layout");
  return { success: true };
}
