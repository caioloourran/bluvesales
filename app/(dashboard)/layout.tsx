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

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar userName={session.name} userRole={session.role} userAvatar={userAvatar} />
      <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
        {children}
      </main>
    </div>
  );
}
