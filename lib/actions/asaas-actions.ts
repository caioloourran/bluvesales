// lib/actions/asaas-actions.ts
"use server";

import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const ASAAS_API_URL = "https://api.asaas.com/api/v3";

async function asaasFetch(path: string, options: RequestInit = {}) {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error("ASAAS_API_KEY não configurada");

  const res = await fetch(`${ASAAS_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
      ...options.headers,
    },
  });

  const text = await res.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Asaas retornou resposta inválida (${res.status}): ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    const errors = data.errors as Array<{ description?: string }> | undefined;
    const msg = errors?.[0]?.description || (data.message as string) || `Erro Asaas (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

async function findOrCreateCustomer(order: {
  cpf: string;
  nome: string;
  email: string | null;
  whatsapp: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
}): Promise<string> {
  // Try to find existing customer by CPF
  const cpfClean = order.cpf.replace(/\D/g, "");
  const search = await asaasFetch(`/customers?cpfCnpj=${cpfClean}`);
  if (search.data?.length > 0) {
    return search.data[0].id;
  }

  // Create new customer
  const customer = await asaasFetch("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: order.nome,
      email: order.email || undefined,
      phone: order.whatsapp.replace(/\D/g, ""),
      mobilePhone: order.whatsapp.replace(/\D/g, ""),
      cpfCnpj: cpfClean,
      postalCode: order.cep.replace(/\D/g, ""),
      address: order.rua,
      addressNumber: order.numero,
      complement: order.complemento || undefined,
      province: order.bairro,
      city: order.cidade,
      state: order.estado,
    }),
  });

  return customer.id;
}

export async function generateBoletoAction(orderId: number) {
  await requireAuth();

  // Get order with plan price
  const orders = await sql`
    SELECT o.*, pl.sale_price_gross, pl.name as plan_name, p.name as product_name
    FROM orders o
    LEFT JOIN plans pl ON pl.id = o.plan_id
    LEFT JOIN products p ON p.id = o.product_id
    WHERE o.id = ${orderId}
  `;

  if (orders.length === 0) return { error: "Pedido não encontrado" };
  const order = orders[0];

  if (order.boleto_url) {
    return { error: "Boleto já foi gerado para este pedido", boleto_url: order.boleto_url };
  }

  const value = Number(order.sale_price_gross);
  if (!value || value <= 0) {
    return { error: "Pedido sem plano/valor definido. Associe um plano antes de gerar boleto." };
  }

  try {
    // 1. Find or create customer on Asaas
    const customerId = await findOrCreateCustomer(order);

    // 2. Create payment (boleto)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // 7 days from now
    const dueDateStr = dueDate.toISOString().split("T")[0];

    const description = order.plan_name
      ? `${order.product_name} - ${order.plan_name}`
      : order.product_name || `Pedido #${orderId}`;

    const payment = await asaasFetch("/payments", {
      method: "POST",
      body: JSON.stringify({
        customer: customerId,
        billingType: "BOLETO",
        value,
        dueDate: dueDateStr,
        description,
        externalReference: String(orderId),
      }),
    });

    // 3. Save to database
    await sql`
      UPDATE orders
      SET boleto_url = ${payment.bankSlipUrl},
          asaas_payment_id = ${payment.id},
          asaas_customer_id = ${customerId}
      WHERE id = ${orderId}
    `;

    revalidatePath("/pedidos");
    return {
      success: true,
      boleto_url: payment.bankSlipUrl,
      invoice_url: payment.invoiceUrl,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao gerar boleto";
    return { error: message };
  }
}
