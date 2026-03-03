"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveApprovedEntries } from "@/lib/actions/approved-actions";
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
  payment_method?: string;
}

interface ApprovedEntryFormProps {
  plans: Plan[];
  todaySummary: TodaySummary[];
  sellers: { id: number; name: string }[];
  date: string;
  sellerId: number;
}

type PaymentQty = { pix: number; boleto: number; cartao: number };

function emptyQuantities(plans: Plan[]): Record<number, PaymentQty> {
  const m: Record<number, PaymentQty> = {};
  for (const plan of plans) m[plan.id] = { pix: 0, boleto: 0, cartao: 0 };
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

export function ApprovedEntryForm({
  plans,
  todaySummary,
  sellers,
  date,
  sellerId,
}: ApprovedEntryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedDate, setSelectedDate] = useState(date);
  const [selectedSeller, setSelectedSeller] = useState(String(sellerId));
  const [quantities, setQuantities] = useState<Record<number, PaymentQty>>(() => emptyQuantities(plans));
  const [discounts, setDiscounts] = useState<Record<number, number>>(() => emptyDiscounts(plans));
  const [notes, setNotes] = useState<Record<number, string>>(() => emptyNotes(plans));
  const [justSaved, setJustSaved] = useState(false);

  // Group summary by plan_id
  const summaryMap = new Map<number, { total: number; pix: number; boleto: number; cartao: number }>();
  for (const s of todaySummary) {
    const existing = summaryMap.get(s.plan_id) || { total: 0, pix: 0, boleto: 0, cartao: 0 };
    const qty = Number(s.total_qty);
    existing.total += qty;
    if (s.payment_method === "BOLETO") existing.boleto += qty;
    else if (s.payment_method === "CARTAO") existing.cartao += qty;
    else existing.pix += qty;
    summaryMap.set(s.plan_id, existing);
  }

  function handleDateChange(newDate: string) {
    setSelectedDate(newDate);
    const params = new URLSearchParams();
    params.set("date", newDate);
    params.set("seller", selectedSeller);
    router.push(`/cobranca?${params.toString()}`);
  }

  function handleSellerChange(newSeller: string) {
    setSelectedSeller(newSeller);
    const params = new URLSearchParams();
    params.set("date", selectedDate);
    params.set("seller", newSeller);
    router.push(`/cobranca?${params.toString()}`);
  }

  function resetForm() {
    setQuantities(emptyQuantities(plans));
    setDiscounts(emptyDiscounts(plans));
    setNotes(emptyNotes(plans));
  }

  function handleSave() {
    const entries: { planId: number; quantity: number; discount: number; notes: string; paymentMethod: string }[] = [];

    for (const plan of plans) {
      const q = quantities[plan.id];
      const totalQty = q.pix + q.boleto + q.cartao;
      if (totalQty === 0) continue;

      const discount = discounts[plan.id] || 0;
      const note = notes[plan.id] || "";

      if (q.pix > 0) entries.push({ planId: plan.id, quantity: q.pix, discount: totalQty > 0 ? (discount * q.pix / totalQty) : 0, notes: note, paymentMethod: "PIX" });
      if (q.boleto > 0) entries.push({ planId: plan.id, quantity: q.boleto, discount: totalQty > 0 ? (discount * q.boleto / totalQty) : 0, notes: note, paymentMethod: "BOLETO" });
      if (q.cartao > 0) entries.push({ planId: plan.id, quantity: q.cartao, discount: totalQty > 0 ? (discount * q.cartao / totalQty) : 0, notes: note, paymentMethod: "CARTAO" });
    }

    if (entries.length === 0) {
      toast.error("Insira pelo menos 1 pagamento aprovado para salvar.");
      return;
    }

    startTransition(async () => {
      const result = await saveApprovedEntries({
        date: selectedDate,
        sellerId: Number(selectedSeller),
        entries,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Pagamentos aprovados salvos com sucesso!");
        resetForm();
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 3000);
        router.refresh();
      }
    });
  }

  const hasEntries = plans.some((p) => {
    const q = quantities[p.id];
    return q.pix > 0 || q.boleto > 0 || q.cartao > 0;
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cobranca</h1>
        <p className="text-sm text-muted-foreground">
          Registre pagamentos aprovados diariamente por plano e forma de pagamento.
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
            {sellers.length > 0 && (
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

      {/* Summary of existing approved entries for the day */}
      {todaySummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ja registrado neste dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Array.from(summaryMap.entries()).map(([planId, summary]) => {
                const plan = plans.find((p) => p.id === planId);
                const parts = [];
                if (summary.pix > 0) parts.push(`${summary.pix} PIX`);
                if (summary.boleto > 0) parts.push(`${summary.boleto} Bol.`);
                if (summary.cartao > 0) parts.push(`${summary.cartao} Cart.`);
                return (
                  <div
                    key={planId}
                    className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-sm"
                  >
                    <span className="font-medium text-foreground">
                      {plan?.plan_name || `Plano #${planId}`}
                    </span>
                    <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-bold text-green-600">
                      {summary.total}x
                    </span>
                    {parts.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({parts.join(", ")})
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Novo lancamento de aprovados</CardTitle>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead className="text-right">Preco Bruto</TableHead>
                    <TableHead className="w-20 text-center">PIX</TableHead>
                    <TableHead className="w-20 text-center">Boleto</TableHead>
                    <TableHead className="w-20 text-center">Cartao</TableHead>
                    <TableHead className="w-28">Desconto (R$)</TableHead>
                    <TableHead>Obs.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => {
                    const existing = summaryMap.get(plan.id);
                    return (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">{plan.product_name}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{plan.plan_name}</span>
                            {existing && existing.total > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {existing.total} ja aprovado(s)
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
                            value={quantities[plan.id]?.pix || 0}
                            onChange={(e) =>
                              setQuantities((prev) => ({
                                ...prev,
                                [plan.id]: { ...prev[plan.id], pix: Number(e.target.value) },
                              }))
                            }
                            className="w-16"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={quantities[plan.id]?.boleto || 0}
                            onChange={(e) =>
                              setQuantities((prev) => ({
                                ...prev,
                                [plan.id]: { ...prev[plan.id], boleto: Number(e.target.value) },
                              }))
                            }
                            className="w-16"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={quantities[plan.id]?.cartao || 0}
                            onChange={(e) =>
                              setQuantities((prev) => ({
                                ...prev,
                                [plan.id]: { ...prev[plan.id], cartao: Number(e.target.value) },
                              }))
                            }
                            className="w-16"
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
                            className="w-24"
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
                            className="w-32"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
