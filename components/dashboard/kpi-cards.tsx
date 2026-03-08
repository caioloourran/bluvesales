import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL, formatNumber, formatPercent } from "@/lib/format";
import type { KPIData } from "@/lib/kpi";
import { Calendar, CheckSquare, TrendingDown, Users, Percent, DollarSign, BarChart2, ShoppingBag, Zap } from "lucide-react";

interface KPICardsProps {
  kpis: KPIData;
  isAdmin: boolean;
}

export function KPICards({ kpis, isAdmin }: KPICardsProps) {
  const scheduledRoas = kpis.investment > 0 ? kpis.grossValue / kpis.investment : 0;
  const scheduledCpa = kpis.salesQty > 0 ? kpis.investment / kpis.salesQty : null;
  const approvedRoas = kpis.investment > 0 ? kpis.approvedRevenue / kpis.investment : 0;
  const approvedCpa = kpis.approvedCount > 0 ? kpis.investment / kpis.approvedCount : null;
  const leadToPaymentRate = kpis.leads > 0 ? kpis.approvedCount / kpis.leads : 0;
  const leadsPerSchedule = kpis.salesQty > 0 ? kpis.leads / kpis.salesQty : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Top row - 4 main KPIs (admin only) */}
      {isAdmin && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Gastos em Anuncios */}
          <Card className="border-l-4 border-l-rose-500 dark:border-l-rose-400">
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Gastos em Anuncios
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-500/10 shrink-0">
                <TrendingDown className="h-4 w-4 text-rose-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-rose-500">
                {formatBRL(kpis.investment)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {kpis.daysInPeriod > 0
                  ? `${kpis.daysInPeriod} dia${kpis.daysInPeriod > 1 ? "s" : ""} registrado${kpis.daysInPeriod > 1 ? "s" : ""}`
                  : "Nenhum registro"}
              </p>
            </CardContent>
          </Card>

          {/* Total de Leads */}
          <Card className="border-l-4 border-l-violet-500 dark:border-l-violet-400">
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Total de Leads
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-500/10 shrink-0">
                <Users className="h-4 w-4 text-violet-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatNumber(kpis.leads)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                CPL medio: {kpis.cpl !== null ? formatBRL(kpis.cpl) : "N/A"}
              </p>
            </CardContent>
          </Card>

          {/* Taxa Lead -> Pagamento */}
          <Card className="border-l-4 border-l-amber-500 dark:border-l-amber-400">
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Taxa Lead Pagamento
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/10 shrink-0">
                <Percent className="h-4 w-4 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatPercent(leadToPaymentRate)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {kpis.daysInPeriod > 0
                  ? `${kpis.daysInPeriod} dia${kpis.daysInPeriod > 1 ? "s" : ""} registrado${kpis.daysInPeriod > 1 ? "s" : ""}`
                  : "Nenhum registro"}
              </p>
            </CardContent>
          </Card>

          {/* Lucro Total */}
          <Card className={`border-l-4 ${kpis.approvedProfit >= 0 ? "border-l-emerald-500 dark:border-l-emerald-400" : "border-l-rose-500 dark:border-l-rose-400"}`}>
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Lucro Total (Periodo)
              </CardTitle>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${kpis.approvedProfit >= 0 ? "bg-emerald-100 dark:bg-emerald-500/10" : "bg-rose-100 dark:bg-rose-500/10"}`}>
                <DollarSign className={`h-4 w-4 ${kpis.approvedProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${kpis.approvedProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                {formatBRL(kpis.approvedProfit)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Somente pagamentos aprovados
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Seller view - Agendado summary */}
      {!isAdmin && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="border-l-4 border-l-indigo-500 dark:border-l-indigo-400">
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Pedidos Agendados
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-500/10 shrink-0">
                <ShoppingBag className="h-4 w-4 text-indigo-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatNumber(kpis.salesQty)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">no periodo</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 dark:border-l-blue-400">
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Faturamento Agendado
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/10 shrink-0">
                <BarChart2 className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-500">
                {formatBRL(kpis.grossValue)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Total agendado</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-violet-500 dark:border-l-violet-400">
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Total de Leads
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-500/10 shrink-0">
                <Users className="h-4 w-4 text-violet-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatNumber(kpis.leads)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                CPL: {kpis.cpl !== null ? formatBRL(kpis.cpl) : "N/A"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 dark:border-l-orange-400">
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Leads p/ Agendamento
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/10 shrink-0">
                <Zap className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-500">
                {leadsPerSchedule !== null ? formatNumber(leadsPerSchedule, 1) : "—"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatNumber(kpis.leads)} leads / {formatNumber(kpis.salesQty)} agend.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom row - Agendado & Aprovado sections */}
      {isAdmin && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* AGENDADO */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Calendar className="h-4 w-4 text-blue-500" />
                Agendado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <Card className="border-border/40 bg-gradient-to-br from-blue-50/60 to-transparent dark:from-blue-950/20 dark:to-transparent">
                  <CardHeader className="pb-1 pt-3 px-3">
                    <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Faturamento Agendado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <p className="text-lg font-bold text-blue-500">
                      {formatBRL(kpis.grossValue)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Total agendado</p>
                  </CardContent>
                </Card>

                <Card className="border-border/40 bg-gradient-to-br from-amber-50/60 to-transparent dark:from-amber-950/20 dark:to-transparent">
                  <CardHeader className="pb-1 pt-3 px-3">
                    <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      ROAS Agendado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <p className="text-lg font-bold text-yellow-500">
                      {formatNumber(scheduledRoas, 2)}x
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Fat. agendado: {formatBRL(kpis.grossValue)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/40 bg-gradient-to-br from-blue-50/60 to-transparent dark:from-blue-950/20 dark:to-transparent">
                  <CardHeader className="pb-1 pt-3 px-3">
                    <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      CPA de Agendamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <p className="text-lg font-bold text-blue-500">
                      {scheduledCpa !== null ? formatBRL(scheduledCpa) : "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatNumber(kpis.salesQty)} agendamentos
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/40">
                  <CardHeader className="pb-1 pt-3 px-3">
                    <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Agendamentos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <p className="text-lg font-bold text-foreground">
                      {formatNumber(kpis.salesQty)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">no periodo</p>
                  </CardContent>
                </Card>

                <Card className="border-border/40 bg-gradient-to-br from-emerald-50/60 to-transparent dark:from-emerald-950/20 dark:to-transparent">
                  <CardHeader className="pb-1 pt-3 px-3">
                    <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Lucro Estimado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <p className={`text-lg font-bold ${kpis.profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {formatBRL(kpis.profit)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Se todos pagarem</p>
                  </CardContent>
                </Card>

                <Card className="border-border/40 bg-gradient-to-br from-orange-50/60 to-transparent dark:from-orange-950/20 dark:to-transparent">
                  <CardHeader className="pb-1 pt-3 px-3">
                    <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Leads p/ Agendamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <p className="text-lg font-bold text-orange-500">
                      {leadsPerSchedule !== null ? formatNumber(leadsPerSchedule, 1) : "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatNumber(kpis.leads)} leads / {formatNumber(kpis.salesQty)} agend.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* APROVADO */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CheckSquare className="h-4 w-4 text-emerald-500" />
                Aprovado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Card className="border-border/40 bg-gradient-to-br from-emerald-50/60 to-transparent dark:from-emerald-950/20 dark:to-transparent">
                  <CardHeader className="pb-1 pt-3 px-3">
                    <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Faturamento Aprovado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <p className="text-lg font-bold text-green-500">
                      {formatBRL(kpis.approvedRevenue)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Pag. aprovados (R$)</p>
                  </CardContent>
                </Card>

                <Card className="border-border/40 bg-gradient-to-br from-amber-50/60 to-transparent dark:from-amber-950/20 dark:to-transparent">
                  <CardHeader className="pb-1 pt-3 px-3">
                    <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      ROAS Aprovado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <p className="text-lg font-bold text-yellow-500">
                      {formatNumber(approvedRoas, 2)}x
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Pag. aprovados: {formatBRL(kpis.approvedRevenue)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/40 bg-gradient-to-br from-orange-50/60 to-transparent dark:from-orange-950/20 dark:to-transparent">
                  <CardHeader className="pb-1 pt-3 px-3">
                    <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      CPA de Aprovados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <p className="text-lg font-bold text-orange-500">
                      {approvedCpa !== null ? formatBRL(approvedCpa) : "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatNumber(kpis.approvedCount)} aprovados
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/40">
                  <CardHeader className="pb-1 pt-3 px-3">
                    <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Pag. Aprovados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <p className="text-lg font-bold text-foreground">
                      {formatNumber(kpis.approvedCount)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">no periodo</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
