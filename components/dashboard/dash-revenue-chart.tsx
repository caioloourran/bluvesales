"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { formatBRL } from "@/lib/format";
import type { DailyMetric } from "@/lib/kpi";

interface Props {
  dailyMetrics: DailyMetric[];
}

export function DashRevenueChart({ dailyMetrics }: Props) {
  const data = dailyMetrics.map((d) => ({
    label: new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    receita: d.grossValue,
    investimento: d.investment,
    lucro: d.profit,
  }));

  return (
    <div className="d-card d-animate p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--d-t100)" }}>
          <span className="opacity-50">📊</span>
          Fluxo de Receita — Diario
        </h3>
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
          style={{ background: "var(--d-green-s)", color: "var(--d-green)" }}
        >
          Atualizado
        </span>
      </div>
      {data.length === 0 ? (
        <div className="flex h-[210px] items-center justify-center text-sm" style={{ color: "var(--d-t400)" }}>
          Sem dados para o periodo
        </div>
      ) : (
        <div className="h-[210px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="gGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34D399" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gAmber" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FBBF24" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#FBBF24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#3A3F50" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#3A3F50" }}
                axisLine={false}
                tickLine={false}
                width={65}
                tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "#131720",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#C8CBD4",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                }}
                formatter={(value: number, name: string) => [formatBRL(value), name === "receita" ? "Receita" : name === "investimento" ? "Investimento" : "Lucro"]}
                labelStyle={{ color: "#5A5F72" }}
              />
              <Area
                type="monotone"
                dataKey="receita"
                stroke="#34D399"
                strokeWidth={2.5}
                fill="url(#gGreen)"
                dot={false}
                activeDot={{ r: 4, fill: "#34D399" }}
              />
              <Area
                type="monotone"
                dataKey="investimento"
                stroke="#FBBF24"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                fill="url(#gAmber)"
                dot={false}
                activeDot={{ r: 3, fill: "#FBBF24" }}
              />
              <Area
                type="monotone"
                dataKey="lucro"
                stroke="#F87171"
                strokeWidth={1.2}
                strokeDasharray="3 4"
                fill="none"
                dot={false}
                activeDot={{ r: 3, fill: "#F87171" }}
                opacity={0.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-2.5 flex gap-5">
        {[
          { color: "#34D399", label: "Receita" },
          { color: "#FBBF24", label: "Investimento" },
          { color: "#F87171", label: "Lucro" },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--d-t400)" }}>
            <span className="inline-block h-[3px] w-3.5 rounded" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
