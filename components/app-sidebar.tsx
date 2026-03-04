"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  LayoutDashboard,
  Camera,
  Menu,
  Gift,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { logoutAction } from "@/lib/actions/auth-actions";
import { updateAvatarAction } from "@/lib/actions/profile-actions";

interface AppSidebarProps {
  userName: string;
  userRole: string;
  userAvatar?: string | null;
  roletaEnabled?: boolean;
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
  { href: "/roleta", label: "Roleta", icon: Gift },
];

const cobrancaLinks = [
  { href: "/meu-desempenho", label: "Meu Desempenho", icon: LayoutDashboard },
  { href: "/cobranca", label: "Cobranca", icon: Banknote },
];

const sellerLinks = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/sales", label: "Vendas", icon: ShoppingCart },
  { href: "/history", label: "Historico", icon: ClipboardList },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function resizeToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 150;
      canvas.height = 150;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      const size = Math.min(img.width, img.height);
      const x = (img.width - size) / 2;
      const y = (img.height - size) / 2;
      ctx.drawImage(img, x, y, size, size, 0, 0, 150, 150);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function AppSidebar({ userName, userRole, userAvatar, roletaEnabled }: AppSidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const baseLinks = userRole === "ADMIN_MASTER" ? adminLinks : userRole === "COBRANCA" ? cobrancaLinks : sellerLinks;
  const links = userRole === "SELLER" && roletaEnabled
    ? [...baseLinks, { href: "/roleta-vendedor", label: "Roleta", icon: Gift }]
    : baseLinks;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await resizeToBase64(file);
      setPreview(base64);
    } catch {
      toast.error("Erro ao processar imagem");
    }
  }

  async function handleSave() {
    if (!preview) return;
    setSaving(true);
    const result = await updateAvatarAction(preview);
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Foto atualizada!");
      setDialogOpen(false);
      setPreview(null);
    }
  }

  async function handleRemove() {
    setSaving(true);
    const result = await updateAvatarAction("");
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Foto removida");
      setDialogOpen(false);
      setPreview(null);
    }
  }

  function openDialog() {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setDialogOpen(true);
  }

  const initials = getInitials(userName);
  const currentAvatar = userAvatar || null;
  const roleLabel = userRole === "ADMIN_MASTER" ? "Administrador" : userRole === "COBRANCA" ? "Cobranca" : "Vendedor";

  // Shared sidebar content (used in both desktop aside and mobile Sheet)
  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo header */}
      <div className="flex items-center gap-3 border-b px-6 py-5">
        <Image src="/logo.png" alt="Bluve Sales" width={36} height={36} className="rounded-lg" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">Bluve Sales</span>
          <span className="text-xs text-muted-foreground">Performance</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
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
              <link.icon className="h-4 w-4 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t px-3 py-4">
        <div className="mb-3 flex items-center gap-3 px-3">
          <button
            type="button"
            onClick={openDialog}
            className="group relative shrink-0 focus:outline-none"
            title="Alterar foto"
          >
            {currentAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentAvatar}
                alt={userName}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-border transition group-hover:ring-primary"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 ring-2 ring-border transition group-hover:ring-primary">
                <span className="text-sm font-semibold text-primary">{initials}</span>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100">
              <Camera className="h-4 w-4 text-white" />
            </div>
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{userName}</p>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
    </div>
  );

  return (
    <>
      {/* Mobile top header */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4 lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} className="-ml-1">
          <Menu className="h-5 w-5" />
        </Button>
        <Image src="/logo.png" alt="Bluve Sales" width={28} height={28} className="rounded-md" />
        <span className="text-sm font-semibold text-foreground">Bluve Sales</span>
      </header>

      {/* Mobile Sheet drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu de navegacao</SheetTitle>
          </SheetHeader>
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r bg-card lg:flex">
        {sidebarContent}
      </aside>

      {/* Avatar upload dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Foto de Perfil</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Preview" className="h-28 w-28 rounded-full object-cover ring-2 ring-border" />
              ) : currentAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentAvatar} alt={userName} className="h-28 w-28 rounded-full object-cover ring-2 ring-border" />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary/15 ring-2 ring-border">
                  <span className="text-3xl font-semibold text-primary">{initials}</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
              <Camera className="mr-2 h-4 w-4" />
              Escolher foto
            </Button>
            {preview && (
              <Button type="button" className="w-full" disabled={saving} onClick={handleSave}>
                {saving ? "Salvando..." : "Salvar foto"}
              </Button>
            )}
            {currentAvatar && !preview && (
              <Button type="button" variant="ghost" className="w-full text-destructive hover:text-destructive" disabled={saving} onClick={handleRemove}>
                {saving ? "Removendo..." : "Remover foto"}
              </Button>
            )}
          </div>
          <DialogFooter />
        </DialogContent>
      </Dialog>
    </>
  );
}
