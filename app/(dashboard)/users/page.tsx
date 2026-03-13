import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { UsersClient } from "@/components/admin/users-client";

export const metadata = {
  title: "Usuarios - Admin",
};

export default async function UsersPage() {
  const session = await requireAuth();
  const isAdmin = session.role === "ADMIN_MASTER";
  const isAffiliate = session.role === "AFFILIATE";

  if (!isAdmin && !isAffiliate) redirect("/dashboard");

  let users;
  if (isAffiliate) {
    // Affiliate sees only their linked sellers
    users = await sql`
      SELECT id, name, email, role, created_at, avatar, monthly_goal
      FROM users
      WHERE affiliate_id = ${session.id}
      ORDER BY created_at DESC
    `;
  } else {
    users = await sql`
      SELECT u.id, u.name, u.email, u.role, u.created_at, u.avatar, u.monthly_goal,
             u.affiliate_id, a.name AS affiliate_name
      FROM users u
      LEFT JOIN users a ON a.id = u.affiliate_id
      ORDER BY u.created_at DESC
    `;
  }

  const settingsRows = await sql`SELECT team_goal FROM ranking_settings WHERE id = 1`;
  const teamGoal = Number(settingsRows[0]?.team_goal ?? 0);

  return <UsersClient users={users} teamGoal={teamGoal} isAffiliate={isAffiliate} affiliateId={isAffiliate ? session.id : undefined} />;
}
