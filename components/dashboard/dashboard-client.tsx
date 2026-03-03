"use client";

import { Suspense } from "react";
import type { KPIData } from "@/lib/kpi";
import { KPICards } from "./kpi-cards";
import { PeriodFilter } from "./period-filter";

interface DashboardClientProps {
  kpis: KPIData;
  period: string;
  dateFrom: string;
  dateTo: string;
  isAdmin: boolean;
}

export function DashboardClient({
  kpis,
  period,
  dateFrom,
  dateTo,
  isAdmin,
}: DashboardClientProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral da performance comercial
          </p>
        </div>
        <Suspense>
          <PeriodFilter
            period={period}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />
        </Suspense>
      </div>

      <KPICards kpis={kpis} isAdmin={isAdmin} />
    </div>
  );
}
