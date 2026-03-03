"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DailyMetric } from "@/lib/kpi";

interface DailyChartProps {
  data: DailyMetric[];
  isAdmin: boolean;
}

const adminMetrics = [
  { key: "investment", label: "Investimento", color: "hsl(12, 76%, 61%)" },
  { key: "leads", label: "Leads", color: "hsl(173, 58%, 39%)" },
  { key: "salesQty", label: "Vendas", color: "hsl(197, 37%, 24%)" },
  { key: "profit", label: "Lucro", color: "hsl(43, 74%, 66%)" },
  { key: "grossValue", label: "Valor Bruto", color: "hsl(27, 87%, 67%)" },
];

const sellerMetrics = [
  { key: "netCommission", label: "Comissao Liquida", color: "hsl(173, 58%, 39%)" },
  { key: "grossValue", label: "Valor Bruto", color: "hsl(27, 87%, 67%)" },
];

export function DailyChart({ data, isAdmin }: DailyChartProps) {
  const metrics = isAdmin ? adminMetrics : sellerMetrics;
  const defaultMetric = isAdmin ? "profit" : "netCommission";
  const [selectedMetric, setSelectedMetric] = useState(defaultMetric);
  const metric = metrics.find((m) => m.key === selectedMetric) || metrics[0];

  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    }),
  }));

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base font-semibold">
          Metricas Diarias
        </CardTitle>
        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {metrics.map((m) => (
              <SelectItem key={m.key} value={m.key}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formatted}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="label"
                className="text-xs"
                tick={{ fill: "hsl(0, 0%, 45%)" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(0, 0%, 45%)" }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(0, 0%, 89.8%)",
                  borderRadius: "6px",
                }}
              />
              <Line
                type="monotone"
                dataKey={selectedMetric}
                name={metric.label}
                stroke={metric.color}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
