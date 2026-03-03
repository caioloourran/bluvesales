"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createFee, updateFee, deleteFee } from "@/lib/actions/admin-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2, Percent, DollarSign } from "lucide-react";
import { formatBRL } from "@/lib/format";

interface Fee {
  id: number;
  name: string;
  slug: string;
  type: string;
  value: string;
  applies_to: string;
  active: boolean;
}

interface Props {
  fees: Fee[];
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_|_$)/g, "");
}

export function FeesClient({ fees }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Fee | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [value, setValue] = useState("");
  const [appliesTo, setAppliesTo] = useState<"SALE" | "INVESTMENT">("SALE");
  const [active, setActive] = useState(true);

  function openCreate() {
    setEditing(null);
    setName("");
    setSlug("");
    setType("PERCENT");
    setValue("");
    setAppliesTo("SALE");
    setActive(true);
    setDialogOpen(true);
  }

  function openEdit(f: Fee) {
    setEditing(f);
    setName(f.name);
    setSlug(f.slug);
    setType(f.type as "PERCENT" | "FIXED");
    setValue(f.value);
    setAppliesTo(f.applies_to as "SALE" | "INVESTMENT");
    setActive(f.active);
    setDialogOpen(true);
  }

  function handleNameChange(val: string) {
    setName(val);
    if (!editing) {
      setSlug(slugify(val));
    }
  }

  function handleSave() {
    const data = { name, slug, type, value: Number(value), appliesTo, active };
    startTransition(async () => {
      const result = editing
        ? await updateFee(editing.id, data)
        : await createFee(data);
      if (result.error) toast.error(result.error);
      else {
        toast.success(editing ? "Taxa atualizada!" : "Taxa criada!");
        setDialogOpen(false);
        router.refresh();
      }
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Deseja realmente deletar esta taxa?")) return;
    startTransition(async () => {
      const result = await deleteFee(id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Taxa deletada!");
        router.refresh();
      }
    });
  }

  const saleFees = fees.filter((f) => f.applies_to === "SALE");
  const investmentFees = fees.filter((f) => f.applies_to === "INVESTMENT");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Taxas</h1>
          <p className="text-sm text-muted-foreground">
            Configure as taxas aplicadas sobre vendas e investimento
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} size="sm">
              <Plus className="mr-2 h-4 w-4" /> Nova Taxa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Editar Taxa" : "Nova Taxa"}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-1.5">
                <Label>Nome da Taxa</Label>
                <Input
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Taxa Plataforma Hotmart"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Identificador (slug)</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="taxa_plataforma"
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Aplica-se a</Label>
                <Select
                  value={appliesTo}
                  onValueChange={(v) =>
                    setAppliesTo(v as "SALE" | "INVESTMENT")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SALE">Sobre a Venda</SelectItem>
                    <SelectItem value="INVESTMENT">
                      Sobre o Investimento
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Tipo</Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as "PERCENT" | "FIXED")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Percentual (%)</SelectItem>
                    <SelectItem value="FIXED">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>
                  {type === "PERCENT" ? "Valor (%)" : "Valor (R$)"}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={type === "PERCENT" ? "Ex: 9.9" : "Ex: 5.00"}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={active} onCheckedChange={setActive} />
                <Label>Ativa</Label>
              </div>
              <Button onClick={handleSave} disabled={isPending}>
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Como funciona:</strong> As taxas sobre a venda
          sao debitadas do valor bruto antes de calcular a comissao do vendedor.
          A comissao e calculada sobre o valor que sobra apos as taxas da plataforma.
          O lucro da empresa e: Valor Bruto - Taxas Plataforma - Comissao Vendedor
          - Custo do Produto - Frete - Investimento em Anuncio - Impostos sobre Investimento.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Taxas sobre Vendas</CardTitle>
          <CardDescription>
            Debitadas do valor de cada venda (ex: taxa Hotmart, imposto NF)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {saleFees.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma taxa sobre vendas cadastrada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saleFees.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-sm">
                        {f.type === "PERCENT" ? (
                          <Percent className="h-3.5 w-3.5" />
                        ) : (
                          <DollarSign className="h-3.5 w-3.5" />
                        )}
                        {f.type === "PERCENT" ? "Percentual" : "Fixo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {f.type === "PERCENT"
                        ? `${Number(f.value)}%`
                        : formatBRL(Number(f.value))}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${f.active ? "bg-chart-2/10 text-chart-2" : "bg-muted text-muted-foreground"}`}
                      >
                        {f.active ? "Ativa" : "Inativa"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(f)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(f.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Taxas sobre Investimento
          </CardTitle>
          <CardDescription>
            Aplicadas sobre o valor investido em anuncios (ex: imposto sobre
            Meta Ads)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {investmentFees.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma taxa sobre investimento cadastrada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investmentFees.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-sm">
                        {f.type === "PERCENT" ? (
                          <Percent className="h-3.5 w-3.5" />
                        ) : (
                          <DollarSign className="h-3.5 w-3.5" />
                        )}
                        {f.type === "PERCENT" ? "Percentual" : "Fixo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {f.type === "PERCENT"
                        ? `${Number(f.value)}%`
                        : formatBRL(Number(f.value))}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${f.active ? "bg-chart-2/10 text-chart-2" : "bg-muted text-muted-foreground"}`}
                      >
                        {f.active ? "Ativa" : "Inativa"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(f)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(f.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
