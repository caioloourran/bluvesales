"use client";

import { formatBRL, formatNumber, formatPercent } from "@/lib/format";
import type { SellerRanking, CobrancaPerformance } from "@/lib/kpi";

interface Props {
  sellers: SellerRanking[];
  cobranca: CobrancaPerformance[];
}

const AVATAR_COLORS = [
  "bg-primary/10 text-primary",
  "bg-blue-500/10 text-blue-500",
  "bg-violet-500/10 text-violet-500",
  "bg-amber-500/10 text-amber-500",
  "bg-rose-500/10 text-rose-500",
  "bg-emerald-500/10 text-emerald-500",
];

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

export function DashPerformance({ sellers, cobranca }: Props) {
  return (
    <div className="d-animate overflow-hidden rounded-2xl border border-border/60 bg-card p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-foreground">Performance por Atendente</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/60">
              {["Atendente", "Vendas", "Confirm.", "Inadimpl.", "Lucro"].map((h, i) => (
                <th key={h} className={`px-2.5 pb-3 text-[9.5px] font-semibold uppercase tracking-[1.2px] text-muted-foreground ${i === 4 ? "text-right" : "text-left"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sellers.map((s, i) => {
              const cob = cobranca.find(c => c.sellerId === s.sellerId);
              const inadRate = cob ? (cob.frustrados / Math.max(cob.totalOrders, 1)) : 0;
              const confirmRate = cob ? cob.conversionRate : 0;
              const ac = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <tr key={s.sellerId} className="border-b border-border/30 transition-colors hover:bg-muted/30">
                  <td className="px-2.5 py-[11px] text-[12.5px] text-foreground">
                    <span className={`mr-2 inline-flex h-7 w-7 items-center justify-center rounded-[7px] align-middle text-[10.5px] font-semibold ${ac}`}>
                      {getInitials(s.sellerName)}
                    </span>
                    {s.sellerName}
                  </td>
                  <td className="px-2.5 py-[11px] text-[12.5px] text-foreground">{formatNumber(s.salesQty)}</td>
                  <td className="px-2.5 py-[11px]">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                      confirmRate >= 0.4 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : confirmRate >= 0.25 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-rose-500/10 text-rose-500"
                    }`}>
                      {formatPercent(confirmRate)}
                    </span>
                  </td>
                  <td className={`px-2.5 py-[11px] text-[12.5px] ${
                    inadRate > 0.15 ? "text-rose-500" : inadRate > 0.08 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                  }`}>
                    {formatPercent(inadRate)}
                  </td>
                  <td className={`px-2.5 py-[11px] text-right text-[12.5px] font-semibold ${
                    s.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                  }`}>
                    {formatBRL(s.profit)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
