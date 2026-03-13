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
    agendamento: d.grossValue,
    investimento: d.investment,
    lucro: d.profit,
  }));

  return (
    <div className="d-animate overflow-hidden rounded-2xl border border-border/60 bg-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Fluxo Diario
        </h3>
        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
          Atualizado
        </span>
      </div>
      {data.length === 0 ? (
        <div className="flex h-[210px] items-center justify-center text-sm text-muted-foreground">
          Sem dados para o periodo
        </div>
      ) : (
        <div className="h-[210px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 88%)" strokeOpacity={0.5} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(220, 9%, 46%)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(220, 9%, 46%)" }}
                axisLine={false}
                tickLine={false}
                width={65}
                tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(var(--foreground))",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = { agendamento: "Agendamento", investimento: "Investimento", lucro: "Lucro" };
                  return [formatBRL(value), labels[name] || name];
                }}
                labelStyle={{ color: "hsl(220, 9%, 46%)" }}
              />
              <Area
                type="monotone"
                dataKey="agendamento"
                stroke="hsl(217, 91%, 60%)"
                strokeWidth={2.5}
                fill="url(#gBlue)"
                dot={false}
                activeDot={{ r: 4, fill: "hsl(217, 91%, 60%)" }}
              />
              <Area
                type="monotone"
                dataKey="lucro"
                stroke="hsl(160, 84%, 39%)"
                strokeWidth={2}
                fill="url(#gGreen)"
                dot={false}
                activeDot={{ r: 3, fill: "hsl(160, 84%, 39%)" }}
              />
              <Area
                type="monotone"
                dataKey="investimento"
                stroke="hsl(0, 84%, 60%)"
                strokeWidth={1.2}
                strokeDasharray="4 3"
                fill="none"
                dot={false}
                activeDot={{ r: 3, fill: "hsl(0, 84%, 60%)" }}
                opacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="mt-2.5 flex gap-5">
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="inline-block h-[3px] w-3.5 rounded bg-blue-500" />Agendamento
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="inline-block h-[3px] w-3.5 rounded bg-emerald-500" />Lucro
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="inline-block h-[3px] w-3.5 rounded bg-rose-400 opacity-60" />Investimento
        </span>
      </div>
    </div>
  );
}
