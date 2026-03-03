"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveSalesEntries } from "@/lib/actions/sales-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Loader2, Save, CheckCircle2 } from "lucide-react";
import { formatBRL } from "@/lib/format";

interface Plan {
  id: number;
  plan_name: string;
  product_name: string;
  sale_price_gross: string;
}

interface TodaySummary {
  plan_id: number;
  total_qty: number;
}

interface SalesEntryFormProps {
  plans: Plan[];
  todaySummary: TodaySummary[];
  sellers: { id: number; name: string }[];
  date: string;
  sellerId: number;
  isAdmin: boolean;
}

function emptyQuantities(plans: Plan[]): Record<number, number> {
  const m: Record<number, number> = {};
  for (const plan of plans) m[plan.id] = 0;
  return m;
}

function emptyDiscounts(plans: Plan[]): Record<number, number> {
  const m: Record<number, number> = {};
  for (const plan of plans) m[plan.id] = 0;
  return m;
}

function emptyNotes(plans: Plan[]): Record<number, string> {
  const m: Record<number, string> = {};
  for (const plan of plans) m[plan.id] = "";
  return m;
}

export function SalesEntryForm({
  plans,
  todaySummary,
  sellers,
  date,
  sellerId,
  isAdmin,
}: SalesEntryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedDate, setSelectedDate] = useState(date);
  const [selectedSeller, setSelectedSeller] = useState(String(sellerId));
  const [quantities, setQuantities] = useState<Record<number, number>>(() => emptyQuantities(plans));
  const [discounts, setDiscounts] = useState<Record<number, number>>(() => emptyDiscounts(plans));
  const [notes, setNotes] = useState<Record<number, string>>(() => emptyNotes(plans));
  const [justSaved, setJustSaved] = useState(false);

  const summaryMap = new Map(todaySummary.map((s) => [s.plan_id, Number(s.total_qty)]));

  function handleDateChange(newDate: string) {
    setSelectedDate(newDate);
    const params = new URLSearchParams();
    params.set("date", newDate);
    if (isAdmin) params.set("seller", selectedSeller);
    router.push(`/sales?${params.toString()}`);
  }

  function handleSellerChange(newSeller: string) {
    setSelectedSeller(newSeller);
    const params = new URLSearchParams();
    params.set("date", selectedDate);
    params.set("seller", newSeller);
    router.push(`/sales?${params.toString()}`);
  }

  function resetForm() {
    setQuantities(emptyQuantities(plans));
    setDiscounts(emptyDiscounts(plans));
    setNotes(emptyNotes(plans));
  }

  function handleSave() {
    const entries = plans
      .filter((plan) => (quantities[plan.id] || 0) > 0)
      .map((plan) => ({
        planId: plan.id,
        quantity: quantities[plan.id] || 0,
        discount: discounts[plan.id] || 0,
        notes: notes[plan.id] || "",
      }));

    if (entries.length === 0) {
      toast.error("Insira pelo menos 1 venda para salvar.");
      return;
    }

    startTransition(async () => {
      const result = await saveSalesEntries({
        date: selectedDate,
        sellerId: Number(selectedSeller),
        entries,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Lancamentos salvos com sucesso!");
        resetForm();
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 3000);
        router.refresh();
      }
    });
  }

  const hasEntries = plans.some((p) => (quantities[p.id] || 0) > 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Lancamento de Vendas</h1>
        <p className="text-sm text-muted-foreground">
          Registre novas vendas diarias por plano. Lancamentos anteriores sao preservados.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Data</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-44"
              />
            </div>
            {isAdmin && sellers.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Vendedor</Label>
                <Select value={selectedSeller} onValueChange={handleSellerChange}>
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Selecione" />
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
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary of existing entries for the day */}
      {todaySummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ja lancado neste dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {todaySummary.map((s) => {
                const plan = plans.find((p) => p.id === s.plan_id);
                return (
                  <div
                    key={s.plan_id}
                    className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-sm"
                  >
                    <span className="font-medium text-foreground">
                      {plan?.plan_name || `Plano #${s.plan_id}`}
                    </span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                      {s.total_qty}x
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Para alterar lancamentos anteriores, use o menu Historico.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Novo lancamento</CardTitle>
          <Button onClick={handleSave} disabled={isPending || !hasEntries} size="sm">
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : justSaved ? (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {justSaved ? "Salvo!" : "Salvar"}
          </Button>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum plano ativo cadastrado. Cadastre produtos e planos primeiro.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead className="text-right">Preco Bruto</TableHead>
                  <TableHead className="w-24">Qtd</TableHead>
                  <TableHead className="w-32">Desconto (R$)</TableHead>
                  <TableHead>Observacoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => {
                  const existing = summaryMap.get(plan.id) || 0;
                  return (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.product_name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{plan.plan_name}</span>
                          {existing > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {existing} ja lancado(s)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatBRL(Number(plan.sale_price_gross))}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={quantities[plan.id] || 0}
                          onChange={(e) =>
                            setQuantities((prev) => ({
                              ...prev,
                              [plan.id]: Number(e.target.value),
                            }))
                          }
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={discounts[plan.id] || 0}
                          onChange={(e) =>
                            setDiscounts((prev) => ({
                              ...prev,
                              [plan.id]: Number(e.target.value),
                            }))
                          }
                          className="w-28"
                          placeholder="0,00"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={notes[plan.id] || ""}
                          onChange={(e) =>
                            setNotes((prev) => ({
                              ...prev,
                              [plan.id]: e.target.value,
                            }))
                          }
                          placeholder="Opcional"
                          className="w-40"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
