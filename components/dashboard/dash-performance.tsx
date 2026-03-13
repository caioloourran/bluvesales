"use client";

import { formatBRL, formatNumber, formatPercent } from "@/lib/format";
import type { SellerRanking, CobrancaPerformance } from "@/lib/kpi";

interface Props {
  sellers: SellerRanking[];
  cobranca: CobrancaPerformance[];
}

const AVATAR_COLORS = [
  { bg: "var(--d-green-s)", text: "var(--d-green)" },
  { bg: "var(--d-blue-s)", text: "var(--d-blue)" },
  { bg: "var(--d-purple-s)", text: "var(--d-purple)" },
  { bg: "var(--d-amber-s)", text: "var(--d-amber)" },
  { bg: "var(--d-red-s)", text: "var(--d-red)" },
  { bg: "var(--d-orange-s)", text: "var(--d-orange)" },
];

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

export function DashPerformance({ sellers, cobranca }: Props) {
  return (
    <div className="d-card d-animate p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--d-t100)" }}>
          <span className="opacity-50">👥</span>
          Performance por Atendente
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--d-border)" }}>
              {["Atendente", "Vendas", "Confirm.", "Inadimpl.", "Lucro"].map((h) => (
                <th
                  key={h}
                  className="px-2.5 pb-3 text-left text-[9.5px] font-semibold uppercase tracking-[1.2px]"
                  style={{ color: "var(--d-t500)", textAlign: h === "Lucro" ? "right" : "left" }}
                >
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
                <tr
                  key={s.sellerId}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.025)" }}
                >
                  <td className="px-2.5 py-[11px] text-[12.5px]" style={{ color: "var(--d-t300)" }}>
                    <span
                      className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-[7px] align-middle text-[10.5px] font-semibold"
                      style={{ background: ac.bg, color: ac.text }}
                    >
                      {getInitials(s.sellerName)}
                    </span>
                    {s.sellerName}
                  </td>
                  <td className="px-2.5 py-[11px] text-[12.5px]" style={{ color: "var(--d-t300)" }}>
                    {formatNumber(s.salesQty)}
                  </td>
                  <td className="px-2.5 py-[11px]">
                    <span
                      className="inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                      style={{
                        background: confirmRate >= 0.4 ? "var(--d-green-s)" : confirmRate >= 0.25 ? "var(--d-amber-s)" : "var(--d-red-s)",
                        color: confirmRate >= 0.4 ? "var(--d-green)" : confirmRate >= 0.25 ? "var(--d-amber)" : "var(--d-red)",
                      }}
                    >
                      {formatPercent(confirmRate)}
                    </span>
                  </td>
                  <td className="px-2.5 py-[11px] text-[12.5px]" style={{
                    color: inadRate > 0.15 ? "var(--d-red)" : inadRate > 0.08 ? "var(--d-amber)" : "var(--d-green)"
                  }}>
                    {formatPercent(inadRate)}
                  </td>
                  <td className="px-2.5 py-[11px] text-right text-[12.5px] font-semibold" style={{
                    color: s.profit >= 0 ? "var(--d-t100)" : "var(--d-red)"
                  }}>
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
