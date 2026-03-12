// lib/actions/orders-actions.ts
"use server";

import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface OrderFormData {
  cpf: string;
  nome: string;
  email?: string;
  whatsapp: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento?: string;
  product_id?: number | null;
  plan_id?: number | null;
  comprovante?: string | null;
}

export async function createOrderAction(data: OrderFormData) {
  const session = await requireAuth();

  try {
    await sql`
      INSERT INTO orders (
        cpf, nome, email, whatsapp,
        cep, rua, numero, bairro, cidade, estado, complemento,
        product_id, plan_id, comprovante, seller_id
      ) VALUES (
        ${data.cpf}, ${data.nome}, ${data.email || null}, ${data.whatsapp},
        ${data.cep}, ${data.rua}, ${data.numero}, ${data.bairro},
        ${data.cidade}, ${data.estado}, ${data.complemento || null},
        ${data.product_id ?? null}, ${data.plan_id ?? null},
        ${data.comprovante || null}, ${session.id}
      )
    `;
  } catch {
    return { error: "Erro ao processar pedido" };
  }

  revalidatePath("/pedidos");
  return { success: true };
}

const VALID_STATUSES = [
  "reportados",
  "enviados",
  "saiu_para_entrega",
  "retirar_nos_correios",
  "requer_atencao",
  "entregues",
  "cobrados",
  "inadimplencias",
  "aguardando_devolucao",
  "devolvido",
  "frustrados",
  "pagos",
] as const;

export async function updateOrderStatusAction(id: number, status: string) {
  const session = await requireAuth();

  if (!VALID_STATUSES.includes(status as any)) return { error: "Status inválido" };

  try {
    if (session.role === "SELLER") {
      const result = await sql`
        UPDATE orders
        SET status = ${status}, updated_at = NOW()
        WHERE id = ${id} AND seller_id = ${session.id}
      `;
      if (result.count === 0) return { error: "Pedido não encontrado" };
    } else {
      await sql`
        UPDATE orders
        SET status = ${status}, updated_at = NOW()
        WHERE id = ${id}
      `;
    }
  } catch {
    return { error: "Erro ao processar pedido" };
  }

  revalidatePath("/pedidos");
  return { success: true };
}

export async function updateOrderAction(id: number, data: OrderFormData) {
  const session = await requireAuth();

  try {
    if (session.role === "SELLER") {
      const result = await sql`
        UPDATE orders
        SET cpf = ${data.cpf}, nome = ${data.nome}, email = ${data.email || null},
            whatsapp = ${data.whatsapp}, cep = ${data.cep}, rua = ${data.rua},
            numero = ${data.numero}, bairro = ${data.bairro}, cidade = ${data.cidade},
            estado = ${data.estado}, complemento = ${data.complemento || null},
            product_id = ${data.product_id ?? null}, plan_id = ${data.plan_id ?? null},
            comprovante = ${data.comprovante || null}, updated_at = NOW()
        WHERE id = ${id} AND seller_id = ${session.id}
      `;
      if (result.count === 0) return { error: "Pedido não encontrado" };
    } else {
      await sql`
        UPDATE orders
        SET cpf = ${data.cpf}, nome = ${data.nome}, email = ${data.email || null},
            whatsapp = ${data.whatsapp}, cep = ${data.cep}, rua = ${data.rua},
            numero = ${data.numero}, bairro = ${data.bairro}, cidade = ${data.cidade},
            estado = ${data.estado}, complemento = ${data.complemento || null},
            product_id = ${data.product_id ?? null}, plan_id = ${data.plan_id ?? null},
            comprovante = ${data.comprovante || null}, updated_at = NOW()
        WHERE id = ${id}
      `;
    }
  } catch {
    return { error: "Erro ao processar pedido" };
  }

  revalidatePath("/pedidos");
  return { success: true };
}

const SUBSTATUS_FIELDS = ["status_envio", "status_plataforma", "status_pagamento"] as const;
type SubStatusField = typeof SUBSTATUS_FIELDS[number];

// Maps sub-status values to the main status (tab) the order should move to
const SUBSTATUS_TO_MAIN: Record<string, Record<string, string>> = {
  status_envio: { entregue: "entregues" },
  status_plataforma: { cobrado: "cobrados" },
  status_pagamento: { pago: "pagos" },
};

export async function updateOrderSubStatusAction(
  id: number,
  updates: { status_envio?: string; status_plataforma?: string; status_pagamento?: string }
) {
  const session = await requireAuth();

  // Determine new main status from sub-status changes
  let newMainStatus: string | null = null;
  for (const field of SUBSTATUS_FIELDS) {
    const value = updates[field];
    if (value && SUBSTATUS_TO_MAIN[field]?.[value]) {
      newMainStatus = SUBSTATUS_TO_MAIN[field][value];
    }
  }

  try {
    if (session.role === "SELLER") {
      const result = newMainStatus
        ? await sql`
            UPDATE orders
            SET status_envio = COALESCE(${updates.status_envio ?? null}, status_envio),
                status_plataforma = COALESCE(${updates.status_plataforma ?? null}, status_plataforma),
                status_pagamento = COALESCE(${updates.status_pagamento ?? null}, status_pagamento),
                status = ${newMainStatus},
                updated_at = NOW()
            WHERE id = ${id} AND seller_id = ${session.id}
          `
        : await sql`
            UPDATE orders
            SET status_envio = COALESCE(${updates.status_envio ?? null}, status_envio),
                status_plataforma = COALESCE(${updates.status_plataforma ?? null}, status_plataforma),
                status_pagamento = COALESCE(${updates.status_pagamento ?? null}, status_pagamento),
                updated_at = NOW()
            WHERE id = ${id} AND seller_id = ${session.id}
          `;
      if (result.count === 0) return { error: "Pedido não encontrado" };
    } else {
      if (newMainStatus) {
        await sql`
          UPDATE orders
          SET status_envio = COALESCE(${updates.status_envio ?? null}, status_envio),
              status_plataforma = COALESCE(${updates.status_plataforma ?? null}, status_plataforma),
              status_pagamento = COALESCE(${updates.status_pagamento ?? null}, status_pagamento),
              status = ${newMainStatus},
              updated_at = NOW()
          WHERE id = ${id}
        `;
      } else {
        await sql`
          UPDATE orders
          SET status_envio = COALESCE(${updates.status_envio ?? null}, status_envio),
              status_plataforma = COALESCE(${updates.status_plataforma ?? null}, status_plataforma),
              status_pagamento = COALESCE(${updates.status_pagamento ?? null}, status_pagamento),
              updated_at = NOW()
          WHERE id = ${id}
        `;
      }
    }
  } catch {
    return { error: "Erro ao atualizar status" };
  }

  revalidatePath("/pedidos");
  return { success: true, newMainStatus };
}

export async function deleteOrderAction(id: number) {
  const session = await requireAuth();

  try {
    if (session.role === "SELLER") {
      const result = await sql`DELETE FROM orders WHERE id = ${id} AND seller_id = ${session.id}`;
      if (result.count === 0) return { error: "Pedido não encontrado" };
    } else {
      await sql`DELETE FROM orders WHERE id = ${id}`;
    }
  } catch {
    return { error: "Erro ao processar pedido" };
  }

  revalidatePath("/pedidos");
  return { success: true };
}
