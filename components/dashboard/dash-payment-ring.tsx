"use client";

import { formatBRL, formatPercent } from "@/lib/format";
import type { FunnelData, KPIData } from "@/lib/kpi";

interface Props {
  funnelData: FunnelData;
  kpis: KPIData;
}

export function DashPaymentRing({ funnelData, kpis }: Props) {
  const total = funnelData.total || 1;
  const confirmadoPct = funnelData.pagos / total;
  const cobradosPct = funnelData.cobrados / total;
  const inadPct = funnelData.inadimplentes / total;
  const outroPct = 1 - confirmadoPct - cobradosPct - inadPct;

  // SVG donut segments
  const circumference = 2 * Math.PI * 48; // r=48
  const segments = [
    { pct: confirmadoPct, color: "var(--d-green)", label: "Confirmado", value: formatBRL(kpis.approvedRevenue) },
    { pct: cobradosPct, color: "var(--d-amber)", label: "Pendente", value: formatBRL(Math.max(kpis.grossValue - kpis.approvedRevenue, 0)) },
    { pct: inadPct, color: "var(--d-red)", label: "Inadimplente", value: formatPercent(inadPct) },
    { pct: Math.max(outroPct, 0), color: "var(--d-blue)", label: "Outros", value: formatPercent(Math.max(outroPct, 0)) },
  ];

  let offset = 0;

  return (
    <div className="d-card d-animate p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--d-t100)" }}>
          <span className="opacity-50">📊</span>
          Status de Pagamentos
        </h3>
      </div>

      <div className="flex items-center gap-6">
        {/* Ring */}
        <div className="relative h-[130px] w-[130px] shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="60" cy="60" r="48" fill="none" stroke="var(--d-elevated)" strokeWidth="11" />
            {segments.map((seg, i) => {
              const dashLength = seg.pct * circumference;
              const currentOffset = offset;
              offset += dashLength;
              return (
                <circle
                  key={i}
                  cx="60" cy="60" r="48"
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="11"
                  strokeDasharray={`${dashLength} ${circumference}`}
                  strokeDashoffset={-currentOffset}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[28px] font-bold" style={{ color: "var(--d-green)", letterSpacing: "-0.03em" }}>
              {(confirmadoPct * 100).toFixed(0)}%
            </span>
            <span className="text-[10px]" style={{ color: "var(--d-t400)" }}>confirmado</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2.5">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-2 text-xs" style={{ color: "var(--d-t300)" }}>
              <div className="h-2 w-2 rounded-[3px] shrink-0" style={{ background: seg.color }} />
              <span className="flex-1">{seg.label}</span>
              <span className="min-w-[55px] text-right font-semibold" style={{ color: "var(--d-t100)" }}>
                {seg.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
