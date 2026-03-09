# Ranking Redesign — Design Document
**Date:** 2026-03-09
**Status:** Approved

## Overview

Redesign the seller ranking page to include a visual podium with Top 3 highlighted (avatars + trophies), daily and monthly ranking tabs, individual and team monthly goals, and seller-facing access with their own position highlighted. Non-financial data only shown to sellers.

## Approach

**Option A — Unified page with role-aware view** (chosen)

Single `/ranking` route accessible to all authenticated users. The server detects role and current user, passes that context to the client component which adapts what is displayed. Admin sees full financial table; sellers see agendamentos only with own position highlighted.

## Data Model

### Migration `014-add-ranking-goals.sql`

```sql
-- Individual seller monthly goal (agendamentos)
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_goal INTEGER DEFAULT 0;

-- Team goal (single-row settings table)
CREATE TABLE IF NOT EXISTS ranking_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  team_goal INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT ranking_settings_single_row CHECK (id = 1)
);
INSERT INTO ranking_settings (id, team_goal) VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;
```

### Updated `SellerRanking` interface (`lib/kpi.ts`)

Add fields:
- `sellerAvatar: string | null`
- `monthlyGoal: number`

`getSellerRankings()` adds a JOIN to fetch `avatar` and `monthly_goal` from `users`.

## Configuration — Goals (Admin)

**Location:** `/users` page (admin only)

**Individual goal:** Add "Meta Mensal (agendamentos)" numeric input to the existing user edit dialog. Saved via `updateUserGoal(userId, goal)` server action in `admin-actions.ts`.

**Team goal:** Card at the top of `/users` page with a single numeric input + Save button. Saved via `updateTeamGoal(goal)` server action in `admin-actions.ts`.

## Ranking Page Visual Design

### Access Control
- Change `requireAdmin()` → `requireAuth()` in `ranking/page.tsx`
- Pass `currentUserId` and `isAdmin` down to client component
- Fetch `team_goal` from `ranking_settings`

### Tab: "Ranking do Dia" | "Ranking do Mês"
- "Hoje" uses `todayBrazil()` for both `dateFrom` and `dateTo`
- "Mes" uses `firstOfMonthBrazil()` → `todayBrazil()`
- Tab selection stored in URL param `?tab=today|month`

### Podium — Top 3 (both admin and seller views)
```
       [ 🥇 ]
  [🥈] [  1 ] [🥉]
  [ 2 ] Avatar [ 3 ]
       Name
     42 agend.
   ████████░░ 85%
```
- Heights: 2nd = shorter left pillar, 1st = tallest center, 3rd = shortest right pillar
- Avatar circular (photo or initials fallback)
- Gold/silver/bronze glow ring on avatars
- Name + agendamentos count + mini progress bar of individual goal
- If fewer than 3 sellers, remaining slots show "—"

### Team Goal Bar (below podium)
```
Meta da Equipe: 143 / 200 agendamentos — 71%
[████████████████████░░░░░] 71%
```
- Green fill when >= 100%, indigo otherwise
- Hidden if team_goal = 0

### "Sua Posição" Card (sellers only)
- Indigo-bordered card pinned after the podium
- Shows: `#4 Você (João) — 18 agendamentos — Meta: 35 (51%)`
- Hidden if seller is already in Top 3 (already visible in podium)

### Full List

**Admin columns:** # | Avatar | Nome | Agendamentos | Meta % | Valor Bruto | Lucro

**Seller columns:** # | Avatar | Nome | Agendamentos | Meta %

- Own row: highlighted with `bg-indigo-500/10 border-l-2 border-indigo-500`
- Top 3 rows: subtle gold/silver/bronze left border

### Sidebar
- Add `/ranking` link to seller nav links in `app-sidebar.tsx` (currently only admin has it)

## Files Changed

| File | Change |
|------|--------|
| `scripts/014-add-ranking-goals.sql` | New migration |
| `lib/kpi.ts` | Add `sellerAvatar`, `monthlyGoal` to `SellerRanking`; update query |
| `lib/actions/admin-actions.ts` | Add `updateUserGoal`, `updateTeamGoal` |
| `app/(dashboard)/ranking/page.tsx` | `requireAuth()`, fetch team_goal, pass role+userId |
| `components/ranking/ranking-client.tsx` | Full redesign: podium, tabs, own-position card, role-aware list |
| `app/(dashboard)/users/page.tsx` | Fetch + display team_goal; pass monthly_goal per user |
| `components/users/` (user edit component) | Add monthly_goal field |
| `components/app-sidebar.tsx` | Add `/ranking` to seller nav links |

## Success Criteria

- [ ] Admin and sellers both access `/ranking`
- [ ] Top 3 podium shows avatars, trophies, agendamentos count and goal progress
- [ ] Tabs switch between today and this month
- [ ] Seller sees own position highlighted even if outside Top 3
- [ ] Team goal bar shows correct % progress
- [ ] Admin can set individual and team goals from `/users`
- [ ] Sellers do not see financial data (lucro, investimento) of other sellers
