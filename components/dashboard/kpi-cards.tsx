import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL, formatNumber, formatPercent } from "@/lib/format";
import type { KPIData } from "@/lib/kpi";
import { Calendar, CheckSquare } from "lucide-react";

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
      {isAdmin && <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Gastos em Anúncios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">
              {formatBRL(kpis.investment)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {kpis.daysInPeriod > 0
                ? `${kpis.daysInPeriod} dia${kpis.daysInPeriod > 1 ? "s" : ""} registrado${kpis.daysInPeriod > 1 ? "s" : ""}`
                : "Nenhum registro"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Total de Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {formatNumber(kpis.leads)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              CPL médio: {kpis.cpl !== null ? formatBRL(kpis.cpl) : "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Taxa Lead → Pagamento
            </CardTitle>
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Lucro Total (Período)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${kpis.approvedProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
              {formatBRL(kpis.approvedProfit)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Somente pagamentos aprovados
            </p>
          </CardContent>
        </Card>
      </div>}

      {/* Seller view - Agendado summary */}
      {!isAdmin && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Pedidos Agendados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatNumber(kpis.salesQty)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">no período</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Faturamento Agendado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-500">
                {formatBRL(kpis.grossValue)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Total agendado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Total de Leads
              </CardTitle>
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Leads p/ Agendamento
              </CardTitle>
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
                <Card className="border-border/50">
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

                <Card className="border-border/50">
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

                <Card className="border-border/50">
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

                <Card className="border-border/50">
                  <CardHeader className="pb-1 pt-3 px-3">
                    <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Agendamentos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <p className="text-lg font-bold text-foreground">
                      {formatNumber(kpis.salesQty)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">no período</p>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
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

                <Card className="border-border/50">
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
                <CheckSquare className="h-4 w-4 text-green-500" />
                Aprovado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Card className="border-border/50">
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

                <Card className="border-border/50">
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

                <Card className="border-border/50">
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

                <Card className="border-border/50">
                  <CardHeader className="pb-1 pt-3 px-3">
                    <CardTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Pag. Aprovados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <p className="text-lg font-bold text-foreground">
                      {formatNumber(kpis.approvedCount)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">no período</p>
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
