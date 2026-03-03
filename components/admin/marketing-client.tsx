"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { upsertAdMetric, deleteAdMetric } from "@/lib/actions/admin-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Loader2, Save } from "lucide-react";
import { formatBRL, formatNumber } from "@/lib/format";

interface Metric {
  id: number;
  date: string;
  seller_id: number | null;
  seller_name: string | null;
  investment: string;
  leads: number;
  purchases_count: number;
}

interface Seller {
  id: number;
  name: string;
}

interface Props {
  metrics: Metric[];
  sellers: Seller[];
}

export function MarketingClient({ metrics, sellers }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [sellerId, setSellerId] = useState("");
  const [investment, setInvestment] = useState("");
  const [leads, setLeads] = useState("");
  const [purchases, setPurchases] = useState("");

  function handleSave() {
    if (!sellerId) {
      toast.error("Selecione um vendedor");
      return;
    }
    startTransition(async () => {
      const result = await upsertAdMetric({
        date,
        sellerId: Number(sellerId),
        investment: Number(investment),
        leads: Number(leads),
        purchasesCount: purchases ? Number(purchases) : 0,
      });
      if (result.error) toast.error(result.error);
      else {
        toast.success("Metrica salva!");
        setInvestment("");
        setLeads("");
        setPurchases("");
        router.refresh();
      }
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Deseja deletar esta metrica?")) return;
    startTransition(async () => {
      const result = await deleteAdMetric(id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Metrica deletada!");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Marketing</h1>
        <p className="text-sm text-muted-foreground">
          Registre metricas diarias de anuncios por vendedor
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar / Atualizar Metrica</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Vendedor</Label>
              <Select value={sellerId} onValueChange={setSellerId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {sellers.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Data</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Investimento (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={investment}
                onChange={(e) => setInvestment(e.target.value)}
                className="w-36"
                placeholder="0.00"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Leads</Label>
              <Input
                type="number"
                value={leads}
                onChange={(e) => setLeads(e.target.value)}
                className="w-24"
                placeholder="0"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Compras (opcional)</Label>
              <Input
                type="number"
                value={purchases}
                onChange={(e) => setPurchases(e.target.value)}
                className="w-24"
                placeholder="0"
              />
            </div>
            <Button onClick={handleSave} disabled={isPending} size="sm">
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historico de Metricas</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma metrica registrada ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead className="text-right">Investimento</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Compras</TableHead>
                  <TableHead className="w-16">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {new Date(m.date + "T12:00:00").toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>{m.seller_name || "—"}</TableCell>
                    <TableCell className="text-right">
                      {formatBRL(Number(m.investment))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(m.leads)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(m.purchases_count || 0)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
