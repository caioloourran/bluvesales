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

  await sql`
    INSERT INTO orders (
      cpf, nome, email, whatsapp,
      cep, rua, numero, bairro, cidade, estado, complemento,
      product_id, plan_id, comprovante, seller_id
    ) VALUES (
      ${data.cpf}, ${data.nome}, ${data.email || null}, ${data.whatsapp},
      ${data.cep}, ${data.rua}, ${data.numero}, ${data.bairro},
      ${data.cidade}, ${data.estado}, ${data.complemento || null},
      ${data.product_id || null}, ${data.plan_id || null},
      ${data.comprovante || null}, ${session.id}
    )
  `;

  revalidatePath("/pedidos");
  return { success: true };
}

export async function updateOrderStatusAction(id: number, status: string) {
  const session = await requireAuth();

  if (session.role === "SELLER") {
    await sql`
      UPDATE orders
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id} AND seller_id = ${session.id}
    `;
  } else {
    await sql`
      UPDATE orders
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
    `;
  }

  revalidatePath("/pedidos");
  return { success: true };
}

export async function updateOrderAction(id: number, data: OrderFormData) {
  const session = await requireAuth();

  if (session.role === "SELLER") {
    await sql`
      UPDATE orders
      SET cpf = ${data.cpf}, nome = ${data.nome}, email = ${data.email || null},
          whatsapp = ${data.whatsapp}, cep = ${data.cep}, rua = ${data.rua},
          numero = ${data.numero}, bairro = ${data.bairro}, cidade = ${data.cidade},
          estado = ${data.estado}, complemento = ${data.complemento || null},
          product_id = ${data.product_id || null}, plan_id = ${data.plan_id || null},
          comprovante = ${data.comprovante || null}, updated_at = NOW()
      WHERE id = ${id} AND seller_id = ${session.id}
    `;
  } else {
    await sql`
      UPDATE orders
      SET cpf = ${data.cpf}, nome = ${data.nome}, email = ${data.email || null},
          whatsapp = ${data.whatsapp}, cep = ${data.cep}, rua = ${data.rua},
          numero = ${data.numero}, bairro = ${data.bairro}, cidade = ${data.cidade},
          estado = ${data.estado}, complemento = ${data.complemento || null},
          product_id = ${data.product_id || null}, plan_id = ${data.plan_id || null},
          comprovante = ${data.comprovante || null}, updated_at = NOW()
      WHERE id = ${id}
    `;
  }

  revalidatePath("/pedidos");
  return { success: true };
}

export async function deleteOrderAction(id: number) {
  const session = await requireAuth();

  if (session.role === "SELLER") {
    await sql`DELETE FROM orders WHERE id = ${id} AND seller_id = ${session.id}`;
  } else {
    await sql`DELETE FROM orders WHERE id = ${id}`;
  }

  revalidatePath("/pedidos");
  return { success: true };
}
