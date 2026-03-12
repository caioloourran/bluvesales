// lib/api-auth.ts
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

/**
 * Validates API key from Authorization header against the given origin.
 * Returns null on success, or a NextResponse error on failure.
 */
export async function validateApiKey(
  request: NextRequest,
  origin: string
): Promise<NextResponse | null> {
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
    SELECT ak.origin
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

  return null; // auth OK
}
