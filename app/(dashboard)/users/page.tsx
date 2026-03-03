import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { UsersClient } from "@/components/admin/users-client";

export const metadata = {
  title: "Usuarios - Admin",
};

export default async function UsersPage() {
  await requireAdmin();
  const users = await sql`SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC`;
  return <UsersClient users={users} />;
}
