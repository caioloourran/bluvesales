"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  saveApprovedEntries,
  updateApprovedEntry,
  deleteApprovedEntry,
} from "@/lib/actions/approved-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Loader2, Save, CheckCircle2, Pencil, Trash2 } from "lucide-react";
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

interface EntryRow {
  id: number;
  plan_id: number;
  payment_method: string;
  quantity: number;
  discount: number;
  notes: string | null;
}

interface ApprovedEntryFormProps {
  plans: Plan[];
  todaySummary: TodaySummary[];
  todayEntries: EntryRow[];
  date: string;
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

function methodLabel(method: string) {
  if (method === "BOLETO") return "Boleto";
  if (method === "CARTAO") return "Cartão";
  return "PIX";
}

export function ApprovedEntryForm({
  plans,
  todaySummary,
  todayEntries,
  date,
}: ApprovedEntryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedDate, setSelectedDate] = useState(date);
  const [quantities, setQuantities] = useState<Record<number, PaymentQty>>(() => emptyQuantities(plans));
  const [discounts, setDiscounts] = useState<Record<number, number>>(() => emptyDiscounts(plans));
  const [notes, setNotes] = useState<Record<number, string>>(() => emptyNotes(plans));
  const [justSaved, setJustSaved] = useState(false);

  // Edit dialog state
  const [editEntry, setEditEntry] = useState<EntryRow | null>(null);
  const [editQty, setEditQty] = useState(0);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editNotes, setEditNotes] = useState("");
  const [editPending, setEditPending] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Group summary by plan_id for hints in the entry form
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
    router.push(`/cobranca?date=${newDate}`);
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
      const result = await saveApprovedEntries({ date: selectedDate, entries });
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

  function openEdit(entry: EntryRow) {
    setEditEntry(entry);
    setEditQty(Number(entry.quantity));
    setEditDiscount(Number(entry.discount));
    setEditNotes(entry.notes || "");
  }

  async function handleEditSave() {
    if (!editEntry) return;
    setEditPending(true);
    const result = await updateApprovedEntry({
      id: editEntry.id,
      quantity: editQty,
      discount: editDiscount,
      notes: editNotes,
    });
    setEditPending(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Lancamento atualizado!");
      setEditEntry(null);
      router.refresh();
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    const result = await deleteApprovedEntry(id);
    setDeletingId(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Lancamento excluido!");
      router.refresh();
    }
  }

  const hasEntries = plans.some((p) => {
    const q = quantities[p.id];
    return q.pix > 0 || q.boleto > 0 || q.cartao > 0;
  });

  const entries = todayEntries as EntryRow[];

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
                className="w-full sm:w-44"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing entries table with edit/delete */}
      {entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lancamentos do dia</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plano</TableHead>
                  <TableHead>Metodo</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Desconto</TableHead>
                  <TableHead>Obs</TableHead>
                  <TableHead className="w-24 text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const plan = plans.find((p) => p.id === entry.plan_id);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {plan?.plan_name || `Plano #${entry.plan_id}`}
                      </TableCell>
                      <TableCell>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                          {methodLabel(entry.payment_method)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {Number(entry.quantity)}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(entry.discount) > 0 ? formatBRL(Number(entry.discount)) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.notes || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => openEdit(entry)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            disabled={deletingId === entry.id}
                            onClick={() => handleDelete(entry.id)}
                          >
                            {deletingId === entry.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* New entry form */}
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

      {/* Edit dialog */}
      <Dialog open={!!editEntry} onOpenChange={(open) => { if (!open) setEditEntry(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar Lancamento</DialogTitle>
          </DialogHeader>
          {editEntry && (
            <div className="flex flex-col gap-4">
              <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                <span className="font-medium">
                  {plans.find((p) => p.id === editEntry.plan_id)?.plan_name || `Plano #${editEntry.plan_id}`}
                </span>
                <span className="ml-2 text-muted-foreground">
                  — {methodLabel(editEntry.payment_method)}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min={1}
                  value={editQty}
                  onChange={(e) => setEditQty(Number(e.target.value))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Desconto (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={editDiscount}
                  onChange={(e) => setEditDiscount(Number(e.target.value))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Observacao</Label>
                <Input
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEntry(null)}>
              Cancelar
            </Button>
            <Button disabled={editPending} onClick={handleEditSave}>
              {editPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
