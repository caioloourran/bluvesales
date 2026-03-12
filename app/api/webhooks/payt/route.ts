// app/api/webhooks/payt/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // Parse body — could be JSON or form-encoded
    const contentType = req.headers.get("content-type") || "";
    let payload: Record<string, unknown>;

    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      payload = Object.fromEntries(formData.entries());
    } else {
      // Try JSON first, fallback to text
      const text = await req.text();
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { raw: text };
      }
    }

    // Log the webhook for debugging
    await sql`INSERT INTO webhook_logs (source, payload) VALUES ('payt', ${JSON.stringify(payload)})`;

    // Try to find order by utm_id (which we set as order ID in the checkout URL)
    const utmId = payload.utm_id ?? payload.utmId ?? payload.external_reference ?? payload.externalReference;
    const status = payload.status ?? payload.transaction_status ?? payload.payment_status;

    if (utmId && status) {
      const orderId = Number(utmId);
      if (!isNaN(orderId) && orderId > 0) {
        // Map Payt status to our status
        const statusStr = String(status).toLowerCase();
        const isPaid = statusStr === "approved" || statusStr === "aprovada" || statusStr === "finalizada" ||
                       statusStr === "paid" || statusStr === "pago" || statusStr === "completed";

        if (isPaid) {
          await sql`
            UPDATE orders
            SET status_pagamento = 'pago',
                status = 'pagos'
            WHERE id = ${orderId}
          `;
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("Payt webhook error:", err);
    // Always return 200 to avoid retries
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

// Payt might send GET to verify the URL
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
