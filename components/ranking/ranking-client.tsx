"use client";

import { useRouter } from "next/navigation";
import { Trophy, Target, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SellerRanking } from "@/lib/kpi";

interface RankingClientProps {
  rankings: SellerRanking[];
  tab: "today" | "month";
  isAdmin: boolean;
  currentUserId: number;
  teamGoal: number;
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function SellerAvatar({
  seller,
  size = "md",
}: {
  seller: SellerRanking;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-base",
  };
  if (seller.sellerAvatar) {
    return (
      <img
        src={seller.sellerAvatar}
        alt={seller.sellerName}
        className={`${sizeClasses[size]} rounded-full object-cover`}
      />
    );
  }
  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-center`}
    >
      {initials(seller.sellerName)}
    </div>
  );
}

function GoalBar({
  value,
  total,
  colorClass = "bg-indigo-500",
}: {
  value: number;
  total: number;
  colorClass?: string;
}) {
  if (total === 0) return null;
  const pct = Math.min(100, Math.round((value / total) * 100));
  return (
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full ${colorClass} rounded-full`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function RankingClient({
  rankings,
  tab,
  isAdmin,
  currentUserId,
  teamGoal,
}: RankingClientProps) {
  const router = useRouter();

  function switchTab(t: string) {
    router.push(`/ranking?tab=${t}`);
  }

  const top3 = rankings.slice(0, 3);
  const currentUserRank = rankings.findIndex((r) => r.sellerId === currentUserId);
  const currentUserInTop3 = currentUserRank >= 0 && currentUserRank < 3;
  const currentUserEntry = rankings[currentUserRank];

  const teamTotal = rankings.reduce((s, r) => s + r.salesQty, 0);

  // Podium order: 2nd on left, 1st in center, 3rd on right
  const podiumSlots = [top3[1], top3[0], top3[2]];
  const podiumRanks = [2, 1, 3];
  const podiumTrophies = ["🥈", "🥇", "🥉"];
  const podiumHeights = ["h-20", "h-28", "h-16"];
  const podiumRingColors = [
    "ring-2 ring-slate-300 dark:ring-slate-500",
    "ring-2 ring-yellow-400 dark:ring-yellow-500",
    "ring-2 ring-amber-600 dark:ring-amber-700",
  ];

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const goalPct = (qty: number, goal: number) =>
    goal > 0 ? Math.min(100, Math.round((qty / goal) * 100)) : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header + tabs */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ranking de Vendedores</h1>
          <p className="text-sm text-muted-foreground">
            Desempenho da equipe em agendamentos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={tab === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => switchTab("month")}
          >
            Ranking do Mês
          </Button>
          <Button
            variant={tab === "today" ? "default" : "outline"}
            size="sm"
            onClick={() => switchTab("today")}
          >
            Ranking do Dia
          </Button>
        </div>
      </div>

      {/* Podium — Top 3 */}
      {rankings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Top 3
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-center gap-6 pt-4 pb-2">
              {podiumSlots.map((seller, i) => {
                const rank = podiumRanks[i];
                const trophy = podiumTrophies[i];
                const height = podiumHeights[i];
                const ring = podiumRingColors[i];
                return (
                  <div key={rank} className="flex flex-col items-center gap-2">
                    <span className="text-2xl">{trophy}</span>
                    {seller ? (
                      <>
                        <div className={`rounded-full ${ring}`}>
                          <SellerAvatar seller={seller} size="lg" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-foreground leading-tight max-w-[80px] truncate">
                            {seller.sellerName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {seller.salesQty} agend.
                          </p>
                          {seller.monthlyGoal > 0 && (
                            <div className="mt-1 w-20">
                              <GoalBar
                                value={seller.salesQty}
                                total={seller.monthlyGoal}
                              />
                              <p className="text-[10px] text-muted-foreground text-center mt-0.5">
                                {goalPct(seller.salesQty, seller.monthlyGoal)}%
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                        —
                      </div>
                    )}
                    {/* Podium pillar */}
                    <div
                      className={`${height} w-20 rounded-t-lg flex items-center justify-center text-lg font-bold ${
                        rank === 1
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                          : rank === 2
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500"
                      }`}
                    >
                      #{rank}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team goal bar */}
      {teamGoal > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Meta da Equipe</span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {teamTotal} / {teamGoal} agendamentos —{" "}
                {Math.min(100, Math.round((teamTotal / teamGoal) * 100))}%
              </span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  teamTotal >= teamGoal ? "bg-emerald-500" : "bg-indigo-500"
                }`}
                style={{
                  width: `${Math.min(100, Math.round((teamTotal / teamGoal) * 100))}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* "Sua Posição" card — sellers only, hidden if in top 3 */}
      {!isAdmin && !currentUserInTop3 && currentUserEntry && (
        <Card className="border-indigo-500/40 border-l-4 border-l-indigo-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-sm font-bold">
                #{currentUserRank + 1}
              </div>
              <SellerAvatar seller={currentUserEntry} size="sm" />
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  Você — {currentUserEntry.salesQty} agendamentos
                </p>
                {currentUserEntry.monthlyGoal > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Meta: {currentUserEntry.monthlyGoal} (
                    {goalPct(currentUserEntry.salesQty, currentUserEntry.monthlyGoal)}%)
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Classificação Completa
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rankings.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum dado encontrado para este período.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Agendamentos</TableHead>
                  <TableHead>Meta %</TableHead>
                  {isAdmin && (
                    <>
                      <TableHead>Valor Bruto</TableHead>
                      <TableHead>Lucro</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankings.map((r, idx) => {
                  const isMe = r.sellerId === currentUserId;
                  const pct = goalPct(r.salesQty, r.monthlyGoal);
                  const rankBorder =
                    idx === 0
                      ? "border-l-2 border-l-yellow-400"
                      : idx === 1
                      ? "border-l-2 border-l-slate-400"
                      : idx === 2
                      ? "border-l-2 border-l-amber-600"
                      : "";
                  return (
                    <TableRow
                      key={r.sellerId}
                      className={`${
                        isMe
                          ? "bg-indigo-500/10 border-l-2 border-l-indigo-500"
                          : rankBorder
                      }`}
                    >
                      <TableCell className="font-bold text-muted-foreground">
                        #{idx + 1}
                      </TableCell>
                      <TableCell>
                        <SellerAvatar seller={r} size="sm" />
                      </TableCell>
                      <TableCell className="font-medium">
                        {r.sellerName}
                        {isMe && (
                          <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                            você
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{r.salesQty}</TableCell>
                      <TableCell>
                        {pct !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  pct >= 100 ? "bg-emerald-500" : "bg-indigo-500"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {pct}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <>
                          <TableCell>{formatCurrency(r.grossValue)}</TableCell>
                          <TableCell
                            className={
                              r.profit >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-500"
                            }
                          >
                            {formatCurrency(r.profit)}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
