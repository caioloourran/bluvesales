"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ShoppingCart,
  Megaphone,
  Package,
  Layers,
  Percent,
  Users,
  LogOut,
  Sun,
  Moon,
  Trophy,
  ClipboardList,
  Receipt,
  Banknote,
  CalendarDays,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth-actions";

interface AppSidebarProps {
  userName: string;
  userRole: string;
}

const adminLinks = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/resultado-diario", label: "Resultado Diario", icon: CalendarDays },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/sales", label: "Vendas", icon: ShoppingCart },
  { href: "/history", label: "Historico", icon: ClipboardList },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
  { href: "/cobranca", label: "Cobranca", icon: Banknote },
  { href: "/products", label: "Produtos", icon: Package },
  { href: "/plans", label: "Planos", icon: Layers },
  { href: "/commissions", label: "Comissoes", icon: Percent },
  { href: "/fees", label: "Taxas", icon: Receipt },
  { href: "/users", label: "Usuarios", icon: Users },
];

const cobrancaLinks = [
  { href: "/cobranca", label: "Cobranca", icon: Banknote },
];

const sellerLinks = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/sales", label: "Vendas", icon: ShoppingCart },
  { href: "/history", label: "Historico", icon: ClipboardList },
];

export function AppSidebar({ userName, userRole }: AppSidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const links = userRole === "ADMIN_MASTER" ? adminLinks : userRole === "COBRANCA" ? cobrancaLinks : sellerLinks;

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-card">
      <div className="flex items-center gap-3 border-b px-6 py-5">
        <Image
          src="/logo.png"
          alt="Bluve Sales"
          width={36}
          height={36}
          className="rounded-lg"
        />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">
            Bluve Sales
          </span>
          <span className="text-xs text-muted-foreground">Performance</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-3 py-4">
        <div className="mb-3 px-3">
          <p className="text-sm font-medium text-foreground">{userName}</p>
          <p className="text-xs text-muted-foreground">
            {userRole === "ADMIN_MASTER" ? "Administrador" : userRole === "COBRANCA" ? "Cobranca" : "Vendedor"}
          </p>
        </div>
        <Button
          variant="ghost"
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
        </Button>
        <form action={logoutAction}>
          <Button
            variant="ghost"
            type="submit"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </form>
      </div>
    </aside>
  );
}
