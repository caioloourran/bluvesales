// app/api/v1/pedidos/[origin]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

interface ProductItem {
  code: string;
  name: string;
  price: string;
  quantity: string;
  total_amount: string;
  height?: string;
  width?: string;
  length?: string;
  weight?: string;
  package_type?: string;
}

interface OrderPayload {
  order_number: string;
  origin: string;
  sale_type?: string;
  related_order_number?: string;
  offer_id?: string;
  offer_name?: string;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string;
  customer_type: string;
  customer_doc?: string;
  customer_address: string;
  customer_number: string;
  customer_complement?: string;
  customer_district: string;
  customer_zipcode: string;
  customer_city: string;
  customer_state: string;
  customer_country: string;
  products: ProductItem[];
  total_value: string;
  total_discount: string;
}

const VALID_SALE_TYPES = ["standard", "order_bump", "upsell"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ origin: string }> }
) {
  const { origin } = await params;

  // --- Auth: validate API key ---
  const authHeader = request.headers.get("authorization") ?? "";
  const match = authHeader.match(/^Api-Key\s+(.+)$/i);
  if (!match) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header. Expected: Api-Key <key>" },
      { status: 401 }
    );
  }

  const apiKey = match[1];

  const keyRows = await sql`
    SELECT ak.seller_id, ak.origin
    FROM api_keys ak
    WHERE ak.api_key = ${apiKey}
      AND ak.origin = ${origin}
      AND ak.active = true
  `;

  if (keyRows.length === 0) {
    return NextResponse.json(
      { error: "Invalid API key or origin mismatch" },
      { status: 403 }
    );
  }

  const sellerId = keyRows[0].seller_id as number;

  // --- Parse body ---
  let body: OrderPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // --- Validate required fields ---
  const missing: string[] = [];
  if (!body.order_number) missing.push("order_number");
  if (!body.customer_name) missing.push("customer_name");
  if (!body.customer_type) missing.push("customer_type");
  if (!body.customer_address) missing.push("customer_address");
  if (!body.customer_number) missing.push("customer_number");
  if (!body.customer_district) missing.push("customer_district");
  if (!body.customer_zipcode) missing.push("customer_zipcode");
  if (!body.customer_city) missing.push("customer_city");
  if (!body.customer_state) missing.push("customer_state");
  if (!body.customer_country) missing.push("customer_country");
  if (!body.products || !Array.isArray(body.products) || body.products.length === 0) missing.push("products");
  if (!body.total_value) missing.push("total_value");
  if (body.total_discount === undefined || body.total_discount === null) missing.push("total_discount");

  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Missing required fields", fields: missing },
      { status: 400 }
    );
  }

  // --- Validate sale_type ---
  const saleType = body.sale_type ?? "standard";
  if (!VALID_SALE_TYPES.includes(saleType)) {
    return NextResponse.json(
      { error: `Invalid sale_type. Must be one of: ${VALID_SALE_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  if ((saleType === "order_bump" || saleType === "upsell") && !body.related_order_number) {
    return NextResponse.json(
      { error: "related_order_number is required when sale_type is order_bump or upsell" },
      { status: 400 }
    );
  }

  // --- Validate products ---
  for (let i = 0; i < body.products.length; i++) {
    const p = body.products[i];
    if (!p.code || !p.name || !p.price || !p.quantity || !p.total_amount) {
      return NextResponse.json(
        { error: `Product at index ${i} is missing required fields (code, name, price, quantity, total_amount)` },
        { status: 400 }
      );
    }
  }

  // --- Idempotency check ---
  const existing = await sql`
    SELECT id FROM orders
    WHERE origin = ${origin} AND order_number = ${body.order_number}
  `;

  if (existing.length > 0) {
    return NextResponse.json(
      { message: "Order already exists", order_id: existing[0].id },
      { status: 200 }
    );
  }

  // --- Try to match product from DB ---
  let productId: number | null = null;
  let planId: number | null = null;
  if (body.products.length > 0) {
    const firstProduct = body.products[0];
    const productMatch = await sql`
      SELECT id FROM products
      WHERE LOWER(name) = LOWER(${firstProduct.name}) AND active = true
      LIMIT 1
    `;
    if (productMatch.length > 0) {
      productId = productMatch[0].id as number;
      const planMatch = await sql`
        SELECT id FROM plans
        WHERE product_id = ${productId} AND active = true
        LIMIT 1
      `;
      if (planMatch.length > 0) {
        planId = planMatch[0].id as number;
      }
    }
  }

  // --- Insert order ---
  try {
    const result = await sql`
      INSERT INTO orders (
        cpf, nome, email, whatsapp,
        cep, rua, numero, bairro, cidade, estado, complemento,
        product_id, plan_id, seller_id,
        order_number, origin, sale_type, related_order_number,
        offer_id, offer_name, customer_type, customer_country,
        total_value, total_discount,
        status
      ) VALUES (
        ${body.customer_doc ?? ""},
        ${body.customer_name},
        ${body.customer_email ?? null},
        ${body.customer_phone ?? ""},
        ${body.customer_zipcode},
        ${body.customer_address},
        ${body.customer_number},
        ${body.customer_district},
        ${body.customer_city},
        ${body.customer_state},
        ${body.customer_complement ?? null},
        ${productId},
        ${planId},
        ${sellerId},
        ${body.order_number},
        ${origin},
        ${saleType},
        ${body.related_order_number ?? null},
        ${body.offer_id ?? null},
        ${body.offer_name ?? null},
        ${body.customer_type},
        ${body.customer_country},
        ${parseFloat(body.total_value)},
        ${parseFloat(body.total_discount)},
        'reportados'
      )
      RETURNING id
    `;

    const orderId = result[0].id as number;

    // --- Insert order items ---
    for (const item of body.products) {
      await sql`
        INSERT INTO order_items (
          order_id, code, name, price, quantity, total_amount,
          height, width, length, weight, package_type
        ) VALUES (
          ${orderId},
          ${item.code},
          ${item.name},
          ${parseFloat(item.price)},
          ${parseFloat(item.quantity)},
          ${parseFloat(item.total_amount)},
          ${item.height ? parseFloat(item.height) : null},
          ${item.width ? parseFloat(item.width) : null},
          ${item.length ? parseFloat(item.length) : null},
          ${item.weight ? parseFloat(item.weight) : null},
          ${item.package_type ?? null}
        )
      `;
    }

    return NextResponse.json(
      { message: "Order created successfully", order_id: orderId },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating order via API:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
