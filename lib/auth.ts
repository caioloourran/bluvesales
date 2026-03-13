import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash } from "crypto";
import { sql } from "./db";

export type UserRole = "ADMIN_MASTER" | "SELLER" | "COBRANCA" | "AFFILIATE";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

const SESSION_COOKIE = "session_token";
const SESSION_SECRET = process.env.NEXTAUTH_SECRET || "default-secret-change-me";

function encodeSession(user: SessionUser): string {
  const payload = JSON.stringify(user);
  const signature = createHash("sha256")
    .update(payload + SESSION_SECRET)
    .digest("hex");
  return Buffer.from(JSON.stringify({ payload, signature })).toString("base64");
}

function decodeSession(token: string): SessionUser | null {
  try {
    const { payload, signature } = JSON.parse(
      Buffer.from(token, "base64").toString("utf-8")
    );
    const expectedSig = createHash("sha256")
      .update(payload + SESSION_SECRET)
      .digest("hex");
    if (signature !== expectedSig) return null;
    return JSON.parse(payload) as SessionUser;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return createHash("sha256").update(password).digest("hex");
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const hashed = createHash("sha256").update(password).digest("hex");
  return hashed === hash;
}

export async function login(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const rows = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
  if (rows.length === 0) return null;
  const user = rows[0];
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return null;
  const sessionUser: SessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
  };
  const token = encodeSession(sessionUser);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return sessionUser;
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireAuth();
  if (session.role !== "ADMIN_MASTER") {
    redirect("/dashboard");
  }
  return session;
}

export async function requireAdminOrAffiliate(): Promise<SessionUser> {
  const session = await requireAuth();
  if (session.role !== "ADMIN_MASTER" && session.role !== "AFFILIATE") {
    redirect("/dashboard");
  }
  return session;
}
