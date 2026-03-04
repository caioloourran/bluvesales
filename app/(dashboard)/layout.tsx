import React from "react"
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { AppSidebar } from "@/components/app-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  let userAvatar: string | null = null;
  try {
    const avatarRow = await sql`SELECT avatar FROM users WHERE id = ${session.id} LIMIT 1`;
    userAvatar = (avatarRow[0]?.avatar as string | null) ?? null;
  } catch {
    // avatar column may not exist yet — run migration 011
  }

  let roletaEnabled = false;
  try {
    const roletaRow = await sql`SELECT enabled FROM roleta_settings WHERE lock = true LIMIT 1`;
    roletaEnabled = roletaRow[0]?.enabled === true;
  } catch {
    // roleta tables may not exist yet — run migration 012
  }

  return (
    <div className="flex h-svh flex-col overflow-hidden lg:flex-row">
      <AppSidebar userName={session.name} userRole={session.role} userAvatar={userAvatar} roletaEnabled={roletaEnabled} />
      <main className="flex-1 overflow-y-auto bg-muted/30 p-4 lg:p-6">
        {children}
      </main>
    </div>
  );
}
