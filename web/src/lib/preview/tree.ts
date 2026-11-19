/** Immutable helpers for the preview's task tree, plus adapters to the business rules. */
import { computeProgress, daysLate, overBudget, type ProgressNode } from "@/lib/hierarchy";
import { uid, type PLineItem, type PNode, type PRoom } from "./data";

export function updateNode(nodes: PNode[], id: string, fn: (n: PNode) => PNode): PNode[] {
  return nodes.map((n) =>
    n.id === id
      ? fn(n)
      : n.children.length
        ? { ...n, children: updateNode(n.children, id, fn) }
        : n,
  );
}

export function findNode(nodes: readonly PNode[], id: string | null): PNode | null {
  if (!id) return null;
  for (const n of nodes) {
    if (n.id === id) return n;
    const hit = findNode(n.children, id);
    if (hit) return hit;
  }
  return null;
}

/** Parent id (null for a top-level task) and index of a node. */
export function locate(
  nodes: readonly PNode[],
  id: string,
  parentId: string | null = null,
): { parentId: string | null; index: number } | null {
  for (const [index, n] of nodes.entries()) {
    if (n.id === id) return { parentId, index };
    const hit = locate(n.children, id, n.id);
    if (hit) return hit;
  }
  return null;
}

export function removeNode(nodes: PNode[], id: string): PNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => (n.children.length ? { ...n, children: removeNode(n.children, id) } : n));
}

export function insertNode(
  nodes: PNode[],
  parentId: string | null,
  index: number,
  node: PNode,
): PNode[] {
  if (parentId === null) return [...nodes.slice(0, index), node, ...nodes.slice(index)];
  return updateNode(nodes, parentId, (p) => ({
    ...p,
    children: [...p.children.slice(0, index), node, ...p.children.slice(index)],
  }));
}

export function moveNode(nodes: PNode[], id: string, delta: -1 | 1): PNode[] {
  const where = locate(nodes, id);
  if (!where) return nodes;
  const siblings = where.parentId ? (findNode(nodes, where.parentId)?.children ?? []) : nodes;
  const to = where.index + delta;
  if (to < 0 || to >= siblings.length) return nodes;
  const reordered = [...siblings];
  [reordered[where.index], reordered[to]] = [reordered[to], reordered[where.index]];
  return where.parentId
    ? updateNode(nodes, where.parentId, (p) => ({ ...p, children: reordered }))
    : reordered;
}

/** Deep copy with fresh ids (duplicate). */
export function cloneNode(n: PNode, suffix = " (copy)"): PNode {
  const fresh = <T extends { id: string }>(xs: T[]) => xs.map((x) => ({ ...x, id: uid() }));
  return {
    ...n,
    id: uid(),
    title: n.title + suffix,
    isCustom: true,
    children: n.children.map((c) => cloneNode(c, "")),
    contacts: fresh(n.contacts),
    selections: fresh(n.selections),
    payments: fresh(n.payments),
    stages: fresh(n.stages),
    lineItems: n.lineItems.map((li) => ({
      ...li,
      id: uid(),
      stages: fresh(li.stages),
      materials: fresh(li.materials),
    })),
  };
}

// ---------------------------------------------------------------- business-rule adapters

export function toProgressNode(n: PNode, rooms: readonly PRoom[]): ProgressNode {
  const area = new Map(rooms.map((r) => [r.id, r.areaSqft]));
  return {
    status: n.status,
    taskType: n.taskType,
    manualProgress: n.manualProgress,
    plannedStart: n.plannedStart,
    plannedEnd: n.plannedEnd,
    actualStart: n.actualStart,
    actualEnd: n.actualEnd,
    stages: n.taskType === "stages" ? n.stages : undefined,
    spaces:
      n.taskType === "space_progress"
        ? n.spaces.map((s) => ({ percent: s.percent, areaSqft: area.get(s.roomId) }))
        : undefined,
    lineItems: n.taskType === "line_items" ? n.lineItems : undefined,
    children: n.children.map((c) => toProgressNode(c, rooms)),
  };
}

export const progressOf = (n: PNode, rooms: readonly PRoom[]) =>
  computeProgress(toProgressNode(n, rooms));

const sum = (xs: (number | null | undefined)[]) => xs.reduce<number>((a, x) => a + (x ?? 0), 0);
const live = (xs: PNode[]) => xs.filter((x) => x.status !== "skipped");

/**
 * Expected and actual cost of a node: its own values when entered, otherwise
 * rolled up from sub-tasks, line items, selections or paid payments.
 */
export function costOf(n: PNode): {
  expected: number | null;
  actual: number | null;
  expectedRolled: boolean;
  actualRolled: boolean;
} {
  let expected: number | null = n.expectedCost;
  let actual: number | null = n.actualCost;
  let expectedRolled = false;
  let actualRolled = false;
  const kids = live(n.children);
  const items = n.lineItems.filter((li: PLineItem) => li.status !== "skipped");

  if (expected == null) {
    const parts =
      kids.length > 0
        ? kids.map((k) => costOf(k).expected)
        : items.length > 0
          ? items.map((li) => li.expectedCost)
          : n.selections.map((s) => s.expectedCost);
    if (parts.some((p) => p != null)) {
      expected = sum(parts);
      expectedRolled = true;
    }
  }
  if (actual == null) {
    const parts =
      kids.length > 0
        ? kids.map((k) => costOf(k).actual)
        : items.length > 0
          ? items.map((li) => li.actualCost)
          : n.payments.filter((p) => p.status === "paid").map((p) => p.amount);
    if (parts.some((p) => p != null)) {
      actual = sum(parts);
      actualRolled = true;
    }
  }
  return { expected, actual, expectedRolled, actualRolled };
}

/** Red flags shown wherever a node appears. */
export function flagsOf(n: PNode, today: string, tolerancePct = 10) {
  const cost = costOf(n);
  const late = Math.max(
    daysLate(n, today),
    ...n.lineItems.map((li) => daysLate(li, today)),
    ...n.stages.map((s) => daysLate(s, today)),
  );
  const over = overBudget({ expectedCost: cost.expected, actualCost: cost.actual }, tolerancePct);
  const itemsOver = n.lineItems.some((li) => overBudget(li, tolerancePct));
  return { daysLate: late, over: over ?? (itemsOver ? { amount: 0, pct: 0 } : null) };
}
