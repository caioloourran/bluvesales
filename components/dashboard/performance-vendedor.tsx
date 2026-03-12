"use client";

import { formatBRL, formatNumber } from "@/lib/format";
import type { SellerRanking } from "@/lib/kpi";

interface PerformanceVendedorProps {
  rankings: SellerRanking[];
}

export function PerformanceVendedor({ rankings }: PerformanceVendedorProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card">
      <div className="border-b border-border/40 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-foreground">
          Performance por Vendedor
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 text-muted-foreground">
              <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider">
                Vendedor
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-wider">
                Vendas
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-wider">
                Valor Bruto
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-wider">
                Valor Liq.
              </th>
              <th className="hidden px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-wider md:table-cell">
                Comissao Bruta
              </th>
              <th className="hidden px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-wider md:table-cell">
                Comissao Liq.
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-wider">
                Lucro
              </th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((r, i) => (
              <tr
                key={r.sellerId}
                className={`border-b border-border/20 transition-colors hover:bg-muted/30 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
              >
                <td className="px-4 py-2.5 font-medium text-foreground">
                  {r.sellerName}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-foreground">
                  {formatNumber(r.salesQty)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-foreground">
                  {formatBRL(r.grossValue)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-foreground">
                  {formatBRL(r.netValue)}
                </td>
                <td className="hidden px-4 py-2.5 text-right tabular-nums text-foreground md:table-cell">
                  {formatBRL(r.grossCommission)}
                </td>
                <td className="hidden px-4 py-2.5 text-right tabular-nums text-foreground md:table-cell">
                  {formatBRL(r.netCommission)}
                </td>
                <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${r.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {formatBRL(r.profit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
