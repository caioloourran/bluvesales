// app/api/v1/pedidos/[origin]/[orderId]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { validateApiKey } from "@/lib/api-auth";

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
];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ origin: string; orderId: string }> }
) {
  const { origin, orderId } = await params;

  // Auth
  const authError = await validateApiKey(request, origin);
  if (authError) return authError;

  // Parse body
  let body: { status: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.status) {
    return NextResponse.json(
      { error: "Missing required field: status" },
      { status: 400 }
    );
  }

  if (!VALID_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  // Update order
  const result = await sql`
    UPDATE orders
    SET status = ${body.status}, updated_at = NOW()
    WHERE id = ${Number(orderId)} AND origin = ${origin}
  `;

  if (result.count === 0) {
    return NextResponse.json(
      { error: "Order not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    message: "Status updated",
    order_id: Number(orderId),
    status: body.status,
  });
}
