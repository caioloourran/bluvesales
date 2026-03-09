# Ranking Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the ranking page with a visual Top-3 podium (avatars + trophies), daily/monthly tabs, individual and team monthly goals (agendamentos), seller-facing access with own position highlighted, and role-aware data visibility.

**Architecture:** Single `/ranking` route accessible to all authenticated users. Server component detects role and passes `isAdmin` + `currentUserId` to client. Client renders podium + full list; sellers only see agendamentos counts, not financial data. Goals stored in `users.monthly_goal` and a new `ranking_settings` table.

**Tech Stack:** Next.js App Router, PostgreSQL via `@neondatabase/serverless` sql tag, Tailwind CSS, shadcn/ui (Card, Table, Badge, Button, Dialog, Input, Label), lucide-react icons.

---

## Task 1: Database Migration

**Files:**
- Create: `scripts/014-add-ranking-goals.sql`

**Step 1: Create the migration file**

```sql
-- Add individual monthly goal to each user (agendamentos)
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_goal INTEGER NOT NULL DEFAULT 0;

-- Single-row team goal settings
CREATE TABLE IF NOT EXISTS ranking_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  team_goal INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT ranking_settings_single_row CHECK (id = 1)
);
INSERT INTO ranking_settings (id, team_goal) VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;
```

**Step 2: Run in Neon SQL Editor**

Copy-paste the SQL above into the Neon dashboard SQL editor and execute.
Expected: no errors, `users` table gains `monthly_goal` column, `ranking_settings` table created with one row.

**Step 3: Verify**

```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'monthly_goal';
SELECT * FROM ranking_settings;
```
Expected: row returned for the column, and `{id:1, team_goal:0}` from settings.

**Step 4: Commit**

```bash
git add scripts/014-add-ranking-goals.sql
git commit -m "Add migration 014: ranking goals (monthly_goal on users, ranking_settings table)"
```

---

## Task 2: Update SellerRanking Interface and Query

**Files:**
- Modify: `lib/kpi.ts` — `SellerRanking` interface (lines 64-78) and `getSellerRankings` function (lines 436-500)

**Step 1: Add `sellerAvatar` and `monthlyGoal` to the interface**

Find the `SellerRanking` interface and add two fields:

```typescript
export interface SellerRanking {
  sellerId: number;
  sellerName: string;
  sellerAvatar: string | null;   // ADD THIS
  monthlyGoal: number;           // ADD THIS
  salesQty: number;
  grossValue: number;
  netValue: number;
  grossCommission: number;
  netCommission: number;
  investment: number;
  leads: number;
  platformFees: number;
  productCosts: number;
  shippingCosts: number;
  profit: number;
}
```

**Step 2: Update the sellers query in `getSellerRankings` to fetch avatar and goal**

Find this line inside `getSellerRankings`:
```typescript
const sellers = await sql`SELECT id, name FROM users WHERE role = 'SELLER' ORDER BY name`;
```

Replace with:
```typescript
const sellers = await sql`SELECT id, name, avatar, monthly_goal FROM users WHERE role = 'SELLER' ORDER BY name`;
```

**Step 3: Update the `rankings.push({...})` block to include the new fields**

Find the `rankings.push({` block and add after `sellerName: seller.name,`:
```typescript
sellerAvatar: seller.avatar ?? null,
monthlyGoal: Number(seller.monthly_goal) || 0,
```

**Step 4: Verify TypeScript compiles**

```bash
cd c:/Users/Windows/Desktop/BluveSales
npx tsc --noEmit
```
Expected: no errors related to `SellerRanking`.

**Step 5: Commit**

```bash
git add lib/kpi.ts
git commit -m "Add sellerAvatar and monthlyGoal to SellerRanking interface and query"
```

---

## Task 3: Server Actions for Goals

**Files:**
- Modify: `lib/actions/admin-actions.ts`

**Step 1: Add `updateUserGoal` action at the end of the file**

```typescript
export async function updateUserGoal(userId: number, goal: number) {
  await requireAdmin();
  if (!Number.isInteger(goal) || goal < 0) return { error: "Meta invalida" };
  try {
    await sql`UPDATE users SET monthly_goal = ${goal} WHERE id = ${userId}`;
    revalidatePath("/users");
    revalidatePath("/ranking");
    return { success: true };
  } catch {
    return { error: "Erro ao salvar meta" };
  }
}

export async function updateTeamGoal(goal: number) {
  await requireAdmin();
  if (!Number.isInteger(goal) || goal < 0) return { error: "Meta invalida" };
  try {
    await sql`UPDATE ranking_settings SET team_goal = ${goal} WHERE id = 1`;
    revalidatePath("/ranking");
    return { success: true };
  } catch {
    return { error: "Erro ao salvar meta da equipe" };
  }
}
```

Make sure `revalidatePath` is already imported at the top of `admin-actions.ts` (it should be).

**Step 2: Verify the file compiles**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add lib/actions/admin-actions.ts
git commit -m "Add updateUserGoal and updateTeamGoal server actions"
```

---

## Task 4: Users Page — Fetch Goals and Pass to Client

**Files:**
- Modify: `app/(dashboard)/users/page.tsx`

**Step 1: Update the users query to include `monthly_goal` and `avatar`**

Replace:
```typescript
const users = await sql`SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC`;
```
With:
```typescript
const users = await sql`SELECT id, name, email, role, monthly_goal, avatar, created_at FROM users ORDER BY created_at DESC`;

const teamGoalRow = await sql`SELECT team_goal FROM ranking_settings WHERE id = 1`;
const teamGoal = teamGoalRow.length > 0 ? Number(teamGoalRow[0].team_goal) : 0;
```

**Step 2: Pass `teamGoal` to `UsersClient`**

Replace:
```typescript
return <UsersClient users={users} />;
```
With:
```typescript
return <UsersClient users={users} teamGoal={teamGoal} />;
```

**Step 3: Commit**

```bash
git add app/(dashboard)/users/page.tsx
git commit -m "Users page: fetch monthly_goal, avatar and team goal"
```

---

## Task 5: Users Client — Add Goal Fields

**Files:**
- Modify: `components/admin/users-client.tsx`

**Step 1: Update the `User` interface**

Find:
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}
```
Replace with:
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  monthly_goal: number;
  created_at: string;
}
```

**Step 2: Update `Props` to include `teamGoal`**

Replace:
```typescript
interface Props {
  users: User[];
}
```
With:
```typescript
interface Props {
  users: User[];
  teamGoal: number;
}
```

**Step 3: Add state for monthly goal and team goal**

Inside `UsersClient`, add these state variables after the existing ones:
```typescript
const [monthlyGoal, setMonthlyGoal] = useState(0);
const [teamGoalInput, setTeamGoalInput] = useState(teamGoal);
const [savingTeamGoal, setSavingTeamGoal] = useState(false);
```

Update the destructure: `export function UsersClient({ users, teamGoal }: Props)`

**Step 4: Update `openEdit` to load monthly_goal**

In `openEdit`, add:
```typescript
setMonthlyGoal(u.monthly_goal || 0);
```

In `openCreate`, add:
```typescript
setMonthlyGoal(0);
```

**Step 5: Update `handleSave` to also save the goal when editing a SELLER**

In `handleSave`, after the `toast.success(...)` line, add:
```typescript
if (editing && role === "SELLER") {
  await updateUserGoal(editing.id, monthlyGoal);
}
```

Import `updateUserGoal` and `updateTeamGoal` at the top of the file:
```typescript
import { createUser, updateUser, deleteUser, updateUserGoal, updateTeamGoal } from "@/lib/actions/admin-actions";
```

**Step 6: Add team goal handler function**

```typescript
async function handleSaveTeamGoal() {
  setSavingTeamGoal(true);
  const result = await updateTeamGoal(teamGoalInput);
  setSavingTeamGoal(false);
  if (result.error) toast.error(result.error);
  else toast.success("Meta da equipe salva!");
}
```

**Step 7: Add team goal card above the user list**

In the JSX, after the page header `<div>` and before the Dialog, insert:

```tsx
{/* Team Goal Card */}
<Card>
  <CardHeader>
    <CardTitle className="text-base">Meta da Equipe este Mes</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="flex items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Agendamentos por mes</Label>
        <Input
          type="number"
          min={0}
          value={teamGoalInput}
          onChange={(e) => setTeamGoalInput(Number(e.target.value))}
          className="w-40"
          placeholder="Ex: 200"
        />
      </div>
      <Button size="sm" onClick={handleSaveTeamGoal} disabled={savingTeamGoal}>
        {savingTeamGoal && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Salvar
      </Button>
    </div>
    <p className="mt-2 text-xs text-muted-foreground">
      Meta coletiva da equipe de vendedores para o mes corrente.
    </p>
  </CardContent>
</Card>
```

**Step 8: Add monthly_goal input inside the edit/create dialog**

In the dialog form, after the role `<Select>`, add:
```tsx
{(role === "SELLER") && (
  <div className="flex flex-col gap-1.5">
    <Label>Meta Mensal (agendamentos)</Label>
    <Input
      type="number"
      min={0}
      value={monthlyGoal}
      onChange={(e) => setMonthlyGoal(Number(e.target.value))}
      placeholder="Ex: 50"
    />
  </div>
)}
```

**Step 9: Verify manually**

Visit `/users`, confirm the team goal card appears, open edit dialog for a SELLER and confirm goal input shows. Set a goal for one seller (e.g. 30) and save — confirm toast success.

**Step 10: Commit**

```bash
git add components/admin/users-client.tsx
git commit -m "Users client: add monthly_goal per seller and team goal card"
```

---

## Task 6: Ranking Page — Open to All Roles + Pass Context

**Files:**
- Modify: `app/(dashboard)/ranking/page.tsx`

**Step 1: Replace the full file content**

```typescript
import { requireAuth } from "@/lib/auth";
import { getSellerRankings } from "@/lib/kpi";
import { sql } from "@/lib/db";
import { todayBrazil, firstOfMonthBrazil } from "@/lib/format";
import { RankingClient } from "@/components/ranking/ranking-client";

export const metadata = {
  title: "Ranking de Vendedores",
};

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function RankingPage({ searchParams }: Props) {
  const session = await requireAuth();
  const params = await searchParams;
  const tab = params.tab === "today" ? "today" : "month";

  const today = todayBrazil();
  const firstOfMonth = firstOfMonthBrazil();

  const dateFrom = tab === "today" ? today : firstOfMonth;
  const dateTo = today;

  const [rankings, teamGoalRow] = await Promise.all([
    getSellerRankings(dateFrom, dateTo),
    sql`SELECT team_goal FROM ranking_settings WHERE id = 1`,
  ]);

  const teamGoal = teamGoalRow.length > 0 ? Number(teamGoalRow[0].team_goal) : 0;
  const isAdmin = session.role === "ADMIN_MASTER";

  return (
    <RankingClient
      rankings={rankings}
      tab={tab}
      teamGoal={teamGoal}
      isAdmin={isAdmin}
      currentUserId={session.id}
    />
  );
}
```

Note: `requireAuth` returns the session. Check `lib/auth.ts` — it exports `requireAuth` which returns the session object with `id` and `role`.

**Step 2: Verify `requireAuth` signature in `lib/auth.ts`**

```bash
grep -n "requireAuth" c:/Users/Windows/Desktop/BluveSales/lib/auth.ts
```

If `requireAuth` redirects without returning, use `getSession()` instead:
```typescript
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
// ...
const session = await getSession();
if (!session) redirect("/login");
```

**Step 3: Commit**

```bash
git add app/(dashboard)/ranking/page.tsx
git commit -m "Ranking page: open to all roles, add tab/teamGoal/isAdmin/currentUserId props"
```

---

## Task 7: Ranking Client — Full Redesign

**Files:**
- Modify: `components/ranking/ranking-client.tsx` (full rewrite)

This is the largest task. Replace the entire file content:

```typescript
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { Trophy, Medal, Target, Users, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatBRL, formatNumber } from "@/lib/format";
import type { SellerRanking } from "@/lib/kpi";

interface RankingClientProps {
  rankings: SellerRanking[];
  tab: "today" | "month";
  teamGoal: number;
  isAdmin: boolean;
  currentUserId: number;
}

/* ── Avatar ─────────────────────────────────────────── */
function Avatar({
  src,
  name,
  size = "md",
  ring,
}: {
  src: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  ring?: "gold" | "silver" | "bronze" | "indigo";
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sizeClass = { sm: "h-8 w-8 text-xs", md: "h-12 w-12 text-sm", lg: "h-16 w-16 text-lg" }[size];
  const ringClass = ring
    ? {
        gold:   "ring-4 ring-yellow-400/80 shadow-lg shadow-yellow-400/30",
        silver: "ring-4 ring-slate-300/80 shadow-lg shadow-slate-300/30",
        bronze: "ring-4 ring-orange-400/80 shadow-lg shadow-orange-400/30",
        indigo: "ring-2 ring-indigo-500",
      }[ring]
    : "";

  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className={cn("rounded-full object-cover", sizeClass, ringClass)}
    />
  ) : (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-indigo-500/20 font-semibold text-indigo-300",
        sizeClass,
        ringClass
      )}
    >
      {initials}
    </div>
  );
}

/* ── Progress Bar ────────────────────────────────────── */
function ProgressBar({ value, max, label }: { value: number; max: number; label?: string }) {
  if (max <= 0) return null;
  const pct = Math.min(100, Math.round((value / max) * 100));
  const done = pct >= 100;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <div className="flex justify-between text-[10px] text-white/50">
          <span>{label}</span>
          <span className={done ? "text-emerald-400 font-semibold" : ""}>{pct}%</span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            done ? "bg-emerald-400" : "bg-indigo-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ── Podium Card ─────────────────────────────────────── */
function PodiumCard({
  seller,
  position,
  isSelf,
}: {
  seller: SellerRanking | null;
  position: 1 | 2 | 3;
  isSelf: boolean;
}) {
  const medal = { 1: "🥇", 2: "🥈", 3: "🥉" }[position];
  const ring = { 1: "gold" as const, 2: "silver" as const, 3: "bronze" as const }[position];
  const pillarHeight = { 1: "h-28", 2: "h-20", 3: "h-14" }[position];
  const glowColor = {
    1: "shadow-yellow-400/20",
    2: "shadow-slate-300/10",
    3: "shadow-orange-400/15",
  }[position];
  const borderColor = {
    1: "border-yellow-400/30",
    2: "border-slate-300/20",
    3: "border-orange-400/25",
  }[position];

  return (
    <div className={cn("flex flex-col items-center gap-2", position === 1 ? "order-2 scale-105" : position === 2 ? "order-1" : "order-3")}>
      {/* Medal */}
      <span className="text-2xl">{medal}</span>

      {/* Avatar */}
      <div className="relative">
        <Avatar
          src={seller?.sellerAvatar ?? null}
          name={seller?.sellerName ?? "—"}
          size="lg"
          ring={ring}
        />
        {isSelf && (
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white">
            Eu
          </div>
        )}
      </div>

      {/* Name */}
      <p className={cn("max-w-[100px] truncate text-center text-sm font-semibold", isSelf ? "text-indigo-300" : "text-white")}>
        {seller?.sellerName ?? "—"}
      </p>

      {/* Count */}
      <p className="text-xs text-white/50">
        {seller ? `${formatNumber(seller.salesQty)} agend.` : "—"}
      </p>

      {/* Goal progress */}
      {seller && seller.monthlyGoal > 0 && (
        <div className="w-24">
          <ProgressBar value={seller.salesQty} max={seller.monthlyGoal} label="Meta" />
        </div>
      )}

      {/* Pillar */}
      <div
        className={cn(
          "w-full min-w-[80px] rounded-t-xl border",
          pillarHeight,
          borderColor,
          `shadow-lg ${glowColor}`,
          position === 1
            ? "bg-gradient-to-b from-yellow-400/20 to-yellow-400/5"
            : position === 2
            ? "bg-gradient-to-b from-slate-300/15 to-slate-300/5"
            : "bg-gradient-to-b from-orange-400/15 to-orange-400/5"
        )}
      />
    </div>
  );
}

/* ── Main Component ──────────────────────────────────── */
export function RankingClient({
  rankings,
  tab,
  teamGoal,
  isAdmin,
  currentUserId,
}: RankingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sort by salesQty descending
  const sorted = useMemo(
    () => [...rankings].sort((a, b) => b.salesQty - a.salesQty),
    [rankings]
  );

  const top3 = [sorted[0] ?? null, sorted[1] ?? null, sorted[2] ?? null];
  const teamTotal = sorted.reduce((s, r) => s + r.salesQty, 0);
  const myEntry = sorted.find((r) => r.sellerId === currentUserId);
  const myPosition = myEntry ? sorted.indexOf(myEntry) + 1 : null;
  const myInTop3 = myPosition !== null && myPosition <= 3;

  function switchTab(t: "today" | "month") {
    const p = new URLSearchParams(searchParams.toString());
    p.set("tab", t);
    router.push(`/ranking?${p.toString()}`);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
            <Trophy className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ranking de Vendedores</h1>
            <p className="text-sm text-muted-foreground">Performance por agendamentos</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl border border-border bg-muted/50 p-1">
          {(["today", "month"] as const).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
                tab === t
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "today" ? "Hoje" : "Mes Atual"}
            </button>
          ))}
        </div>
      </div>

      {/* Podium */}
      {sorted.length > 0 ? (
        <Card>
          <CardContent className="pt-8 pb-0 px-4">
            <div className="flex items-end justify-center gap-3 sm:gap-6">
              <PodiumCard seller={top3[1]} position={2} isSelf={top3[1]?.sellerId === currentUserId} />
              <PodiumCard seller={top3[0]} position={1} isSelf={top3[0]?.sellerId === currentUserId} />
              <PodiumCard seller={top3[2]} position={3} isSelf={top3[2]?.sellerId === currentUserId} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum dado para este periodo.
          </CardContent>
        </Card>
      )}

      {/* Team Goal Bar */}
      {teamGoal > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-indigo-400" />
                <span className="text-sm font-semibold text-foreground">Meta da Equipe</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatNumber(teamTotal)} / {formatNumber(teamGoal)} agendamentos
              </span>
            </div>
            <ProgressBar value={teamTotal} max={teamGoal} />
          </CardContent>
        </Card>
      )}

      {/* "My Position" card — seller only, if not in top 3 */}
      {!isAdmin && myEntry && !myInTop3 && myPosition && (
        <Card className="border-indigo-500/40 bg-indigo-500/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-indigo-400">#{myPosition}</span>
              <Avatar src={myEntry.sellerAvatar} name={myEntry.sellerName} size="md" ring="indigo" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">Voce — {myEntry.sellerName}</p>
                <p className="text-sm text-muted-foreground">{formatNumber(myEntry.salesQty)} agendamentos</p>
              </div>
              {myEntry.monthlyGoal > 0 && (
                <div className="w-32 shrink-0">
                  <ProgressBar value={myEntry.salesQty} max={myEntry.monthlyGoal} label={`Meta ${myEntry.monthlyGoal}`} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full list */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {/* Header row */}
            <div className={cn(
              "grid px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
              isAdmin ? "grid-cols-[3rem_1fr_6rem_6rem_7rem_7rem]" : "grid-cols-[3rem_1fr_6rem_7rem]"
            )}>
              <span className="text-center">#</span>
              <span>Vendedor</span>
              <span className="text-right">Agend.</span>
              {isAdmin && <span className="text-right">Val. Bruto</span>}
              {isAdmin && <span className="text-right">Lucro</span>}
              <span className="text-right">Meta</span>
            </div>

            {sorted.map((r, idx) => {
              const pos = idx + 1;
              const isMe = r.sellerId === currentUserId;
              const posLabel =
                pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : String(pos);

              return (
                <div
                  key={r.sellerId}
                  className={cn(
                    "grid items-center px-4 py-3 transition-colors",
                    isAdmin ? "grid-cols-[3rem_1fr_6rem_6rem_7rem_7rem]" : "grid-cols-[3rem_1fr_6rem_7rem]",
                    isMe
                      ? "border-l-2 border-indigo-500 bg-indigo-500/5"
                      : pos <= 3
                      ? "bg-amber-500/[0.03]"
                      : "hover:bg-muted/40"
                  )}
                >
                  <span className="text-center text-sm">{posLabel}</span>

                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar src={r.sellerAvatar} name={r.sellerName} size="sm" />
                    <span className={cn("truncate text-sm font-medium", isMe ? "text-indigo-400" : "text-foreground")}>
                      {r.sellerName}{isMe ? " (Eu)" : ""}
                    </span>
                  </div>

                  <span className="text-right text-sm font-semibold text-foreground">
                    {formatNumber(r.salesQty)}
                  </span>

                  {isAdmin && (
                    <span className="text-right text-sm text-foreground">
                      {formatBRL(r.grossValue)}
                    </span>
                  )}

                  {isAdmin && (
                    <span className={cn(
                      "flex items-center justify-end gap-1 text-sm font-semibold",
                      r.profit >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {r.profit >= 0
                        ? <TrendingUp className="h-3.5 w-3.5" />
                        : <TrendingDown className="h-3.5 w-3.5" />}
                      {formatBRL(r.profit)}
                    </span>
                  )}

                  <div className="flex justify-end">
                    {r.monthlyGoal > 0 ? (
                      <div className="w-20">
                        <ProgressBar value={r.salesQty} max={r.monthlyGoal} />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Verify the page loads without TypeScript errors**

```bash
npx tsc --noEmit
```

**Step 3: Manually verify in browser**

- Visit `/ranking` as admin: should see podium, team goal bar, full table with financial columns
- Visit `/ranking` as a seller: should see podium, team goal bar, "Sua Posicao" card (if outside top 3), list without lucro/valor bruto columns

**Step 4: Commit**

```bash
git add components/ranking/ranking-client.tsx
git commit -m "Redesign ranking: podium Top 3 with avatars, tabs, team goal bar, role-aware list"
```

---

## Task 8: Add Ranking Link to Seller Sidebar

**Files:**
- Modify: `components/app-sidebar.tsx`

**Step 1: Find `sellerLinks` array**

```typescript
const sellerLinks = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/sales", label: "Vendas", icon: ShoppingCart },
  { href: "/history", label: "Historico", icon: ClipboardList },
];
```

**Step 2: Add ranking link**

```typescript
const sellerLinks = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/sales", label: "Vendas", icon: ShoppingCart },
  { href: "/history", label: "Historico", icon: ClipboardList },
  { href: "/ranking", label: "Ranking", icon: Trophy },
];
```

`Trophy` is already imported in the file.

**Step 3: Commit**

```bash
git add components/app-sidebar.tsx
git commit -m "Add ranking link to seller sidebar"
```

---

## Task 9: Push and Apply Migration

**Step 1: Push all commits**

```bash
git push origin main
```

**Step 2: Run migration 014 in Neon SQL Editor**

Copy the contents of `scripts/014-add-ranking-goals.sql` and execute in Neon.

**Step 3: Final verification**

- Admin: go to `/users`, set team goal to e.g. `100`, edit a SELLER and set individual goal to e.g. `30`, save
- Go to `/ranking` — confirm podium shows, team goal bar shows progress, individual goal shown under each podium card
- Log in as a seller — confirm `/ranking` is accessible from sidebar, own position is highlighted, no financial columns visible

---

## Success Criteria

- [ ] Admin and sellers both access `/ranking` without redirect
- [ ] Top 3 podium shows with medal emoji, avatar/initials, agendamentos, individual goal progress bar
- [ ] "Hoje" / "Mes Atual" tabs switch ranking period
- [ ] Team goal progress bar shows below podium when team_goal > 0
- [ ] Sellers outside top 3 see "Sua Posicao" card highlighted in indigo
- [ ] Full list: sellers see only agendamentos + meta %; admin sees agendamentos + valor bruto + lucro
- [ ] Own row highlighted with indigo left border for sellers
- [ ] Admin can set individual goal per seller in `/users` edit dialog (SELLER role only)
- [ ] Admin can set team goal in `/users` page team goal card
- [ ] Ranking link appears in seller sidebar
