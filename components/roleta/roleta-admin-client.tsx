"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createPrize,
  updatePrize,
  deletePrize,
  updateRoletaSettings,
} from "@/lib/actions/roleta-actions";
import { SpinningWheel } from "@/components/roleta/spinning-wheel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2, Gift } from "lucide-react";

const PALETTE = [
  "#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF",
  "#FF922B", "#CC5DE8", "#20C997", "#F06595",
  "#74C0FC", "#FFA94D", "#A9E34B", "#DA77F2",
];

interface Prize {
  id: number;
  label: string;
  color: string;
  position: number;
  active: boolean;
}

interface Settings {
  enabled: boolean;
  spins_per_day: number;
}

interface Props {
  prizes: Prize[];
  settings: Settings;
}

export function RoletaAdminClient({ prizes, settings }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Prize | null>(null);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const [position, setPosition] = useState(0);
  const [active, setActive] = useState(true);

  // Settings
  const [enabled, setEnabled] = useState(settings.enabled);
  const [spinsPerDay, setSpinsPerDay] = useState(settings.spins_per_day);

  function openCreate() {
    setEditing(null);
    setLabel("");
    setColor(PALETTE[prizes.length % PALETTE.length]);
    setPosition(prizes.length);
    setActive(true);
    setDialogOpen(true);
  }

  function openEdit(p: Prize) {
    setEditing(p);
    setLabel(p.label);
    setColor(p.color);
    setPosition(p.position);
    setActive(p.active);
    setDialogOpen(true);
  }

  function handleSavePrize() {
    startTransition(async () => {
      const result = editing
        ? await updatePrize(editing.id, { label, color, position, active })
        : await createPrize({ label, color, position, active });
      if (result.error) toast.error(result.error);
      else {
        toast.success(editing ? "Premio atualizado!" : "Premio criado!");
        setDialogOpen(false);
        router.refresh();
      }
    });
  }

  function handleDeletePrize(id: number) {
    if (!confirm("Deseja realmente deletar este premio?")) return;
    startTransition(async () => {
      const result = await deletePrize(id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Premio deletado!");
        router.refresh();
      }
    });
  }

  function handleToggleEnabled(val: boolean) {
    setEnabled(val);
    startTransition(async () => {
      const result = await updateRoletaSettings({ enabled: val, spinsPerDay });
      if (result.error) {
        toast.error(result.error);
        setEnabled(!val);
      } else {
        toast.success(val ? "Roleta ativada!" : "Roleta desativada!");
        router.refresh();
      }
    });
  }

  function handleSaveSettings() {
    startTransition(async () => {
      const result = await updateRoletaSettings({ enabled, spinsPerDay });
      if (result.error) toast.error(result.error);
      else toast.success("Configuracoes salvas!");
    });
  }

  const activePrizes = prizes.filter((p) => p.active);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Gift className="h-6 w-6 text-primary" />
            Roleta de Premios
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure os premios e ative a roleta para os vendedores
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Novo Premio
        </Button>
      </div>

      {/* Settings card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuracoes</CardTitle>
          <CardDescription>
            Quando ativada, a roleta aparece no menu dos vendedores
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Roleta Ativa</p>
              <p className="text-xs text-muted-foreground">
                Os vendedores poderao ver e girar a roleta
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={handleToggleEnabled}
              disabled={isPending}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap text-sm">Giros por dia</Label>
              <Input
                type="number"
                min={1}
                value={spinsPerDay}
                onChange={(e) => setSpinsPerDay(Number(e.target.value))}
                className="w-20"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={handleSaveSettings}
            >
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two-column: table + preview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Prize table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Premios Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {prizes.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum premio cadastrado. Clique em &quot;Novo Premio&quot; para comecar.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">Cor</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="w-14 text-center">Pos</TableHead>
                      <TableHead className="w-20">Status</TableHead>
                      <TableHead className="w-24 text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prizes.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div
                            className="h-6 w-6 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: p.color }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{p.label}</TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {p.position}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={p.active ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {p.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(p)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeletePrize(p.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wheel preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview da Roda</CardTitle>
            <CardDescription>Visualizacao com os premios ativos</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            {activePrizes.length < 2 ? (
              <p className="py-8 text-sm text-muted-foreground">
                Adicione pelo menos 2 premios ativos para visualizar a roda.
              </p>
            ) : (
              <SpinningWheel prizes={activePrizes} previewMode />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prize dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Premio" : "Novo Premio"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label>Nome do Premio</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex: R$ 50 de bonus"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Cor do Segmento</Label>
              <div className="flex flex-wrap gap-2">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-all hover:scale-110 ${
                      color === c
                        ? "border-foreground ring-2 ring-foreground/20 scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#FF6B6B"
                className="mt-1 font-mono text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Posicao (ordem na roda)</Label>
              <Input
                type="number"
                value={position}
                onChange={(e) => setPosition(Number(e.target.value))}
                min={0}
                className="w-24"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={active} onCheckedChange={setActive} />
              <Label>Ativo (aparece na roda)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePrize} disabled={isPending || !label.trim()}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
