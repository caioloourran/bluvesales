// app/api/v1/pedidos/[origin]/[orderId]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { validateApiKey } from "@/lib/api-auth";

// Internal statuses (column names)
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
];

// Maps courier/logistics status names to internal column statuses
const STATUS_MAPPING: Record<string, string> = {
  // Direct matches (already internal names)
  cadastrados: "cadastrados",
  enviados: "enviados",
  saiu_para_entrega: "saiu_para_entrega",
  retirar_nos_correios: "retirar_nos_correios",
  requer_atencao: "requer_atencao",
  entregues: "entregues",
  cobrados: "cobrados",
  inadimplencias: "inadimplencias",
  aguardando_devolucao: "aguardando_devolucao",
  devolvido: "devolvido",
  frustrados: "frustrados",
  pagos: "pagos",

  // Courier-friendly aliases
  enviado: "enviados",
  saiu_entrega: "saiu_para_entrega",
  em_transito: "saiu_para_entrega",
  retirar_correios: "retirar_nos_correios",
  aguardando_retirada: "retirar_nos_correios",
  falha_entrega: "requer_atencao",
  tentativa_falha: "requer_atencao",
  extravio: "requer_atencao",
  atraso: "requer_atencao",
  devolvido_remetente: "requer_atencao",
  entregue: "entregues",
};

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

  // Resolve status: try mapping first, then direct match
  const inputStatus = body.status.toLowerCase().trim();
  const resolvedStatus = STATUS_MAPPING[inputStatus];

  if (!resolvedStatus) {
    const allAccepted = Object.keys(STATUS_MAPPING).join(", ");
    return NextResponse.json(
      { error: `Invalid status "${body.status}". Accepted values: ${allAccepted}` },
      { status: 400 }
    );
  }

  // Update order
  const result = await sql`
    UPDATE orders
    SET status = ${resolvedStatus}, updated_at = NOW()
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
    status: resolvedStatus,
    mapped_from: inputStatus !== resolvedStatus ? inputStatus : undefined,
  });
}
