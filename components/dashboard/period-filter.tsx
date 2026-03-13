"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

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
      <div
        className="flex overflow-hidden rounded-[10px] border"
        style={{ background: "var(--d-card)", borderColor: "var(--d-border)" }}
      >
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePeriodChange(p.value)}
            className="px-[18px] py-[7px] text-xs font-medium transition-all"
            style={{
              background: selected === p.value ? "var(--d-green-s)" : "transparent",
              color: selected === p.value ? "var(--d-green)" : "var(--d-t400)",
              fontFamily: "inherit",
              border: "none",
              cursor: "pointer",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      {selected === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="rounded-lg border px-3 py-1.5 text-xs"
            style={{
              background: "var(--d-card)",
              borderColor: "var(--d-border)",
              color: "var(--d-t200)",
              colorScheme: "dark",
            }}
          />
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="rounded-lg border px-3 py-1.5 text-xs"
            style={{
              background: "var(--d-card)",
              borderColor: "var(--d-border)",
              color: "var(--d-t200)",
              colorScheme: "dark",
            }}
          />
          <button
            onClick={handleCustomApply}
            className="rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{
              background: "var(--d-green-s)",
              color: "var(--d-green)",
              border: "1px solid rgba(52,211,153,0.12)",
              cursor: "pointer",
            }}
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}
