"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBRL, formatNumber } from "@/lib/format";
import { LayoutDashboard, TrendingUp, CheckSquare, DollarSign } from "lucide-react";

interface PlanRow {
  planId: number;
  planName: string;
  productName: string;
  salePriceGross: number;
  totalQty: number;
  totalRevenue: number;
  commission: number;
}

interface Props {
  rows: PlanRow[];
  totals: { qty: number; revenue: number; commission: number };
  dateFrom: string;
  dateTo: string;
  userName: string;
  commissionRate: number;
}

export function DesempenhoClient({ rows, totals, dateFrom, dateTo, userName, commissionRate }: Props) {
  const router = useRouter();
  const [from, setFrom] = useState(dateFrom);
  const [to, setTo] = useState(dateTo);

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/meu-desempenho?from=${from}&to=${to}`);
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <LayoutDashboard className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Meu Desempenho</h1>
          <p className="text-sm text-muted-foreground">{userName}</p>
        </div>
      </div>

      {/* Date filter */}
      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="from">De</Label>
              <Input
                id="from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="to">Ate</Label>
              <Input
                id="to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-40"
              />
            </div>
            <Button type="submit">Filtrar</Button>
          </form>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <CheckSquare className="h-4 w-4 text-green-500" />
              Total Aprovados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {formatNumber(totals.qty, 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">pagamentos no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Faturamento Aprovado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-500">
              {formatBRL(totals.revenue)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">valor bruto total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <DollarSign className="h-4 w-4 text-green-500" />
              Minha Comissao ({(commissionRate * 100).toFixed(0)}%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">
              {formatBRL(totals.commission)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {(commissionRate * 100).toFixed(0)}% sobre {formatBRL(totals.revenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown by plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhamento por Plano</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead className="text-right">Preco Unit.</TableHead>
                <TableHead className="text-right">Qtd. Aprovados</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">Comissao (1%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.planId}>
                  <TableCell className="text-muted-foreground">{r.productName}</TableCell>
                  <TableCell className="font-medium">{r.planName}</TableCell>
                  <TableCell className="text-right">{formatBRL(r.salePriceGross)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatNumber(r.totalQty, 0)}
                  </TableCell>
                  <TableCell className="text-right text-blue-500">
                    {formatBRL(r.totalRevenue)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    {formatBRL(r.commission)}
                  </TableCell>
                </TableRow>
              ))}

              {rows.length > 1 && (
                <TableRow className="border-t-2 bg-muted/50 font-bold">
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-right">{formatNumber(totals.qty, 0)}</TableCell>
                  <TableCell className="text-right text-blue-500">{formatBRL(totals.revenue)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatBRL(totals.commission)}</TableCell>
                </TableRow>
              )}

              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Nenhum pagamento aprovado no período selecionado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
