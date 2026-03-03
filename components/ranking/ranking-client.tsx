"use client";

import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Trophy,
  ArrowUpDown,
  Search,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatBRL, formatNumber } from "@/lib/format";
import type { SellerRanking } from "@/lib/kpi";

const periods = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "7d", label: "Ultimos 7 dias" },
  { value: "30d", label: "Ultimos 30 dias" },
  { value: "month", label: "Mes atual" },
  { value: "custom", label: "Personalizado" },
];

const sortOptions = [
  { value: "profit", label: "Lucro" },
  { value: "salesQty", label: "Qtd Vendas" },
  { value: "grossValue", label: "Valor Bruto" },
  { value: "netValue", label: "Valor Liquido" },
  { value: "netCommission", label: "Comissao Liquida" },
  { value: "investment", label: "Investimento" },
  { value: "leads", label: "Leads" },
];

interface RankingClientProps {
  rankings: SellerRanking[];
  period: string;
  dateFrom: string;
  dateTo: string;
}

function RankingFilters({
  period,
  dateFrom,
  dateTo,
}: {
  period: string;
  dateFrom: string;
  dateTo: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customFrom, setCustomFrom] = useState(dateFrom);
  const [customTo, setCustomTo] = useState(dateTo);
  const [selected, setSelected] = useState(period);

  function handlePeriodChange(value: string) {
    setSelected(value);
    if (value !== "custom") {
      const params = new URLSearchParams(searchParams.toString());
      params.set("period", value);
      params.delete("from");
      params.delete("to");
      router.push(`/ranking?${params.toString()}`);
    }
  }

  function handleCustomApply() {
    const params = new URLSearchParams();
    params.set("period", "custom");
    params.set("from", customFrom);
    params.set("to", customTo);
    router.push(`/ranking?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Periodo</Label>
        <Select value={selected} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periods.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selected === "custom" && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">De</Label>
            <Input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Ate</Label>
            <Input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={handleCustomApply} size="sm">
            Aplicar
          </Button>
        </>
      )}
    </div>
  );
}

export function RankingClient({
  rankings,
  period,
  dateFrom,
  dateTo,
}: RankingClientProps) {
  const [sortBy, setSortBy] = useState<string>("profit");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    let result = [...rankings];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) => r.sellerName.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      const key = sortBy as keyof SellerRanking;
      const aVal = Number(a[key]) || 0;
      const bVal = Number(b[key]) || 0;
      return bVal - aVal;
    });

    return result;
  }, [rankings, sortBy, searchQuery]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, r) => ({
        salesQty: acc.salesQty + r.salesQty,
        grossValue: acc.grossValue + r.grossValue,
        netValue: acc.netValue + r.netValue,
        netCommission: acc.netCommission + r.netCommission,
        investment: acc.investment + r.investment,
        leads: acc.leads + r.leads,
        profit: acc.profit + r.profit,
      }),
      {
        salesQty: 0,
        grossValue: 0,
        netValue: 0,
        netCommission: 0,
        investment: 0,
        leads: 0,
        profit: 0,
      }
    );
  }, [filtered]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
            <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Ranking de Vendedores
            </h1>
            <p className="text-sm text-muted-foreground">
              Performance individual de cada vendedor
            </p>
          </div>
        </div>
        <Suspense>
          <RankingFilters
            period={period}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />
        </Suspense>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-xs text-muted-foreground">
              Total Vendedores
            </span>
            <span className="text-2xl font-bold text-foreground">
              {filtered.length}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-xs text-muted-foreground">Total Vendas</span>
            <span className="text-2xl font-bold text-foreground">
              {formatNumber(totals.salesQty)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-xs text-muted-foreground">
              Valor Bruto Total
            </span>
            <span className="text-2xl font-bold text-foreground">
              {formatBRL(totals.grossValue)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-xs text-muted-foreground">Lucro Total</span>
            <span
              className={`text-2xl font-bold ${totals.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
            >
              {formatBRL(totals.profit)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filters row */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Nome do vendedor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:w-64"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              <ArrowUpDown className="mr-1 inline h-3 w-3" />
              Ordenar por
            </Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Full ranking table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Detalhamento por Vendedor
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum vendedor encontrado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 text-center">#</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">Investimento</TableHead>
                    <TableHead className="text-right">Valor Bruto</TableHead>
                    <TableHead className="text-right">Valor Liquido</TableHead>
                    <TableHead className="text-right">
                      Comissao Liquida
                    </TableHead>
                    <TableHead className="text-right">Lucro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r, idx) => (
                    <TableRow key={r.sellerId}>
                      <TableCell className="text-center">
                        {idx === 0 ? (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400">
                            1
                          </Badge>
                        ) : idx === 1 ? (
                          <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300">
                            2
                          </Badge>
                        ) : idx === 2 ? (
                          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/40 dark:text-orange-400">
                            3
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {idx + 1}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {r.sellerName}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(r.salesQty)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(r.leads)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatBRL(r.investment)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatBRL(r.grossValue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatBRL(r.netValue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatBRL(r.netCommission)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${r.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                        >
                          {r.profit >= 0 ? (
                            <TrendingUp className="h-3.5 w-3.5" />
                          ) : (
                            <TrendingDown className="h-3.5 w-3.5" />
                          )}
                          {formatBRL(r.profit)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
