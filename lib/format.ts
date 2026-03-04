export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

/** Returns today's date in Brazil timezone (America/Sao_Paulo) as YYYY-MM-DD */
export function todayBrazil(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

/** Returns the first day of the current month in Brazil timezone as YYYY-MM-DD */
export function firstOfMonthBrazil(): string {
  const [year, month] = todayBrazil().split("-");
  return `${year}-${month}-01`;
}

export function getDateRange(period: string): { from: string; to: string } {
  const todayStr = todayBrazil();

  function subtractDays(dateStr: string, days: number): string {
    const d = new Date(dateStr + "T12:00:00");
    d.setDate(d.getDate() - days);
    return d.toISOString().split("T")[0];
  }

  switch (period) {
    case "today":
      return { from: todayStr, to: todayStr };
    case "yesterday": {
      const y = subtractDays(todayStr, 1);
      return { from: y, to: y };
    }
    case "7d":
      return { from: subtractDays(todayStr, 6), to: todayStr };
    case "30d":
      return { from: subtractDays(todayStr, 29), to: todayStr };
    case "month":
      return { from: firstOfMonthBrazil(), to: todayStr };
    default:
      return { from: todayStr, to: todayStr };
  }
}
