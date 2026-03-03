"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  updateSalesEntry,
  deleteSalesEntry,
} from "@/lib/actions/sales-actions";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pencil,
  Trash2,
  Loader2,
  Search,
  ShoppingCart,
  DollarSign,
  CalendarDays,
} from "lucide-react";
import { formatBRL } from "@/lib/format";

interface Entry {
  id: number;
  date: string;
  quantity: number;
  discount: string | number;
  notes: string | null;
  created_at: string;
  plan_name: string;
  product_name: string;
  sale_price_gross: string;
  seller_name: string;
  seller_id: number;
  payment_method: string;
}

interface HistoryClientProps {
  entries: Entry[];
  sellers: { id: number; name: string }[];
  isAdmin: boolean;
  dateFrom: string;
  dateTo: string;
  filterSeller: number | null;
}

export function HistoryClient({
  entries,
  sellers,
  isAdmin,
  dateFrom,
  dateTo,
  filterSeller,
}: HistoryClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const [from, setFrom] = useState(dateFrom);
  const [to, setTo] = useState(dateTo);
  const [sellerFilter, setSellerFilter] = useState(
    filterSeller ? String(filterSeller) : "all"
  );

  // Edit dialog state
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [editQty, setEditQty] = useState(0);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editNotes, setEditNotes] = useState("");

  // Delete dialog state
  const [deleteEntry, setDeleteEntry] = useState<Entry | null>(null);

  function applyFilters() {
    const params = new URLSearchParams();
    params.set("from", from);
    params.set("to", to);
    if (isAdmin && sellerFilter !== "all") {
      params.set("seller", sellerFilter);
    }
    router.push(`/history?${params.toString()}`);
  }

  function openEdit(entry: Entry) {
    setEditEntry(entry);
    setEditQty(entry.quantity);
    setEditDiscount(Number(entry.discount) || 0);
    setEditNotes(entry.notes || "");
  }

  function handleSaveEdit() {
    if (!editEntry) return;
    startTransition(async () => {
      const result = await updateSalesEntry({
        id: editEntry.id,
        quantity: editQty,
        discount: editDiscount,
        notes: editNotes,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Lancamento atualizado!");
        setEditEntry(null);
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (!deleteEntry) return;
    startTransition(async () => {
      const result = await deleteSalesEntry(deleteEntry.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Lancamento excluido!");
        setDeleteEntry(null);
        router.refresh();
      }
    });
  }

  const filtered = entries.filter((e) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      e.seller_name.toLowerCase().includes(term) ||
      e.product_name.toLowerCase().includes(term) ||
      e.plan_name.toLowerCase().includes(term)
    );
  });

  const totalQty = filtered.reduce((s, e) => s + e.quantity, 0);
  const totalGross = filtered.reduce(
    (s, e) => s + e.quantity * Number(e.sale_price_gross),
    0
  );
  const totalDiscount = filtered.reduce((s, e) => s + Number(e.discount || 0), 0);

  // Group by date for display
  const dateGroups = new Map<string, Entry[]>();
  for (const entry of filtered) {
    const d = new Date(entry.date).toISOString().split("T")[0];
    if (!dateGroups.has(d)) dateGroups.set(d, []);
    dateGroups.get(d)!.push(entry);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Historico de Lancamentos
        </h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "Visualize todos os lancamentos de vendas"
            : "Visualize, edite ou exclua seus lancamentos"}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">De</Label>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Ate</Label>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
            {isAdmin && sellers.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">
                  Vendedor
                </Label>
                <Select value={sellerFilter} onValueChange={setSellerFilter}>
                  <SelectTrigger className="w-full sm:w-52">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {sellers.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={applyFilters} size="sm">
              <Search className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
          </div>
          <div className="mt-3">
            <Input
              placeholder="Buscar por vendedor, produto ou plano..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lancamentos</p>
              <p className="text-xl font-bold text-foreground">
                {filtered.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Vendas</p>
              <p className="text-xl font-bold text-foreground">{totalQty}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor Bruto</p>
              <p className="text-xl font-bold text-foreground">
                {formatBRL(totalGross)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entries grouped by date */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum lancamento encontrado no periodo selecionado.
            </p>
          </CardContent>
        </Card>
      ) : (
        Array.from(dateGroups.entries()).map(([date, group]) => {
          const dayTotal = group.reduce((s, e) => s + e.quantity, 0);
          const dayGross = group.reduce(
            (s, e) => s + e.quantity * Number(e.sale_price_gross),
            0
          );
          return (
            <Card key={date}>
              <CardHeader className="flex flex-col gap-1 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">
                  {new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    {dayTotal} venda{dayTotal !== 1 && "s"}
                  </span>
                  <span className="font-medium text-foreground">
                    {formatBRL(dayGross)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {isAdmin && <TableHead>Vendedor</TableHead>}
                      <TableHead>Produto</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead className="text-right">Preco</TableHead>
                      <TableHead className="text-center">Metodo</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="text-right">Desconto</TableHead>
                      <TableHead>Obs</TableHead>
                      <TableHead className="w-24 text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.map((entry) => (
                      <TableRow key={entry.id}>
                        {isAdmin && (
                          <TableCell className="font-medium">
                            {entry.seller_name}
                          </TableCell>
                        )}
                        <TableCell>{entry.product_name}</TableCell>
                        <TableCell>{entry.plan_name}</TableCell>
                        <TableCell className="text-right">
                          {formatBRL(Number(entry.sale_price_gross))}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                              entry.payment_method === "PIX"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : entry.payment_method === "BOLETO"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            }`}
                          >
                            {entry.payment_method === "CARTAO" ? "Cartao" : entry.payment_method === "BOLETO" ? "Boleto" : "PIX"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {entry.quantity}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatBRL(
                            entry.quantity * Number(entry.sale_price_gross)
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {Number(entry.discount) > 0 ? (
                            <span className="text-destructive">
                              -{formatBRL(Number(entry.discount))}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-32 truncate text-muted-foreground">
                          {entry.notes || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(entry)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteEntry(entry)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editEntry} onOpenChange={() => setEditEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Lancamento</DialogTitle>
            <DialogDescription>
              {editEntry &&
                `${editEntry.product_name} - ${editEntry.plan_name} em ${new Date(editEntry.date + "T12:00:00").toLocaleDateString("pt-BR")}`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
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
              <Label>Observacoes</Label>
              <Input
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEntry(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteEntry} onOpenChange={() => setDeleteEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusao</DialogTitle>
            <DialogDescription>
              {deleteEntry &&
                `Deseja excluir o lancamento de ${deleteEntry.quantity}x ${deleteEntry.plan_name} do dia ${new Date(deleteEntry.date + "T12:00:00").toLocaleDateString("pt-BR")}? Esta acao nao pode ser desfeita.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteEntry(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
