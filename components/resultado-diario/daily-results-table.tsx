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
import { CalendarDays } from "lucide-react";
import type { DailyResult } from "@/lib/kpi";

interface Props {
  rows: DailyResult[];
  dateFrom: string;
  dateTo: string;
}

function fmt(value: number | null, decimals = 2): string {
  if (value === null) return "—";
  return formatNumber(value, decimals);
}

function fmtBRL(value: number): string {
  return formatBRL(value);
}

export function DailyResultsTable({ rows, dateFrom, dateTo }: Props) {
  const router = useRouter();
  const [from, setFrom] = useState(dateFrom);
  const [to, setTo] = useState(dateTo);

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/resultado-diario?from=${from}&to=${to}`);
  }

  // Sort newest first
  const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date));

  // Totals row
  const totals = rows.reduce(
    (acc, r) => ({
      investment: acc.investment + r.investment,
      leads: acc.leads + r.leads,
      salesQty: acc.salesQty + r.salesQty,
      grossValue: acc.grossValue + r.grossValue,
      approvedCount: acc.approvedCount + r.approvedCount,
      approvedRevenue: acc.approvedRevenue + r.approvedRevenue,
      lucro: acc.lucro + r.lucro,
    }),
    { investment: 0, leads: 0, salesQty: 0, grossValue: 0, approvedCount: 0, approvedRevenue: 0, lucro: 0 }
  );

  const totalCpl = totals.leads > 0 ? totals.investment / totals.leads : null;
  const totalRoasAg = totals.investment > 0 ? totals.grossValue / totals.investment : null;
  const totalCpaAp = totals.approvedCount > 0 ? totals.investment / totals.approvedCount : null;
  const totalRoasAp = totals.investment > 0 ? totals.approvedRevenue / totals.investment : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Resultado Diario</h1>
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
                className="w-full sm:w-40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="to">Ate</Label>
              <Input
                id="to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
            <Button type="submit">Filtrar</Button>
          </form>
        </CardContent>
      </Card>

      {/* Results table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Resultado por dia ({sorted.filter(r =>
              r.investment > 0 || r.leads > 0 || r.salesQty > 0 || r.approvedCount > 0
            ).length} dias com dados)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Data</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Gastos</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Fat. Agendado</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Leads</TableHead>
                  <TableHead className="whitespace-nowrap text-right">CPL</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Agendamentos</TableHead>
                  <TableHead className="whitespace-nowrap text-right">ROAS Agend.</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Qtd. Aprovados</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Fat. Aprovados</TableHead>
                  <TableHead className="whitespace-nowrap text-right">CPA Aprovado</TableHead>
                  <TableHead className="whitespace-nowrap text-right">ROAS Aprovado</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Lucro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell className="whitespace-nowrap font-medium">
                      {new Date(row.date + "T00:00:00").toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right text-red-500">{fmtBRL(row.investment)}</TableCell>
                    <TableCell className="text-right text-blue-500">{fmtBRL(row.grossValue)}</TableCell>
                    <TableCell className="text-right">{formatNumber(row.leads, 0)}</TableCell>
                    <TableCell className="text-right">
                      {row.cpl !== null ? fmtBRL(row.cpl) : "—"}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(row.salesQty, 0)}</TableCell>
                    <TableCell className="text-right">
                      {row.roasAgendado !== null ? fmt(row.roasAgendado) + "x" : "—"}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(row.approvedCount, 0)}</TableCell>
                    <TableCell className="text-right">{fmtBRL(row.approvedRevenue)}</TableCell>
                    <TableCell className="text-right">
                      {row.cpaAprovado !== null ? fmtBRL(row.cpaAprovado) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.roasAprovado !== null ? fmt(row.roasAprovado) + "x" : "—"}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        row.lucro >= 0 ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {fmtBRL(row.lucro)}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Totals row */}
                {sorted.length > 0 && (
                  <TableRow className="border-t-2 bg-muted/50 font-bold">
                    <TableCell className="whitespace-nowrap">Total</TableCell>
                    <TableCell className="text-right text-red-500">{fmtBRL(totals.investment)}</TableCell>
                    <TableCell className="text-right text-blue-500">{fmtBRL(totals.grossValue)}</TableCell>
                    <TableCell className="text-right">{formatNumber(totals.leads, 0)}</TableCell>
                    <TableCell className="text-right">
                      {totalCpl !== null ? fmtBRL(totalCpl) : "—"}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(totals.salesQty, 0)}</TableCell>
                    <TableCell className="text-right">
                      {totalRoasAg !== null ? fmt(totalRoasAg) + "x" : "—"}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(totals.approvedCount, 0)}</TableCell>
                    <TableCell className="text-right">{fmtBRL(totals.approvedRevenue)}</TableCell>
                    <TableCell className="text-right">
                      {totalCpaAp !== null ? fmtBRL(totalCpaAp) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {totalRoasAp !== null ? fmt(totalRoasAp) + "x" : "—"}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        totals.lucro >= 0 ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {fmtBRL(totals.lucro)}
                    </TableCell>
                  </TableRow>
                )}

                {sorted.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} className="py-8 text-center text-muted-foreground">
                      Nenhum dado encontrado para o periodo selecionado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
