import { cache } from "react";
import { and, asc, count, eq, ne, notExists, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { cookies } from "next/headers";
import { withUser } from "@/db/client";
import { homes, modules, tasks } from "@/db/schema";
import { CURRENT_HOME_COOKIE } from "@/lib/auth/cookies";
import { requireUser } from "@/lib/auth/session";

export type HomeSummary = { id: string; name: string; moveInDate: string | null };

/** Homes the signed-in user belongs to (row-level security does the filtering). */
export const getUserHomes = cache(async (): Promise<HomeSummary[]> => {
  const user = await requireUser();
  return withUser(user.id, (tx) =>
    tx
      .select({ id: homes.id, name: homes.name, moveInDate: homes.moveInDate })
      .from(homes)
      .orderBy(asc(homes.createdAt)),
  );
});

/** The home picked in the switcher (cookie), falling back to the first one. */
export const getCurrentHome = cache(async (): Promise<HomeSummary | null> => {
  const list = await getUserHomes();
  const chosen = (await cookies()).get(CURRENT_HOME_COOKIE)?.value;
  return list.find((home) => home.id === chosen) ?? list[0] ?? null;
});

/**
 * Share of leaf tasks that are done, ignoring skipped tasks and hidden modules.
 * Counting leaves means a task with sub-tasks is weighted by its sub-tasks.
 * (Phase 3 replaces this with the full per-module roll-up.)
 */
export async function getMoveReadiness(homeId: string): Promise<number> {
  const user = await requireUser();
  const child = alias(tasks, "child");
  const [row] = await withUser(user.id, (tx) =>
    tx
      .select({
        total: count(),
        done: sql<number>`count(*) filter (where ${tasks.status} = 'done')`.mapWith(Number),
      })
      .from(tasks)
      .innerJoin(modules, eq(modules.id, tasks.moduleId))
      .where(
        and(
          eq(modules.homeId, homeId),
          eq(modules.isHidden, false),
          ne(tasks.status, "skipped"),
          notExists(
            tx
              .select({ one: sql`1` })
              .from(child)
              .where(eq(child.parentTaskId, tasks.id)),
          ),
        ),
      ),
  );
  if (!row || row.total === 0) return 0;
  return (row.done / row.total) * 100;
}
