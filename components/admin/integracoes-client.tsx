// components/admin/integracoes-client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Copy,
  RefreshCw,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  Plug,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {

  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  createApiKey,
  updateApiKey,
  regenerateApiKey,
  deleteApiKey,
} from "@/lib/actions/admin-actions";
import { cn } from "@/lib/utils";

interface Integration {
  id: number;
  origin: string;
  api_key: string;
  active: boolean;
  created_at: string;
}

interface Props {
  integrations: Integration[];
}

export function IntegracoesClient({ integrations }: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Integration | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Integration | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newKeyDialog, setNewKeyDialog] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set());
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Form state
  const [origin, setOrigin] = useState("");
  const [active, setActive] = useState(true);

  function openCreate() {
    setEditTarget(null);
    setOrigin("");
    setActive(true);
    setFormOpen(true);
  }

  function openEdit(item: Integration) {
    setEditTarget(item);
    setOrigin(item.origin);
    setActive(item.active);
    setFormOpen(true);
  }

  async function handleSave() {
    if (!origin.trim()) {
      toast.error("Preencha o nome do sistema");
      return;
    }
    setSaving(true);
    if (editTarget) {
      const result = await updateApiKey(editTarget.id, {
        origin,
        active,
      });
      setSaving(false);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Integração atualizada!");
        setFormOpen(false);
        router.refresh();
      }
    } else {
      const result = await createApiKey({ origin });
      setSaving(false);
      if (result.error) {
        toast.error(result.error);
      } else {
        setFormOpen(false);
        setNewKeyDialog(result.apiKey!);
        router.refresh();
      }
    }
  }

  async function handleRegenerate(item: Integration) {
    const result = await regenerateApiKey(item.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      setNewKeyDialog(result.apiKey!);
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteApiKey(deleteTarget.id);
    setDeleting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Integração removida!");
      setDeleteTarget(null);
      router.refresh();
    }
  }

  function toggleKeyVisibility(id: number) {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function copyKey(key: string, id: number) {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    toast.success("Chave copiada!");
    setTimeout(() => setCopiedId(null), 2000);
  }

  function maskKey(key: string) {
    return key.slice(0, 8) + "••••••••••••••••" + key.slice(-4);
  }

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString("pt-BR");
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Integrações</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gerencie as chaves de API para sistemas externos
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Nova Integração
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 py-4 sm:px-6">
        {integrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Plug className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Nenhuma integração configurada
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Crie uma integração para permitir que sistemas externos enviem
              pedidos
            </p>
            <Button onClick={openCreate} size="sm" className="mt-4">
              <Plus className="mr-1.5 h-4 w-4" />
              Nova Integração
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {integrations.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "rounded-xl border bg-card p-5 transition-colors",
                  item.active
                    ? "border-border"
                    : "border-border/50 opacity-60"
                )}
              >
                {/* Card header */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        item.active
                          ? "bg-emerald-500/15 text-emerald-500"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Plug className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.origin}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      item.active
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {item.active ? "Ativo" : "Inativo"}
                  </span>
                </div>

                {/* API Key */}
                <div className="mb-4">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    API Key
                  </p>
                  <div className="flex items-center gap-1.5">
                    <code className="flex-1 truncate rounded-md bg-muted px-2.5 py-1.5 font-mono text-xs">
                      {visibleKeys.has(item.id)
                        ? item.api_key
                        : maskKey(item.api_key)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => toggleKeyVisibility(item.id)}
                    >
                      {visibleKeys.has(item.id) ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => copyKey(item.api_key, item.id)}
                    >
                      {copiedId === item.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Endpoint */}
                <div className="mb-4">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Endpoint
                  </p>
                  <code className="block truncate rounded-md bg-muted px-2.5 py-1.5 font-mono text-xs text-muted-foreground">
                    POST /api/v1/pedidos/{item.origin}
                  </code>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-[10px] text-muted-foreground">
                    Criado em {formatDate(item.created_at)}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Regenerar chave"
                      onClick={() => handleRegenerate(item)}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Editar"
                      onClick={() => openEdit(item)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      title="Excluir"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Editar Integração" : "Nova Integração"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Origin (nome do sistema)
              </label>
              <Input
                placeholder="ex: 123log"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />
            </div>
            {editTarget && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </label>
                <Select
                  value={active ? "true" : "false"}
                  onValueChange={(v) => setActive(v === "true")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? "Salvando..."
                : editTarget
                  ? "Salvar"
                  : "Criar Integração"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Key Dialog */}
      <Dialog
        open={!!newKeyDialog}
        onOpenChange={(open) => {
          if (!open) setNewKeyDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chave de API Gerada</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Copie esta chave agora. Por segurança, ela pode ser visualizada na
              página de integrações, mas recomendamos guardar em local seguro.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded-md bg-muted px-3 py-2 font-mono text-xs">
                {newKeyDialog}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(newKeyDialog!);
                  toast.success("Chave copiada!");
                }}
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copiar
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewKeyDialog(null)}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir integração &quot;{deleteTarget?.origin}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              A chave de API será removida permanentemente e o sistema externo
              não poderá mais enviar pedidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
