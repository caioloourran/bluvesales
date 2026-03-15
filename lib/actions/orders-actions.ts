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

  let orderId: number;
  try {
    const result = await sql`
      INSERT INTO orders (
        cpf, nome, email, whatsapp,
        cep, rua, numero, bairro, cidade, estado, complemento,
        product_id, plan_id, comprovante, seller_id, origin
      ) VALUES (
        ${data.cpf}, ${data.nome}, ${data.email || null}, ${data.whatsapp},
        ${data.cep}, ${data.rua}, ${data.numero}, ${data.bairro},
        ${data.cidade}, ${data.estado}, ${data.complemento || null},
        ${data.product_id ?? null}, ${data.plan_id ?? null},
        ${data.comprovante || null}, ${session.id}, 'bluvesales'
      ) RETURNING id
    `;
    orderId = result[0].id;
    // Set order_number so 123log can reference back
    await sql`UPDATE orders SET order_number = ${String(orderId)} WHERE id = ${orderId}`;
  } catch {
    return { error: "Erro ao processar pedido" };
  }

  // Send to outbound integrations (fire-and-forget, don't block the user)
  sendToOutboundIntegrations(orderId, data).catch(() => {});

  revalidatePath("/pedidos");
  return { success: true };
}

async function sendToOutboundIntegrations(orderId: number, data: OrderFormData) {
  // Find all active integrations with outbound configured
  const integrations = await sql`
    SELECT outbound_url, outbound_api_key
    FROM api_keys
    WHERE active = true AND outbound_url IS NOT NULL AND outbound_api_key IS NOT NULL
  `;

  if (integrations.length === 0) return;

  // Build product list
  const products: { name: string; quantity: number; unit_price: number }[] = [];
  if (data.plan_id) {
    const plans = await sql`
      SELECT p.name as product_name, pl.name as plan_name, pl.sale_price_gross
      FROM plans pl JOIN products p ON p.id = pl.product_id
      WHERE pl.id = ${data.plan_id}
    `;
    if (plans.length > 0) {
      products.push({
        name: `${plans[0].product_name} - ${plans[0].plan_name}`,
        quantity: 1,
        unit_price: Number(plans[0].sale_price_gross) || 0,
      });
    }
  } else if (data.product_id) {
    const prods = await sql`SELECT name FROM products WHERE id = ${data.product_id}`;
    if (prods.length > 0) {
      products.push({ name: prods[0].name, quantity: 1, unit_price: 0 });
    }
  }

  const payload = {
    order_number: String(orderId),
    origin: "bluvesales",
    sale_type: "standard",
    customer_name: data.nome,
    customer_email: data.email || null,
    customer_phone: data.whatsapp,
    customer_type: "F",
    customer_doc: data.cpf,
    customer_address: data.rua,
    customer_number: data.numero,
    customer_complement: data.complemento || null,
    customer_district: data.bairro,
    customer_zipcode: data.cep,
    customer_city: data.cidade,
    customer_state: data.estado,
    customer_country: "BR",
    products,
    is_after_pay: true,
  };

  for (const integration of integrations) {
    try {
      await fetch(integration.outbound_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${integration.outbound_api_key}`,
        },
        body: JSON.stringify(payload),
      });
    } catch {
      // Silently fail — don't block order creation
    }
  }
}

const VALID_STATUSES = [
  "cadastrados",
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
