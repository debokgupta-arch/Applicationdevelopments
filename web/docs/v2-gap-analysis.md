# HomeShift v2: gap analysis and migration plan

Source brief: `HomeShift_Modification_Prompt.md` (v2 requirements). Baseline: the app as of web Phase 2.

## 1. What exists today

| Area           | Current state                                                                                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack          | Next.js 16 (App Router, Cache Components), TypeScript strict, Tailwind 4 + shadcn/ui (Radix), Drizzle 0.45 + postgres.js, Zod 4, React Hook Form. Local Postgres 17 with a Supabase look-alike shim (`scripts/sql/local-supabase-shim.sql`).            |
| Shell / design | Sidebar (desktop) + bottom tabs (mobile), top bar, design tokens, shared kit in `src/components/kit` (ProgressRing, StatusDot, Chip, SegmentedControl, Field, RoomChips, SwatchPicker, StatCard, EmptyState, ResponsiveDialog, DragHandle). Keep as-is. |
| Auth           | `/sign-in`: Supabase magic link + Google when configured; otherwise a local-only dev sign-in by email (signed cookie). No passwords, user names or phone. `src/proxy.ts` gates routes; `getSessionUser()` is the Data Access Layer.                     |
| Data           | Tables: profiles, homes, home_members, rooms, modules, tasks, task_rooms, vendors, quotes, attachments, templates. RLS on every table via SECURITY DEFINER helpers (`is_home_member`, `can_edit_home`, ...). `updated_at` triggers.                     |
| Onboarding     | 3-step wizard (home, dates, budget) seeds the v1 checklist (14 modules, 110 tasks) through `seedHome()`.                                                                                                                                                |
| Pages          | Dashboard, Tasks, Plan, Vendors, Documents, Settings, Module are placeholders (Phase 3 of v1 was next).                                                                                                                                                 |
| Tests          | 56 Vitest tests incl. 6 RLS integration tests against the real DB. No Playwright yet.                                                                                                                                                                   |

## 2. Gaps against v2

| v2 section           | Gap                                                                                                                                                                              | Size   |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1-2 Register / Login | No passwords, user names, mobile numbers, OTP, password reset or rate limiting. Identifier resolution (user name / mobile / email) needed.                                       | Large  |
| 3 Home details       | `address` optional; no `building_name`, `floor_label`; no Settings > Home editor.                                                                                                | Small  |
| 4 Floors             | No `floors` table; rooms not tied to floors; no length x width; no area-vs-total check; no canvas.                                                                               | Large  |
| 5 Hierarchy          | Tasks support nesting but lack `level`, `task_type`, planned/actual dates, expected/actual cost names, `manual_progress`, `is_hidden`, status `blocked`. No CRUD/reorder UI yet. | Large  |
| 5 Task types         | None of the type-specific tables exist (contacts, selections, payments, space progress, line items, materials, stages).                                                          | Large  |
| 6 Seed               | v1 seed is a flat checklist; v2 needs 5 structured modules with typed tasks, sub-tasks and stages, plus 4 starter modules kept.                                                  | Medium |
| 7 Dashboard          | Placeholder only. Needs roll-ups, cost variance, blocker rules, thresholds.                                                                                                      | Large  |
| 8 Data model         | See section 3.                                                                                                                                                                   | Medium |
| 10 Business rules    | `computeProgress`, `rollupCost`, `rollupDates`, `isLate`, `isOverBudget`, `plannedProgress` don't exist.                                                                         | Medium |
| 10 E2E               | Playwright not installed.                                                                                                                                                        | Medium |

## 3. Schema migration plan (v2 Phase 1)

All changes are additive first, then data is copied, then old columns are dropped, so no data is lost. Four migrations, applied in order by `pnpm db:migrate`:

| #    | File              | Kind       | What it does                                                                                                                                                                                                                                                                                                                                                                     |
| ---- | ----------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0003 | `v2_helpers`      | custom SQL | `citext` extension; `line_item_home_id()` RLS helper (needed by the new policies).                                                                                                                                                                                                                                                                                               |
| 0004 | `v2_additive`     | generated  | New enums (`task_level`, `task_type`, `payment_status`, `attachment_kind`, `area_unit`), `task_status += 'blocked'`; new tables `floors`, `task_contacts`, `task_selections`, `payments`, `space_progress`, `line_items`, `line_item_materials`, `stages`, `app_settings` (all with RLS + FK/date indexes); new columns on `profiles`, `homes`, `rooms`, `tasks`, `attachments`. |
| 0005 | `v2_data_mapping` | custom SQL | Copies old task columns to new ones, sets `level`, flattens any 3rd-level tasks under their task, creates a "Ground" floor per home and assigns existing rooms to it, backfills `profiles.email` and a unique `username`, fills empty addresses, creates `app_settings` per home.                                                                                                |
| 0006 | `v2_finalize`     | generated  | Drops `tasks.due_date`, `cost_estimate`, `cost_actual` (now copied); makes `homes.address`, `rooms.floor_id`, `profiles.username` NOT NULL.                                                                                                                                                                                                                                      |

### Field mapping

| Old                       | New                                                                       | Notes                                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tasks.due_date`          | `tasks.planned_end`                                                       | Same date; v1 had a single due date.                                                                                                                      |
| `tasks.cost_estimate`     | `tasks.expected_cost`                                                     |                                                                                                                                                           |
| `tasks.cost_actual`       | `tasks.actual_cost`                                                       |                                                                                                                                                           |
| `tasks.parent_task_id`    | `tasks.level`                                                             | `task` when no parent, else `subtask`. v1 allowed a 3rd level; such rows move up to sit directly under their task.                                        |
| `task_status 'pending'`   | displayed as "Not started"                                                | The stored value stays `pending` (renaming a Postgres enum value inside the migration transaction is unsafe); only the label changes. `blocked` is added. |
| `rooms` (no floor)        | `rooms.floor_id` -> new "Ground" floor of the same home                   |                                                                                                                                                           |
| `homes.address` NULL      | `''`                                                                      | Address becomes required for new homes (Zod); existing homes show a "Add address" prompt in Settings > Home (Phase 3).                                    |
| `profiles` (no user name) | `username` from the email's local part, made unique with a numeric suffix | Users can change it in Phase 2 (profile).                                                                                                                 |
| —                         | `app_settings` row per home                                               | Defaults: cost tolerance 10 %, at-risk 3 days, sq ft, home currency.                                                                                      |

Kept from v1 even though v2 doesn't list them, because they hold data or are used: `tasks.priority`, `tasks.vendor_id`, `vendors`, `quotes`, `task_rooms`, `templates`, `modules.budget`, `attachments.type`.

## 4. Phase plan (v2 section 12)

1. **This phase**: review, plan, migrations 0003-0006, code updated to new column names, RLS tests extended to new tables.
2. Register / login / OTP / reset. Needs a real Supabase project for phone OTP and password reset emails; locally the dev mode will simulate OTP with a fixed code shown on screen.
3. Home details, floors, rooms with sizes, onboarding wizard v2.
4. Module > Task > Sub-task engine: CRUD, reorder (dnd-kit + keyboard), roll-ups, `computeProgress` and the other pure rules with tests.
5. Type-specific editors.
6. v2 seed (5 structured modules + 4 starters).
7. Dashboard (progress, cost, blockers, thresholds).
8. Polish, accessibility, Playwright, deployment notes.

## 5. Risks and decisions for review

- **Phone OTP and password reset need Supabase.** They can't be verified end-to-end locally without a Supabase project and an SMS provider; Phase 2 will mock them in dev and in Playwright.
- **Placeholder addresses**: existing homes get `''` until edited.
- **Cross-home references** (e.g. a line item pointing at a room from another home) are not blocked by the DB yet; server actions will validate this in Phases 4-5.
- **Chart library**: the brief allows Recharts or SVG; the plan is hand-built SVG to avoid a new dependency.
