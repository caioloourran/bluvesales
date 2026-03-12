"use client";

import { formatNumber, formatPercent } from "@/lib/format";
import type { CobrancaPerformance } from "@/lib/kpi";

interface PerformanceCobrancaProps {
  data: CobrancaPerformance[];
}

export function PerformanceCobranca({ data }: PerformanceCobrancaProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card">
      <div className="border-b border-border/40 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-foreground">
          Performance por Cobranca
        </h2>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Efetividade de cobranca por vendedor
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 text-muted-foreground">
              <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider">
                Vendedor
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-wider">
                Total Pedidos
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-wider">
                Cobrados
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-wider">
                Pagos
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-wider">
                Frustrados
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-wider">
                Conversao
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => (
              <tr
                key={r.sellerId}
                className={`border-b border-border/20 transition-colors hover:bg-muted/30 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
              >
                <td className="px-4 py-2.5 font-medium text-foreground">
                  {r.sellerName}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-foreground">
                  {formatNumber(r.totalOrders)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-foreground">
                  {formatNumber(r.cobrados)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatNumber(r.pagos)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                  {formatNumber(r.frustrados)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                    r.conversionRate >= 0.5
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : r.conversionRate >= 0.25
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  }`}>
                    {formatPercent(r.conversionRate)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
