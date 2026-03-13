"use client";

import { formatNumber } from "@/lib/format";
import type { FunnelData } from "@/lib/kpi";

interface Props {
  data: FunnelData;
}

export function DashFunnel({ data }: Props) {
  const total = data.total || 1;

  const steps = [
    { num: "1", label: "Pedidos cadastrados", val: data.total, color: "var(--d-blue)", numBg: "var(--d-blue-s)", numColor: "var(--d-blue)" },
    { num: "2", label: "Em transito / enviados", val: data.enviados, color: "var(--d-green)", numBg: "var(--d-green-s)", numColor: "var(--d-green)" },
    { num: "3", label: "Produto entregue", val: data.entregues, color: "var(--d-green)", numBg: "var(--d-green-s)", numColor: "var(--d-green)" },
    { num: "4", label: "Em cobranca", val: data.cobrados, color: "var(--d-amber)", numBg: "var(--d-amber-s)", numColor: "var(--d-amber)" },
    { num: "5", label: "Pagamento confirmado", val: data.pagos, color: "var(--d-green)", numBg: "var(--d-green-s)", numColor: "var(--d-green)" },
    { num: "!", label: "Inadimplentes", val: data.inadimplentes, color: "var(--d-red)", numBg: "var(--d-red-s)", numColor: "var(--d-red)" },
    { num: "✕", label: "Frustrados", val: data.frustrados, color: "var(--d-red)", numBg: "var(--d-red-s)", numColor: "var(--d-red)" },
  ];

  return (
    <div className="d-card d-animate p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--d-t100)" }}>
          <span className="opacity-50">🔻</span>
          Funil de Cobranca
        </h3>
      </div>
      <div className="flex flex-col gap-[5px]">
        {steps.map((s) => {
          const pct = total > 0 ? (s.val / total) * 100 : 0;
          return (
            <div
              key={s.label}
              className="relative flex items-center gap-3 overflow-hidden rounded-md px-3.5 py-[11px]"
              style={{ background: "var(--d-elevated)", border: "1px solid transparent" }}
            >
              {/* Background bar */}
              <div
                className="absolute inset-y-0 left-0 pointer-events-none"
                style={{ width: `${pct}%`, background: s.color, opacity: 0.04 }}
              />
              <div
                className="relative z-10 flex h-[22px] w-[22px] items-center justify-center rounded-md text-[10px] font-bold"
                style={{ background: s.numBg, color: s.numColor }}
              >
                {s.num}
              </div>
              <span className="relative z-10 flex-1 text-[12.5px]" style={{ color: "var(--d-t300)" }}>
                {s.label}
              </span>
              <span
                className="relative z-10 text-[13.5px] font-semibold"
                style={{ color: s.num === "!" || s.num === "✕" ? s.numColor : "var(--d-t100)" }}
              >
                {formatNumber(s.val)}
              </span>
              <span className="relative z-10 w-9 text-right text-[10.5px]" style={{ color: "var(--d-t400)" }}>
                {pct.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
