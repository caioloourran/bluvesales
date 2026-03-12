"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { WeeklyData } from "@/lib/kpi";

interface WeeklyChartProps {
  data: WeeklyData[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card">
      <div className="flex items-center justify-between border-b border-border/40 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-foreground">
          Pedidos Semanal
        </h2>
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />
            Agendados
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            Aprovados
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-zinc-400" />
            Frustrados
          </span>
        </div>
      </div>
      <div className="p-4">
        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            Sem dados para o periodo selecionado
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barGap={2} barCategoryGap="20%">
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  className="stroke-border/50"
                />
                <XAxis
                  dataKey="weekLabel"
                  tick={{ fontSize: 11, fill: "hsl(0,0%,55%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(0,0%,55%)" }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0,0%,100%)",
                    border: "1px solid hsl(0,0%,90%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                  cursor={{ fill: "hsl(0,0%,95%)", radius: 4 }}
                />
                <Legend content={() => null} />
                <Bar
                  dataKey="agendados"
                  name="Agendados"
                  fill="hsl(217, 91%, 60%)"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="aprovados"
                  name="Aprovados"
                  fill="hsl(160, 84%, 39%)"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="frustrados"
                  name="Frustrados"
                  fill="hsl(0, 0%, 65%)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
