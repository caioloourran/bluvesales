// app/api/webhooks/payt/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let payload: Record<string, unknown>;

    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      payload = Object.fromEntries(formData.entries());
    } else {
      const text = await req.text();
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { raw: text };
      }
    }

    // Log the webhook for debugging
    await sql`INSERT INTO webhook_logs (source, payload) VALUES ('payt', ${JSON.stringify(payload)})`;

    // Payt V1 format:
    // - status: "paid" | "waiting_payment" | "refunded" | "chargeback" | etc.
    // - link.query_params.utm_id: our order ID (passed in checkout URL)
    // - link.sources.utm_id: fallback (Payt puts utm_id in query_params, not sources)
    // - transaction_id: Payt transaction ID
    const status = String(payload.status || "").toLowerCase();
    const link = payload.link as Record<string, unknown> | undefined;
    const queryParams = link?.query_params as Record<string, unknown> | undefined;
    const sources = link?.sources as Record<string, unknown> | undefined;
    const utmId = queryParams?.utm_id ?? sources?.utm_id;

    if (utmId) {
      const orderId = Number(utmId);
      if (!isNaN(orderId) && orderId > 0) {
        const transactionId = payload.transaction_id as string | undefined;

        if (status === "paid") {
          await sql`
            UPDATE orders
            SET status_pagamento = 'pago',
                status = 'pagos',
                payt_transaction_id = ${transactionId || null}
            WHERE id = ${orderId}
          `;
        } else if (status === "waiting_payment") {
          await sql`
            UPDATE orders
            SET status_pagamento = 'aguardando',
                payt_transaction_id = ${transactionId || null}
            WHERE id = ${orderId}
          `;
        } else if (status === "refunded" || status === "chargeback") {
          await sql`
            UPDATE orders
            SET status_pagamento = ${status},
                payt_transaction_id = ${transactionId || null}
            WHERE id = ${orderId}
          `;
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("Payt webhook error:", err);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok" });
}
