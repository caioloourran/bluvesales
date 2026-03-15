"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createHash } from "crypto";
import { sql } from "@/lib/db";
import { requireAdmin, requireAdminOrAffiliate } from "@/lib/auth";

// ---- PRODUCTS ----
const productSchema = z.object({
  name: z.string().min(1, "Nome obrigatorio"),
  active: z.boolean().default(true),
});

export async function createProduct(data: { name: string; active: boolean }) {
  await requireAdmin();
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  try {
    await sql`INSERT INTO products (name, active) VALUES (${parsed.data.name}, ${parsed.data.active})`;
    revalidatePath("/products");
    return { success: true };
  } catch {
    return { error: "Erro ao criar produto" };
  }
}

export async function updateProduct(id: number, data: { name: string; active: boolean }) {
  await requireAdmin();
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  try {
    await sql`UPDATE products SET name = ${parsed.data.name}, active = ${parsed.data.active}, updated_at = NOW() WHERE id = ${id}`;
    revalidatePath("/products");
    return { success: true };
  } catch {
    return { error: "Erro ao atualizar produto" };
  }
}

export async function deleteProduct(id: number) {
  await requireAdmin();
  try {
    await sql`DELETE FROM products WHERE id = ${id}`;
    revalidatePath("/products");
    return { success: true };
  } catch {
    return { error: "Erro ao deletar produto" };
  }
}

// ---- PLANS ----
const planSchema = z.object({
  productId: z.coerce.number().int().positive(),
  name: z.string().min(1, "Nome obrigatorio"),
  salePriceGross: z.coerce.number().min(0),
  salePriceNet: z.coerce.number().min(0).nullable().optional(),
  productCost: z.coerce.number().min(0).default(0),
  shippingCost: z.coerce.number().min(0).default(0),
  paytCheckoutId: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  active: z.boolean().default(true),
});

export async function createPlan(data: {
  productId: number;
  name: string;
  salePriceGross: number;
  salePriceNet?: number | null;
  productCost?: number;
  shippingCost?: number;
  paytCheckoutId?: string | null;
  sku?: string | null;
  active: boolean;
}) {
  await requireAdmin();
  const parsed = planSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  try {
    await sql`
      INSERT INTO plans (product_id, name, sale_price_gross, sale_price_net, product_cost, shipping_cost, payt_checkout_id, sku, active)
      VALUES (${parsed.data.productId}, ${parsed.data.name}, ${parsed.data.salePriceGross}, ${parsed.data.salePriceNet || null}, ${parsed.data.productCost}, ${parsed.data.shippingCost}, ${parsed.data.paytCheckoutId || null}, ${parsed.data.sku || null}, ${parsed.data.active})
    `;
    revalidatePath("/plans");
    return { success: true };
  } catch {
    return { error: "Erro ao criar plano" };
  }
}

export async function updatePlan(
  id: number,
  data: {
    productId: number;
    name: string;
    salePriceGross: number;
    salePriceNet?: number | null;
    productCost?: number;
    shippingCost?: number;
    paytCheckoutId?: string | null;
    sku?: string | null;
    active: boolean;
  }
) {
  await requireAdmin();
  const parsed = planSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  try {
    await sql`
      UPDATE plans SET product_id = ${parsed.data.productId}, name = ${parsed.data.name},
      sale_price_gross = ${parsed.data.salePriceGross}, sale_price_net = ${parsed.data.salePriceNet || null},
      product_cost = ${parsed.data.productCost}, shipping_cost = ${parsed.data.shippingCost},
      payt_checkout_id = ${parsed.data.paytCheckoutId || null},
      sku = ${parsed.data.sku || null},
      active = ${parsed.data.active}, updated_at = NOW() WHERE id = ${id}
    `;
    revalidatePath("/plans");
    return { success: true };
  } catch {
    return { error: "Erro ao atualizar plano" };
  }
}

export async function deletePlan(id: number) {
  await requireAdmin();
  try {
    await sql`DELETE FROM plans WHERE id = ${id}`;
    revalidatePath("/plans");
    return { success: true };
  } catch {
    return { error: "Erro ao deletar plano" };
  }
}

// ---- COMMISSIONS ----
const commissionSchema = z.object({
  sellerId: z.coerce.number().int().positive(),
  planId: z.coerce.number().int().positive(),
  percent: z.coerce.number().min(0).max(100),
});

export async function upsertCommission(data: {
  sellerId: number;
  planId: number;
  percent: number;
}) {
  await requireAdmin();
  const parsed = commissionSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  try {
    await sql`
      INSERT INTO seller_commissions (seller_id, plan_id, percent)
      VALUES (${parsed.data.sellerId}, ${parsed.data.planId}, ${parsed.data.percent})
      ON CONFLICT (seller_id, plan_id) DO UPDATE SET percent = ${parsed.data.percent}, updated_at = NOW()
    `;
    revalidatePath("/commissions");
    return { success: true };
  } catch {
    return { error: "Erro ao salvar comissao" };
  }
}

// ---- USERS ----
const userSchema = z.object({
  name: z.string().min(1, "Nome obrigatorio"),
  email: z.string().email("Email invalido"),
  password: z.string().min(4, "Senha deve ter ao menos 4 caracteres").optional(),
  role: z.enum(["ADMIN_MASTER", "SELLER", "COBRANCA", "AFFILIATE"]),
  affiliateId: z.coerce.number().int().positive().optional(),
});

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
  affiliateId?: number;
}) {
  const session = await requireAdminOrAffiliate();
  // Affiliates can only create SELLERs linked to themselves
  if (session.role === "AFFILIATE") {
    data.role = "SELLER";
    data.affiliateId = session.id;
  }
  const parsed = userSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  if (!parsed.data.password) return { error: "Senha obrigatoria" };

  const hash = createHash("sha256").update(parsed.data.password).digest("hex");

  try {
    await sql`
      INSERT INTO users (name, email, password_hash, role, affiliate_id)
      VALUES (${parsed.data.name}, ${parsed.data.email}, ${hash}, ${parsed.data.role}, ${parsed.data.affiliateId || null})
    `;
    revalidatePath("/users");
    return { success: true };
  } catch {
    return { error: "Erro ao criar usuario. Email pode ja existir." };
  }
}

export async function updateUser(
  id: number,
  data: { name: string; email: string; password?: string; role: string; affiliateId?: number }
) {
  const session = await requireAdminOrAffiliate();
  // Affiliates can only edit their own sellers
  if (session.role === "AFFILIATE") {
    const rows = await sql`SELECT id FROM users WHERE id = ${id} AND affiliate_id = ${session.id}`;
    if (rows.length === 0) return { error: "Sem permissao para editar este usuario" };
    data.role = "SELLER";
    data.affiliateId = session.id;
  }
  const parsed = userSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  try {
    if (parsed.data.password) {
      const hash = createHash("sha256").update(parsed.data.password).digest("hex");
      await sql`
        UPDATE users SET name = ${parsed.data.name}, email = ${parsed.data.email},
        password_hash = ${hash}, role = ${parsed.data.role}, updated_at = NOW() WHERE id = ${id}
      `;
    } else {
      await sql`
        UPDATE users SET name = ${parsed.data.name}, email = ${parsed.data.email},
        role = ${parsed.data.role}, updated_at = NOW() WHERE id = ${id}
      `;
    }
    revalidatePath("/users");
    return { success: true };
  } catch {
    return { error: "Erro ao atualizar usuario" };
  }
}

export async function deleteUser(id: number) {
  const session = await requireAdminOrAffiliate();
  if (session.role === "AFFILIATE") {
    const rows = await sql`SELECT id FROM users WHERE id = ${id} AND affiliate_id = ${session.id}`;
    if (rows.length === 0) return { error: "Sem permissao para deletar este usuario" };
  }
  try {
    await sql`DELETE FROM users WHERE id = ${id}`;
    revalidatePath("/users");
    return { success: true };
  } catch {
    return { error: "Erro ao deletar usuario" };
  }
}

// ---- MARKETING (Daily Ad Metrics) ----
const adMetricSchema = z.object({
  date: z.string().min(1),
  sellerId: z.coerce.number().int().positive(),
  investment: z.coerce.number().min(0),
  leads: z.coerce.number().int().min(0),
  purchasesCount: z.coerce.number().int().min(0).optional(),
});

export async function upsertAdMetric(data: {
  date: string;
  sellerId: number;
  investment: number;
  leads: number;
  purchasesCount?: number;
}) {
  await requireAdmin();
  const parsed = adMetricSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  try {
    await sql`
      INSERT INTO daily_ad_metrics (date, seller_id, investment, leads, purchases_count)
      VALUES (${parsed.data.date}, ${parsed.data.sellerId}, ${parsed.data.investment}, ${parsed.data.leads}, ${parsed.data.purchasesCount || 0})
      ON CONFLICT (date, seller_id) DO UPDATE SET
        investment = ${parsed.data.investment},
        leads = ${parsed.data.leads},
        purchases_count = ${parsed.data.purchasesCount || 0},
        updated_at = NOW()
    `;
    revalidatePath("/marketing");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Erro ao salvar metrica" };
  }
}

export async function deleteAdMetric(id: number) {
  await requireAdmin();
  try {
    await sql`DELETE FROM daily_ad_metrics WHERE id = ${id}`;
    revalidatePath("/marketing");
    return { success: true };
  } catch {
    return { error: "Erro ao deletar metrica" };
  }
}

// ---- FEES ----
const feeSchema = z.object({
  name: z.string().min(1, "Nome obrigatorio"),
  slug: z.string().min(1, "Slug obrigatorio"),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().min(0),
  appliesTo: z.enum(["SALE", "INVESTMENT", "APPROVED"]),
  paymentMethod: z.enum(["PIX", "BOLETO", "CARTAO"]).nullable().default(null),
  active: z.boolean().default(true),
});

export async function createFee(data: {
  name: string;
  slug: string;
  type: string;
  value: number;
  appliesTo: string;
  paymentMethod: string | null;
  active: boolean;
}) {
  await requireAdmin();
  const parsed = feeSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  try {
    await sql`
      INSERT INTO fees (name, slug, type, value, applies_to, payment_method, active)
      VALUES (${parsed.data.name}, ${parsed.data.slug}, ${parsed.data.type}, ${parsed.data.value}, ${parsed.data.appliesTo}, ${parsed.data.paymentMethod}, ${parsed.data.active})
    `;
    revalidatePath("/fees");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Erro ao criar taxa. Slug pode ja existir." };
  }
}

export async function updateFee(
  id: number,
  data: {
    name: string;
    slug: string;
    type: string;
    value: number;
    appliesTo: string;
    paymentMethod: string | null;
    active: boolean;
  }
) {
  await requireAdmin();
  const parsed = feeSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  try {
    await sql`
      UPDATE fees SET name = ${parsed.data.name}, slug = ${parsed.data.slug}, type = ${parsed.data.type},
      value = ${parsed.data.value}, applies_to = ${parsed.data.appliesTo}, payment_method = ${parsed.data.paymentMethod},
      active = ${parsed.data.active}, updated_at = NOW()
      WHERE id = ${id}
    `;
    revalidatePath("/fees");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Erro ao atualizar taxa" };
  }
}

export async function deleteFee(id: number) {
  await requireAdmin();
  try {
    await sql`DELETE FROM fees WHERE id = ${id}`;
    revalidatePath("/fees");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Erro ao deletar taxa" };
  }
}

// ---- INTEGRATIONS (API Keys) ----
export async function createApiKey(data: {
  origin: string;
  outbound_url?: string;
  outbound_api_key?: string;
}) {
  await requireAdmin();
  if (!data.origin.trim()) return { error: "Origin obrigatório" };

  // Generate a random API key
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const apiKey = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");

  try {
    await sql`
      INSERT INTO api_keys (origin, api_key, outbound_url, outbound_api_key)
      VALUES (${data.origin.trim().toLowerCase()}, ${apiKey}, ${data.outbound_url?.trim() || null}, ${data.outbound_api_key?.trim() || null})
    `;
    revalidatePath("/integracoes");
    return { success: true, apiKey };
  } catch {
    return { error: "Erro ao criar integração. Origin pode já existir." };
  }
}

export async function updateApiKey(
  id: number,
  data: { origin: string; active: boolean; outbound_url?: string; outbound_api_key?: string }
) {
  await requireAdmin();
  if (!data.origin.trim()) return { error: "Origin obrigatório" };

  try {
    await sql`
      UPDATE api_keys
      SET origin = ${data.origin.trim().toLowerCase()},
          active = ${data.active},
          outbound_url = ${data.outbound_url?.trim() || null},
          outbound_api_key = ${data.outbound_api_key?.trim() || null}
      WHERE id = ${id}
    `;
    revalidatePath("/integracoes");
    return { success: true };
  } catch {
    return { error: "Erro ao atualizar integração" };
  }
}

export async function regenerateApiKey(id: number) {
  await requireAdmin();
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const apiKey = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");

  try {
    await sql`UPDATE api_keys SET api_key = ${apiKey} WHERE id = ${id}`;
    revalidatePath("/integracoes");
    return { success: true, apiKey };
  } catch {
    return { error: "Erro ao regenerar chave" };
  }
}

export async function deleteApiKey(id: number) {
  await requireAdmin();
  try {
    await sql`DELETE FROM api_keys WHERE id = ${id}`;
    revalidatePath("/integracoes");
    return { success: true };
  } catch {
    return { error: "Erro ao deletar integração" };
  }
}

// ---- AFFILIATE CHECKOUT ID ----
export async function updateAffiliateCheckoutId(checkoutId: string) {
  const session = await requireAdminOrAffiliate();
  if (session.role !== "AFFILIATE") return { error: "Apenas afiliados podem alterar o Checkout ID" };
  try {
    await sql`UPDATE users SET payt_checkout_id = ${checkoutId.trim() || null} WHERE id = ${session.id}`;
    revalidatePath("/integracoes");
    return { success: true };
  } catch {
    return { error: "Erro ao salvar Checkout ID" };
  }
}

export async function upsertAffiliatePlanCheckout(planId: number, checkoutId: string) {
  const session = await requireAdminOrAffiliate();
  if (session.role !== "AFFILIATE") return { error: "Apenas afiliados podem alterar Checkout ID de planos" };
  try {
    if (checkoutId.trim()) {
      await sql`
        INSERT INTO affiliate_plan_checkouts (affiliate_id, plan_id, payt_checkout_id)
        VALUES (${session.id}, ${planId}, ${checkoutId.trim()})
        ON CONFLICT (affiliate_id, plan_id) DO UPDATE SET payt_checkout_id = ${checkoutId.trim()}, updated_at = NOW()
      `;
    } else {
      await sql`DELETE FROM affiliate_plan_checkouts WHERE affiliate_id = ${session.id} AND plan_id = ${planId}`;
    }
    revalidatePath("/plans");
    return { success: true };
  } catch {
    return { error: "Erro ao salvar Checkout ID do plano" };
  }
}

// ---- GOALS ----
export async function updateUserGoal(userId: number, goal: number) {
  await requireAdmin();
  try {
    await sql`UPDATE users SET monthly_goal = ${goal} WHERE id = ${userId}`;
    return { success: true };
  } catch {
    return { error: "Erro ao atualizar meta do usuario" };
  }
}

export async function updateTeamGoal(goal: number) {
  await requireAdmin();
  try {
    await sql`UPDATE ranking_settings SET team_goal = ${goal} WHERE id = 1`;
    return { success: true };
  } catch {
    return { error: "Erro ao atualizar meta do time" };
  }
}
