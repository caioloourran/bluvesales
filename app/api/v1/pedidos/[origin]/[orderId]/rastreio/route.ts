// app/api/v1/pedidos/[origin]/[orderId]/rastreio/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { validateApiKey } from "@/lib/api-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ origin: string; orderId: string }> }
) {
  const { origin, orderId } = await params;

  // Auth
  const authError = await validateApiKey(request, origin);
  if (authError) return authError;

  // Parse body
  let body: { tracking_code: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.tracking_code) {
    return NextResponse.json(
      { error: "Missing required field: tracking_code" },
      { status: 400 }
    );
  }

  // Update order
  const result = await sql`
    UPDATE orders
    SET tracking_code = ${body.tracking_code}, updated_at = NOW()
    WHERE id = ${Number(orderId)} AND origin = ${origin}
  `;

  if (result.count === 0) {
    return NextResponse.json(
      { error: "Order not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    message: "Tracking code updated",
    order_id: Number(orderId),
    tracking_code: body.tracking_code,
  });
}
