"use client";

import { formatBRL, formatNumber } from "@/lib/format";
import type { AgingBucket } from "@/lib/kpi";

interface Props {
  data: AgingBucket[];
}

const AGING_STYLES = [
  { gradient: "linear-gradient(90deg, #34D399, #22D3EE)", color: "var(--d-green)" },
  { gradient: "linear-gradient(90deg, #FBBF24, #FB923C)", color: "var(--d-amber)" },
  { gradient: "linear-gradient(90deg, #FB923C, #F87171)", color: "var(--d-red)", opacity: 0.8 },
  { gradient: "var(--d-red)", color: "var(--d-red)", opacity: 0.6 },
];

export function DashAging({ data }: Props) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const totalValue = data.reduce((sum, d) => sum + d.value, 0);
  const totalCount = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="d-card d-animate p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--d-t100)" }}>
          <span className="opacity-50">📅</span>
          Aging de Recebiveis
        </h3>
      </div>

      {data.length === 0 || totalCount === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm" style={{ color: "var(--d-t400)" }}>
          Nenhum recebivel pendente
        </div>
      ) : (
        <>
          {data.map((bucket, i) => {
            const style = AGING_STYLES[i] || AGING_STYLES[3];
            const pct = (bucket.value / maxValue) * 100;
            return (
              <div key={bucket.label} className="mb-4 last:mb-0">
                <div className="mb-1.5 flex justify-between">
                  <span className="text-xs" style={{ color: "var(--d-t300)" }}>{bucket.label}</span>
                  <span className="text-[13px] font-semibold" style={{ color: style.color, opacity: style.opacity || 1 }}>
                    {formatBRL(bucket.value)}
                  </span>
                </div>
                <div className="h-[7px] w-full overflow-hidden rounded" style={{ background: "var(--d-base)" }}>
                  <div
                    className="h-full rounded transition-all duration-1000"
                    style={{ width: `${pct}%`, background: style.gradient, opacity: style.opacity || 1 }}
                  />
                </div>
                <p className="mt-[3px] text-[10px]" style={{ color: "var(--d-t500)" }}>
                  {formatNumber(bucket.count)} pedido{bucket.count !== 1 ? "s" : ""}
                </p>
              </div>
            );
          })}

          {/* Forecast box */}
          <div
            className="mt-5 rounded-[10px] border px-4 py-3.5"
            style={{
              background: "linear-gradient(135deg, rgba(52,211,153,0.05), rgba(96,165,250,0.03))",
              borderColor: "rgba(52,211,153,0.08)",
            }}
          >
            <p className="text-[9.5px] font-semibold uppercase tracking-[1.2px]" style={{ color: "var(--d-t500)" }}>
              Total Pendente
            </p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold" style={{ color: "var(--d-green)", letterSpacing: "-0.03em" }}>
                {formatBRL(totalValue)}
              </span>
              <span className="text-[11px] font-medium" style={{ color: "var(--d-green)" }}>
                {formatNumber(totalCount)} pedidos
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
