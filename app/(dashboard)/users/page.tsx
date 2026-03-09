import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { UsersClient } from "@/components/admin/users-client";

export const metadata = {
  title: "Usuarios - Admin",
};

export default async function UsersPage() {
  await requireAdmin();
  const users = await sql`SELECT id, name, email, role, created_at, avatar, monthly_goal FROM users ORDER BY created_at DESC`;
  const settingsRows = await sql`SELECT team_goal FROM ranking_settings WHERE id = 1`;
  const teamGoal = Number(settingsRows[0]?.team_goal ?? 0);
  return <UsersClient users={users} teamGoal={teamGoal} />;
}
