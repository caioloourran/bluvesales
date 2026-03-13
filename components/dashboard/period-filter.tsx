"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const periods = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "month", label: "Mes" },
  { value: "custom", label: "Custom" },
];

interface PeriodFilterProps {
  period: string;
  dateFrom: string;
  dateTo: string;
}

export function PeriodFilter({ period, dateFrom, dateTo }: PeriodFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customFrom, setCustomFrom] = useState(dateFrom);
  const [customTo, setCustomTo] = useState(dateTo);
  const [selected, setSelected] = useState(period);

  function handlePeriodChange(value: string) {
    setSelected(value);
    if (value !== "custom") {
      const params = new URLSearchParams(searchParams.toString());
      params.set("period", value);
      params.delete("from");
      params.delete("to");
      router.push(`/dashboard?${params.toString()}`);
    }
  }

  function handleCustomApply() {
    const params = new URLSearchParams();
    params.set("period", "custom");
    params.set("from", customFrom);
    params.set("to", customTo);
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex overflow-hidden rounded-lg border border-border bg-card">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePeriodChange(p.value)}
            className={`px-4 py-1.5 text-xs font-medium transition-all ${
              selected === p.value
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {selected === "custom" && (
        <div className="flex items-center gap-2">
          <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="h-8 w-36 text-xs" />
          <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="h-8 w-36 text-xs" />
          <Button onClick={handleCustomApply} size="sm" variant="outline" className="h-8 text-xs">Aplicar</Button>
        </div>
      )}
    </div>
  );
}
