import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "Login - Dashboard Comercial",
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
      {/* Decorative blur orbs */}
      <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/5 blur-2xl" />

      {/* Form */}
      <div className="relative z-10 w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
