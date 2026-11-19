import { addDays, format, parseISO } from "date-fns";
import type { Database, Transaction } from "./client";
import { DEFAULT_CHECKLIST, type ChecklistModule } from "./default-checklist";
import { appSettings, floors, modules, tasks } from "./schema";

type NewModule = typeof modules.$inferInsert;
type NewTask = typeof tasks.$inferInsert;

/** Days between consecutive top-level task due dates inside one module. */
const DUE_STEP_DAYS = 2;

/**
 * Due date for the n-th top-level task of a module: tasks start
 * `startDaysBeforeMoveIn` days out and step forward, never past move-in.
 */
export function seededDueDate(
  moveInDate: string | null | undefined,
  module: Pick<ChecklistModule, "startDaysBeforeMoveIn">,
  index: number,
): string | null {
  if (!moveInDate) return null;
  const offset = Math.max(0, module.startDaysBeforeMoveIn - index * DUE_STEP_DAYS);
  return format(addDays(parseISO(moveInDate), -offset), "yyyy-MM-dd");
}

/** Builds every module and task row (with ids) for a home, without touching the database. */
export function buildChecklistRows(
  homeId: string,
  moveInDate: string | null | undefined,
  checklist: readonly ChecklistModule[] = DEFAULT_CHECKLIST,
  newId: () => string = () => crypto.randomUUID(),
): { moduleRows: NewModule[]; parentRows: NewTask[]; childRows: NewTask[] } {
  const moduleRows: NewModule[] = [];
  const parentRows: NewTask[] = [];
  const childRows: NewTask[] = [];

  checklist.forEach((mod, moduleIndex) => {
    const moduleId = newId();
    moduleRows.push({
      id: moduleId,
      homeId,
      name: mod.name,
      icon: mod.icon,
      sortOrder: moduleIndex,
    });

    mod.tasks.forEach((task, taskIndex) => {
      const taskId = newId();
      parentRows.push({
        id: taskId,
        moduleId,
        title: task.title,
        level: "task",
        sortOrder: taskIndex,
        plannedEnd: seededDueDate(moveInDate, mod, taskIndex),
      });
      task.subtasks?.forEach((title, subIndex) => {
        childRows.push({
          id: newId(),
          moduleId,
          parentTaskId: taskId,
          level: "subtask",
          title,
          sortOrder: subIndex,
        });
      });
    });
  });

  return { moduleRows, parentRows, childRows };
}

/** Label of the floor every new home starts with (users can rename it or add more). */
export const DEFAULT_FLOOR_LABEL = "Ground";

/**
 * Rows every home needs regardless of its checklist: a first floor (rooms
 * belong to floors) and its settings. Returns the floor id.
 */
export async function initHomeDefaults(
  tx: Transaction | Database,
  homeId: string,
  currency: string,
): Promise<string> {
  const [floor] = await tx
    .insert(floors)
    .values({ homeId, label: DEFAULT_FLOOR_LABEL, sortOrder: 0 })
    .returning({ id: floors.id });
  await tx.insert(appSettings).values({ homeId, currency });
  return floor.id;
}

/**
 * Inserts the default checklist for a home. Pass the transaction from
 * `withUser` so it runs under row-level security (the caller must be an
 * owner or editor of the home).
 */
export async function seedHome(
  tx: Transaction | Database,
  homeId: string,
  moveInDate: string | null | undefined,
): Promise<{ modules: number; tasks: number }> {
  const { moduleRows, parentRows, childRows } = buildChecklistRows(homeId, moveInDate);
  await tx.insert(modules).values(moduleRows);
  await tx.insert(tasks).values(parentRows);
  if (childRows.length > 0) await tx.insert(tasks).values(childRows);
  return { modules: moduleRows.length, tasks: parentRows.length + childRows.length };
}
