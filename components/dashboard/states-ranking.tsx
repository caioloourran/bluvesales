"use client";

import type { StateRanking } from "@/lib/kpi";

const STATE_NAMES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapa", AM: "Amazonas", BA: "Bahia",
  CE: "Ceara", DF: "Distrito Federal", ES: "Espirito Santo", GO: "Goias",
  MA: "Maranhao", MT: "Mato Grosso", MS: "Mato Grosso do Sul",
  MG: "Minas Gerais", PA: "Para", PB: "Paraiba", PR: "Parana",
  PE: "Pernambuco", PI: "Piaui", RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondonia",
  RR: "Roraima", SC: "Santa Catarina", SP: "Sao Paulo", SE: "Sergipe",
  TO: "Tocantins",
};

interface StatesRankingProps {
  data: StateRanking[];
}

export function StatesRanking({ data }: StatesRankingProps) {
  const maxCount = data.length > 0 ? data[0].count : 1;

  return (
    <div className="rounded-xl border border-border/60 bg-card">
      <div className="border-b border-border/40 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-foreground">
          Top Estados
        </h2>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Estados com mais agendamentos
        </p>
      </div>
      <div className="p-4">
        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            Sem dados para o periodo
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {data.slice(0, 10).map((item, i) => {
              const pct = (item.count / maxCount) * 100;
              return (
                <div key={item.estado} className="flex items-center gap-3">
                  <span className="w-5 text-right text-xs font-medium text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <span className="w-7 shrink-0 text-xs font-bold text-foreground">
                      {item.estado}
                    </span>
                    <div className="relative h-5 flex-1 overflow-hidden rounded bg-muted/50">
                      <div
                        className="absolute inset-y-0 left-0 rounded bg-blue-500/20 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                      <div
                        className="absolute inset-y-0 left-0 w-0.5 rounded-l bg-blue-500 transition-all"
                        style={{ width: `${Math.max(pct, 2)}%`, maxWidth: "3px" }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-foreground">
                      {item.count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
