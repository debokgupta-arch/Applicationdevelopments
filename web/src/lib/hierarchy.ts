/**
 * Business rules for the Module > Task > Sub-task hierarchy (v2 sections 5, 7, 10).
 * Pure functions: no I/O, fully unit-tested, shared by UI and server.
 */
import { differenceInCalendarDays, parseISO } from "date-fns";

export type Status = "pending" | "in_progress" | "blocked" | "done" | "skipped";
export type TaskType =
  | "plain"
  | "selection"
  | "contact"
  | "cost_monitor"
  | "schedule"
  | "space_progress"
  | "line_items"
  | "stages";

export type StageLike = { status: Status };
export type SpaceLike = { percent: number; areaSqft?: number | null };
export type LineItemLike = { status?: Status; stages?: readonly StageLike[] };

export type DatedNode = {
  plannedStart?: string | null;
  plannedEnd?: string | null;
  actualStart?: string | null;
  actualEnd?: string | null;
};

export type ProgressNode = DatedNode & {
  status: Status;
  taskType?: TaskType;
  /** 0-100; overrides everything else when set. */
  manualProgress?: number | null;
  children?: readonly ProgressNode[];
  stages?: readonly StageLike[];
  spaces?: readonly SpaceLike[];
  lineItems?: readonly LineItemLike[];
  expectedCost?: number | null;
  actualCost?: number | null;
};

const clamp = (n: number) => Math.min(100, Math.max(0, n));
const live = <T extends { status?: Status }>(xs: readonly T[] | undefined) =>
  (xs ?? []).filter((x) => x.status !== "skipped");

/** Share of non-skipped stages that are done. */
export function stageProgress(stages: readonly StageLike[]): number | null {
  const counted = live(stages);
  if (counted.length === 0) return null;
  return (counted.filter((s) => s.status === "done").length / counted.length) * 100;
}

/** Area-weighted average of per-space percentages (equal weights if no areas). */
export function spaceProgress(spaces: readonly SpaceLike[]): number | null {
  if (spaces.length === 0) return null;
  const weights = spaces.map((s) => (s.areaSqft && s.areaSqft > 0 ? s.areaSqft : 0));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total === 0) return spaces.reduce((a, s) => a + clamp(s.percent), 0) / spaces.length;
  return spaces.reduce((a, s, i) => a + clamp(s.percent) * weights[i], 0) / total;
}

/**
 * Progress of any node, 0-100 (v2 section 5):
 * manual override > done (100) > stages > space progress > line items >
 * sub-tasks done/total > 0. Skipped children are ignored.
 */
export function computeProgress(node: ProgressNode): number {
  if (node.manualProgress != null) return clamp(node.manualProgress);
  if (node.status === "done") return 100;

  if (node.stages && node.stages.length > 0) {
    const p = stageProgress(node.stages);
    if (p != null) return p;
  }
  if (node.spaces && node.spaces.length > 0) {
    const p = spaceProgress(node.spaces);
    if (p != null) return p;
  }
  const items = live(node.lineItems);
  if (items.length > 0) {
    const each = items.map((item) =>
      item.status === "done" ? 100 : (stageProgress(item.stages ?? []) ?? 0),
    );
    return each.reduce((a, b) => a + b, 0) / each.length;
  }
  const children = live(node.children);
  if (children.length > 0) {
    return (children.filter((c) => c.status === "done").length / children.length) * 100;
  }
  return 0;
}

/** Module progress: average of its non-skipped tasks' progress. */
export function averageProgress(nodes: readonly ProgressNode[]): number {
  const counted = live(nodes);
  if (counted.length === 0) return 0;
  return counted.reduce((a, n) => a + computeProgress(n), 0) / counted.length;
}

/** Sums expected and actual cost of a node's non-skipped children (and line items). */
export function rollupCost(
  nodes: readonly Pick<ProgressNode, "status" | "expectedCost" | "actualCost">[],
) {
  return live(nodes).reduce(
    (acc, n) => ({
      expected: acc.expected + (n.expectedCost ?? 0),
      actual: acc.actual + (n.actualCost ?? 0),
    }),
    { expected: 0, actual: 0 },
  );
}

const minDate = (xs: (string | null | undefined)[]) =>
  xs.filter((x): x is string => Boolean(x)).sort()[0] ?? null;
const maxDate = (xs: (string | null | undefined)[]) =>
  xs
    .filter((x): x is string => Boolean(x))
    .sort()
    .at(-1) ?? null;

/** Earliest starts and latest ends across non-skipped children. */
export function rollupDates(
  nodes: readonly (DatedNode & { status?: Status })[],
): Required<DatedNode> {
  const counted = live(nodes);
  return {
    plannedStart: minDate(counted.map((n) => n.plannedStart)),
    plannedEnd: maxDate(counted.map((n) => n.plannedEnd)),
    actualStart: minDate(counted.map((n) => n.actualStart)),
    actualEnd: maxDate(counted.map((n) => n.actualEnd)),
  };
}

/** Elapsed share of the planned window on `today` (ISO dates), 0-100. */
export function plannedProgress(
  plannedStart: string | null | undefined,
  plannedEnd: string | null | undefined,
  today: string,
): number | null {
  if (!plannedStart || !plannedEnd) return null;
  const span = differenceInCalendarDays(parseISO(plannedEnd), parseISO(plannedStart));
  const elapsed = differenceInCalendarDays(parseISO(today), parseISO(plannedStart));
  if (span <= 0) return elapsed >= 0 ? 100 : 0;
  return clamp((elapsed / span) * 100);
}

/** Days late, or 0: not done after the planned end, or finished after it. */
export function daysLate(node: DatedNode & { status: Status }, today: string): number {
  if (!node.plannedEnd || node.status === "skipped") return 0;
  const end = parseISO(node.plannedEnd);
  if (node.status === "done") {
    return node.actualEnd
      ? Math.max(0, differenceInCalendarDays(parseISO(node.actualEnd), end))
      : 0;
  }
  return Math.max(0, differenceInCalendarDays(parseISO(today), end));
}

export const isLate = (node: DatedNode & { status: Status }, today: string) =>
  daysLate(node, today) > 0;

/** Overrun beyond the tolerance (e.g. 10 = allow 10% over), or null if within budget. */
export function overBudget(
  node: Pick<ProgressNode, "expectedCost" | "actualCost">,
  tolerancePct = 0,
): { amount: number; pct: number } | null {
  const expected = node.expectedCost ?? 0;
  const actual = node.actualCost ?? 0;
  if (expected <= 0 || actual <= expected * (1 + tolerancePct / 100)) return null;
  return { amount: actual - expected, pct: ((actual - expected) / expected) * 100 };
}

export const isOverBudget = (
  node: Pick<ProgressNode, "expectedCost" | "actualCost">,
  tolerancePct = 0,
) => overBudget(node, tolerancePct) !== null;

/** Paint quantity helper: wall area x coats / coverage per litre per coat. */
export function paintLitres(wallAreaSqft: number, coats = 2, coverageSqftPerLitre = 100): number {
  if (wallAreaSqft <= 0 || coverageSqftPerLitre <= 0) return 0;
  return Math.ceil(((wallAreaSqft * coats) / coverageSqftPerLitre) * 10) / 10;
}

/** Rough wall area from floor dimensions: perimeter x height, minus 15% for doors/windows. */
export function wallAreaFromFloor(lengthFt: number, widthFt: number, heightFt = 10): number {
  return Math.round(2 * (lengthFt + widthFt) * heightFt * 0.85);
}
