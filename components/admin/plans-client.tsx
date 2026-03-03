"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPlan, updatePlan, deletePlan } from "@/lib/actions/admin-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { formatBRL } from "@/lib/format";

interface Plan {
  id: number;
  product_id: number;
  product_name: string;
  name: string;
  sale_price_gross: string;
  sale_price_net: string | null;
  product_cost: string;
  shipping_cost: string;
  active: boolean;
}

interface Product {
  id: number;
  name: string;
}

interface Props {
  plans: Plan[];
  products: Product[];
}

export function PlansClient({ plans, products }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [productId, setProductId] = useState("");
  const [name, setName] = useState("");
  const [gross, setGross] = useState("");
  const [net, setNet] = useState("");
  const [productCost, setProductCost] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [active, setActive] = useState(true);

  function openCreate() {
    setEditing(null);
    setProductId(products[0]?.id?.toString() || "");
    setName("");
    setGross("");
    setNet("");
    setProductCost("");
    setShippingCost("");
    setActive(true);
    setDialogOpen(true);
  }

  function openEdit(p: Plan) {
    setEditing(p);
    setProductId(String(p.product_id));
    setName(p.name);
    setGross(p.sale_price_gross);
    setNet(p.sale_price_net || "");
    setProductCost(p.product_cost || "0");
    setShippingCost(p.shipping_cost || "0");
    setActive(p.active);
    setDialogOpen(true);
  }

  function handleSave() {
    const data = {
      productId: Number(productId),
      name,
      salePriceGross: Number(gross),
      salePriceNet: net ? Number(net) : null,
      productCost: Number(productCost) || 0,
      shippingCost: Number(shippingCost) || 0,
      active,
    };
    startTransition(async () => {
      const result = editing
        ? await updatePlan(editing.id, data)
        : await createPlan(data);
      if (result.error) toast.error(result.error);
      else {
        toast.success(editing ? "Plano atualizado!" : "Plano criado!");
        setDialogOpen(false);
        router.refresh();
      }
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Deseja realmente deletar este plano?")) return;
    startTransition(async () => {
      const result = await deletePlan(id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Plano deletado!");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Planos</h1>
          <p className="text-sm text-muted-foreground">Gerencie os planos de cada produto</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} size="sm">
              <Plus className="mr-2 h-4 w-4" /> Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Plano" : "Novo Plano"}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-1.5">
                <Label>Produto</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Nome do Plano</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Plano 3 Meses" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Preco Bruto (R$)</Label>
                <Input type="number" step="0.01" value={gross} onChange={(e) => setGross(e.target.value)} placeholder="0.00" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Preco Liquido (R$) - Opcional</Label>
                <Input type="number" step="0.01" value={net} onChange={(e) => setNet(e.target.value)} placeholder="0.00" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Custo do Produto (R$)</Label>
                <Input type="number" step="0.01" value={productCost} onChange={(e) => setProductCost(e.target.value)} placeholder="0.00" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Frete (R$)</Label>
                <Input type="number" step="0.01" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} placeholder="0.00" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={active} onCheckedChange={setActive} />
                <Label>Ativo</Label>
              </div>
              <Button onClick={handleSave} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista de Planos</CardTitle>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum plano cadastrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead className="text-right">Preco Bruto</TableHead>
                  <TableHead className="text-right">Preco Liquido</TableHead>
                  <TableHead className="text-right">Custo Produto</TableHead>
                  <TableHead className="text-right">Frete</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.product_name}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">{formatBRL(Number(p.sale_price_gross))}</TableCell>
                    <TableCell className="text-right">{p.sale_price_net ? formatBRL(Number(p.sale_price_net)) : "-"}</TableCell>
                    <TableCell className="text-right">{formatBRL(Number(p.product_cost || 0))}</TableCell>
                    <TableCell className="text-right">{formatBRL(Number(p.shipping_cost || 0))}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${p.active ? "bg-chart-2/10 text-chart-2" : "bg-muted text-muted-foreground"}`}>
                        {p.active ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
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
