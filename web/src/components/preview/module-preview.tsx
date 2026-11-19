"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Copy,
  EyeOff,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Eye,
} from "lucide-react";
import { averageProgress, type TaskType } from "@/lib/hierarchy";
import { node, type PNode, type PRoom } from "@/lib/preview/data";
import { setPreviewModules, usePreview } from "@/lib/preview/store";
import {
  cloneNode,
  costOf,
  findNode,
  flagsOf,
  insertNode,
  locate,
  moveNode,
  progressOf,
  removeNode,
  toProgressNode,
  updateNode,
} from "@/lib/preview/tree";
import { cn } from "@/lib/utils";
import { Chip } from "@/components/kit/chip";
import { ProgressBar } from "@/components/kit/progress-bar";
import { ResponsiveDialog } from "@/components/kit/responsive-dialog";
import { SegmentedControl } from "@/components/kit/segmented-control";
import { StatCard } from "@/components/kit/stat-card";
import { StatusDot } from "@/components/kit/status-dot";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STATUS_OPTIONS, TaskTypeEditor } from "./task-editors";
import { DateInput, IconBtn, Input, L, NumberInput, Select, day, money } from "./ui";

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  plain: "Plain",
  selection: "Selection (colour & quantity)",
  contact: "Contact / appointment",
  cost_monitor: "Cost monitor (payments)",
  schedule: "Schedule",
  space_progress: "Space progress",
  line_items: "Line items (room-wise)",
  stages: "Stages (pipeline)",
};

const SHORT_TYPE: Record<TaskType, string> = {
  plain: "Plain",
  selection: "Selection",
  contact: "Contact",
  cost_monitor: "Cost monitor",
  schedule: "Schedule",
  space_progress: "Space progress",
  line_items: "Line items",
  stages: "Stages",
};

/** Desktop shows a side panel; below 1024px the details open as a sheet. */
function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(min-width: 1024px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => true,
  );
}

type Removed = { node: PNode; parentId: string | null; index: number };

export function ModulePreview({ moduleId }: { moduleId: string }) {
  const { rooms, modules } = usePreview();
  const mod = modules.find((m) => m.id === moduleId) ?? modules[0];
  const [selectedId, setSelectedId] = useState<string | null>(mod.tasks[0]?.id ?? null);
  // Tasks are expanded unless collapsed, so sub-tasks added anywhere show up.
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [renaming, setRenaming] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PNode | null>(null);
  const [removed, setRemoved] = useState<Removed | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const isDesktop = useIsDesktop();
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setTasks = (fn: (tasks: PNode[]) => PNode[]) =>
    setPreviewModules((ms) => ms.map((m) => (m.id === mod.id ? { ...m, tasks: fn(m.tasks) } : m)));
  const patch = (id: string, p: Partial<PNode>) =>
    setTasks((ts) => updateNode(ts, id, (n) => ({ ...n, ...p })));
  const selected = findNode(mod.tasks, selectedId);
  const isSubtask = (id: string) => locate(mod.tasks, id)?.parentId != null;

  const select = (id: string) => {
    setSelectedId(id);
    if (!isDesktop) setSheetOpen(true);
  };

  const addTask = () => {
    const n = node("New task", "plain", { isCustom: true });
    setTasks((ts) => [...ts, n]);
    setSelectedId(n.id);
    setRenaming(n.id);
  };
  const addSubtask = (parentId: string) => {
    const n = node("New sub-task", "plain", { isCustom: true });
    setTasks((ts) => updateNode(ts, parentId, (p) => ({ ...p, children: [...p.children, n] })));
    setCollapsed((s) => {
      const n = new Set(s);
      n.delete(parentId);
      return n;
    });
    setRenaming(n.id);
  };
  const duplicate = (id: string) => {
    const where = locate(mod.tasks, id);
    const original = findNode(mod.tasks, id);
    if (!where || !original) return;
    setTasks((ts) => insertNode(ts, where.parentId, where.index + 1, cloneNode(original)));
  };
  const doDelete = (n: PNode) => {
    const where = locate(mod.tasks, n.id);
    if (!where) return;
    setTasks((ts) => removeNode(ts, n.id));
    if (selectedId === n.id) setSelectedId(null);
    setRemoved({ node: n, ...where });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setRemoved(null), 8000);
  };
  const undo = () => {
    if (!removed) return;
    setTasks((ts) => insertNode(ts, removed.parentId, removed.index, removed.node));
    setRemoved(null);
  };
  useEffect(
    () => () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    },
    [],
  );

  // Module header numbers (roll-ups across tasks).
  const progress = averageProgress(mod.tasks.map((t) => toProgressNode(t, rooms)));
  const costs = mod.tasks
    .filter((t) => t.status !== "skipped")
    .map(costOf)
    .reduce(
      (a, c) => ({ expected: a.expected + (c.expected ?? 0), actual: a.actual + (c.actual ?? 0) }),
      { expected: 0, actual: 0 },
    );
  const live = mod.tasks.filter((t) => t.status !== "skipped");
  const done = live.filter((t) => progressOf(t, rooms) >= 100).length;
  const nextDue = live
    .map((t) => t.plannedEnd)
    .filter((d): d is string => !!d && d >= today)
    .sort()[0];
  const flagged = mod.tasks.map((t) => flagsOf(t, today));
  const lateCount = flagged.filter((f) => f.daysLate > 0).length;
  const overCount = flagged.filter((f) => f.over).length;

  const details = selected && (
    <TaskDetails
      key={selected.id}
      node={selected}
      isSubtask={isSubtask(selected.id)}
      rooms={rooms}
      today={today}
      onChange={(p) => patch(selected.id, p)}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <div
        className="flex flex-wrap items-center gap-2 rounded-card bg-due-soon px-4 py-3 text-label font-semibold text-due-soon-foreground"
        role="note"
      >
        Preview: everything here works, but changes aren&apos;t saved yet (they reset on reload).
      </div>

      <header className="flex flex-col gap-3">
        <nav aria-label="Breadcrumb" className="text-body text-muted-foreground">
          <Link href="/" className="font-semibold text-primary hover:underline">
            Dashboard
          </Link>{" "}
          / {mod.name}
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-page-title font-extrabold tracking-tight">{mod.name}</h1>
          <Button variant="secondary" onClick={addTask}>
            <Plus className="size-4" aria-hidden="true" /> Add task
          </Button>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Modules">
          {modules.map((m) => (
            <Link
              key={m.id}
              href={`/modules/${m.id}`}
              aria-current={m.id === mod.id ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full border px-4 text-body font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                m.id === mod.id
                  ? "border-primary bg-primary-tint text-primary-dark"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {m.name}
            </Link>
          ))}
        </div>
        <ProgressBar value={progress} label={`${mod.name} progress`} />
        {(lateCount > 0 || overCount > 0) && (
          <p className="flex flex-wrap gap-2" role="status">
            {lateCount > 0 && <Chip className="bg-danger/10 text-danger">{lateCount} late</Chip>}
            {overCount > 0 && (
              <Chip className="bg-danger/10 text-danger">{overCount} over budget</Chip>
            )}
          </p>
        )}
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Done"
          value={`${done} of ${live.length}`}
          hint={`${Math.round(progress)}% overall`}
        />
        <StatCard label="Expected" value={money(costs.expected)} hint="rolled up" />
        <StatCard
          label="Actual"
          value={money(costs.actual)}
          hint={costs.actual > costs.expected && costs.expected > 0 ? "over expected" : "rolled up"}
        />
        <StatCard label="Next due" value={day(nextDue)} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        <ol className="flex flex-col gap-2" aria-label="Tasks">
          {mod.tasks.map((t, i) => (
            <li key={t.id}>
              <TaskRow
                node={t}
                index={i}
                count={mod.tasks.length}
                rooms={rooms}
                today={today}
                selected={selectedId === t.id}
                expanded={t.children.length > 0 && !collapsed.has(t.id)}
                renaming={renaming === t.id}
                onToggle={() =>
                  setCollapsed((s) => {
                    const n = new Set(s);
                    if (n.has(t.id)) n.delete(t.id);
                    else n.add(t.id);
                    return n;
                  })
                }
                onSelect={() => select(t.id)}
                onRename={(title) => {
                  patch(t.id, { title });
                  setRenaming(null);
                }}
                onStartRename={() => setRenaming(t.id)}
                onAddSubtask={() => addSubtask(t.id)}
                onDuplicate={() => duplicate(t.id)}
                onMove={(d) => setTasks((ts) => moveNode(ts, t.id, d))}
                onToggleNA={() =>
                  patch(t.id, { status: t.status === "skipped" ? "pending" : "skipped" })
                }
                onDelete={() => setConfirmDelete(t)}
              />
              {t.children.length > 0 && !collapsed.has(t.id) && (
                <ol
                  className="mt-2 ml-6 flex flex-col gap-2 border-l-2 border-primary-tint pl-3"
                  aria-label={`Sub-tasks of ${t.title}`}
                >
                  {t.children.map((c, j) => (
                    <li key={c.id}>
                      <TaskRow
                        node={c}
                        index={j}
                        count={t.children.length}
                        rooms={rooms}
                        today={today}
                        selected={selectedId === c.id}
                        renaming={renaming === c.id}
                        onSelect={() => select(c.id)}
                        onRename={(title) => {
                          patch(c.id, { title });
                          setRenaming(null);
                        }}
                        onStartRename={() => setRenaming(c.id)}
                        onDuplicate={() => duplicate(c.id)}
                        onMove={(d) => setTasks((ts) => moveNode(ts, c.id, d))}
                        onToggleNA={() =>
                          patch(c.id, { status: c.status === "skipped" ? "pending" : "skipped" })
                        }
                        onDelete={() => setConfirmDelete(c)}
                        onCheck={() =>
                          patch(c.id, { status: c.status === "done" ? "pending" : "done" })
                        }
                      />
                    </li>
                  ))}
                  <li>
                    <button
                      type="button"
                      onClick={() => addSubtask(t.id)}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-dashed border-input px-4 text-body font-semibold text-primary outline-none hover:bg-primary-tint focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <Plus className="size-4" aria-hidden="true" /> Add sub-task
                    </button>
                  </li>
                </ol>
              )}
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={addTask}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-card border-2 border-dashed border-input font-semibold text-primary outline-none hover:bg-primary-tint focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Plus className="size-4" aria-hidden="true" /> Add task
            </button>
          </li>
        </ol>

        {isDesktop && (
          <aside
            className="sticky top-6 rounded-card border-[1.5px] border-primary bg-card p-5"
            aria-label="Task details"
          >
            {details ?? (
              <p className="text-body text-muted-foreground">Select a task to see its details.</p>
            )}
          </aside>
        )}
      </div>

      {!isDesktop && selected && (
        <ResponsiveDialog open={sheetOpen} onOpenChange={setSheetOpen} title={selected.title}>
          {details}
        </ResponsiveDialog>
      )}

      <ResponsiveDialog
        open={confirmDelete !== null}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete this item?"
        description={
          confirmDelete
            ? `"${confirmDelete.title}"${confirmDelete.children.length ? ` and its ${confirmDelete.children.length} sub-tasks` : ""} will be removed. You can undo right after.`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmDelete) doDelete(confirmDelete);
                setConfirmDelete(null);
              }}
            >
              <Trash2 className="size-4" aria-hidden="true" /> Delete
            </Button>
          </>
        }
      >
        <p className="text-body text-muted-foreground">
          Prefer &quot;Not applicable&quot; if you might need it later; it keeps the item but hides
          it from progress.
        </p>
      </ResponsiveDialog>

      {removed && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center gap-3 rounded-card bg-foreground px-4 py-2 text-background shadow-xl lg:bottom-6"
        >
          <span className="flex-1 truncate text-body">
            Deleted &quot;{removed.node.title}&quot;
          </span>
          <Button size="sm" variant="secondary" onClick={undo}>
            <RotateCcw className="size-4" aria-hidden="true" /> Undo
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- tree row

type RowProps = {
  node: PNode;
  index: number;
  count: number;
  rooms: readonly PRoom[];
  today: string;
  selected: boolean;
  expanded?: boolean;
  renaming: boolean;
  onToggle?: () => void;
  onSelect: () => void;
  onRename: (title: string) => void;
  onStartRename: () => void;
  onAddSubtask?: () => void;
  onDuplicate: () => void;
  onMove: (delta: -1 | 1) => void;
  onToggleNA: () => void;
  onDelete: () => void;
  onCheck?: () => void;
};

function TaskRow(p: RowProps) {
  const { node: n } = p;
  const skipped = n.status === "skipped";
  const pct = Math.round(progressOf(n, p.rooms));
  const flags = flagsOf(n, p.today);
  const cost = costOf(n);
  const sub = p.onCheck !== undefined;

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-card border bg-card py-1 pr-1 pl-2",
        p.selected && "border-[1.5px] border-primary",
        (flags.daysLate > 0 || flags.over) && !p.selected && "border-danger/60",
        skipped && "opacity-60",
      )}
    >
      {p.onToggle && n.children.length > 0 ? (
        <IconBtn
          label={p.expanded ? `Collapse ${n.title}` : `Expand ${n.title}`}
          aria-expanded={p.expanded}
          onClick={p.onToggle}
        >
          <ChevronRight
            className={cn("size-4 transition-transform", p.expanded && "rotate-90")}
            aria-hidden="true"
          />
        </IconBtn>
      ) : sub ? (
        <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center">
          <input
            type="checkbox"
            checked={n.status === "done"}
            onChange={p.onCheck}
            className="size-5 accent-primary"
            aria-label={`Mark ${n.title} done`}
          />
        </label>
      ) : (
        <span className="w-11 shrink-0" />
      )}

      {p.renaming ? (
        <form
          className="flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            const v = new FormData(e.currentTarget).get("title");
            p.onRename(String(v ?? "").trim() || n.title);
          }}
        >
          <Input
            name="title"
            defaultValue={n.title}
            autoFocus
            aria-label="Title"
            onBlur={(e) => p.onRename(e.currentTarget.value.trim() || n.title)}
            onFocus={(e) => e.currentTarget.select()}
          />
        </form>
      ) : (
        <button
          type="button"
          onClick={p.onSelect}
          aria-current={p.selected ? "true" : undefined}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-input py-1 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {!sub && <StatusDot status={n.status} />}
          <span className="flex min-w-0 flex-1 flex-col">
            <span
              className={cn(
                "truncate font-semibold",
                (skipped || (sub && n.status === "done")) && "line-through",
              )}
            >
              {n.title}
            </span>
            <span className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {!sub && (
                <span className="text-label text-muted-foreground">{SHORT_TYPE[n.taskType]}</span>
              )}
              {n.children.length > 0 && (
                <span className="text-label text-muted-foreground">
                  · {n.children.filter((c) => c.status === "done").length} of {n.children.length}
                </span>
              )}
              {cost.expected != null && (
                <span className="text-label text-muted-foreground">· {money(cost.expected)}</span>
              )}
              {n.isCustom && <Chip tone="custom">Custom</Chip>}
              {skipped && <Chip>Not applicable</Chip>}
              {flags.daysLate > 0 && (
                <Chip className="bg-danger/10 text-danger">{flags.daysLate}d late</Chip>
              )}
              {flags.over && <Chip className="bg-danger/10 text-danger">Over budget</Chip>}
            </span>
          </span>
          {!sub && (
            <span className="shrink-0 text-label font-extrabold text-muted-foreground">{pct}%</span>
          )}
        </button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconBtn label={`Actions for ${n.title}`}>
            <MoreVertical className="size-4" aria-hidden="true" />
          </IconBtn>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem className="min-h-11" onSelect={p.onStartRename}>
            <Pencil className="size-4" aria-hidden="true" />
            Rename
          </DropdownMenuItem>
          {p.onAddSubtask && (
            <DropdownMenuItem className="min-h-11" onSelect={p.onAddSubtask}>
              <Plus className="size-4" aria-hidden="true" />
              Add sub-task
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className="min-h-11" onSelect={p.onDuplicate}>
            <Copy className="size-4" aria-hidden="true" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            className="min-h-11"
            disabled={p.index === 0}
            onSelect={() => p.onMove(-1)}
          >
            <ArrowUp className="size-4" aria-hidden="true" />
            Move up
          </DropdownMenuItem>
          <DropdownMenuItem
            className="min-h-11"
            disabled={p.index === p.count - 1}
            onSelect={() => p.onMove(1)}
          >
            <ArrowDown className="size-4" aria-hidden="true" />
            Move down
          </DropdownMenuItem>
          <DropdownMenuItem className="min-h-11" onSelect={p.onToggleNA}>
            {skipped ? (
              <Eye className="size-4" aria-hidden="true" />
            ) : (
              <EyeOff className="size-4" aria-hidden="true" />
            )}
            {skipped ? "Mark applicable" : "Not applicable"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="min-h-11 text-danger" onSelect={p.onDelete}>
            <Trash2 className="size-4" aria-hidden="true" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ---------------------------------------------------------------- details panel

function TaskDetails({
  node: n,
  isSubtask,
  rooms,
  today,
  onChange,
}: {
  node: PNode;
  isSubtask: boolean;
  rooms: readonly PRoom[];
  today: string;
  onChange: (p: Partial<PNode>) => void;
}) {
  const cost = costOf(n);
  const pct = Math.round(progressOf(n, rooms));
  const flags = flagsOf(n, today);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <L label={isSubtask ? "Sub-task" : "Task"}>
          <Input value={n.title} onChange={(e) => onChange({ title: e.target.value })} />
        </L>
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="selected">{pct}% complete</Chip>
          {flags.daysLate > 0 && (
            <Chip className="bg-danger/10 text-danger">{flags.daysLate} days late</Chip>
          )}
          {flags.over && flags.over.amount > 0 && (
            <Chip className="bg-danger/10 text-danger">
              Over by {money(flags.over.amount)} ({Math.round(flags.over.pct)}%)
            </Chip>
          )}
        </div>
      </div>

      {!isSubtask && (
        <L label="Task type">
          <Select
            value={n.taskType}
            onChange={(e) => onChange({ taskType: e.target.value as TaskType })}
          >
            {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </L>
      )}

      <SegmentedControl
        label="Status"
        options={STATUS_OPTIONS}
        value={n.status === "skipped" ? "pending" : n.status}
        onValueChange={(status) => onChange({ status })}
      />

      <div className="grid grid-cols-2 gap-2">
        <L label="Planned start">
          <DateInput
            value={n.plannedStart}
            onValue={(plannedStart) => onChange({ plannedStart })}
          />
        </L>
        <L label="Planned end">
          <DateInput value={n.plannedEnd} onValue={(plannedEnd) => onChange({ plannedEnd })} />
        </L>
        <L label="Actual start">
          <DateInput value={n.actualStart} onValue={(actualStart) => onChange({ actualStart })} />
        </L>
        <L label="Actual end">
          <DateInput value={n.actualEnd} onValue={(actualEnd) => onChange({ actualEnd })} />
        </L>
        <L label={`Expected cost (₹)${cost.expectedRolled ? " · rolled up" : ""}`}>
          <NumberInput
            value={n.expectedCost}
            placeholder={cost.expectedRolled ? String(cost.expected) : ""}
            onValue={(expectedCost) => onChange({ expectedCost })}
          />
        </L>
        <L label={`Actual cost (₹)${cost.actualRolled ? " · rolled up" : ""}`}>
          <NumberInput
            value={n.actualCost}
            placeholder={cost.actualRolled ? String(cost.actual) : ""}
            onValue={(actualCost) => onChange({ actualCost })}
          />
        </L>
        <L label="Manual progress % (optional override)" className="col-span-2">
          <NumberInput
            value={n.manualProgress}
            min={0}
            max={100}
            placeholder={`Computed: ${pct}%`}
            onValue={(v) =>
              onChange({ manualProgress: v == null ? null : Math.min(100, Math.max(0, v)) })
            }
          />
        </L>
      </div>

      <L label="Notes">
        <textarea
          value={n.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={3}
          className="min-h-20 w-full rounded-input border border-input bg-card px-3 py-2 text-body outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/30"
        />
      </L>

      {!isSubtask && <TaskTypeEditor node={n} rooms={rooms} today={today} onChange={onChange} />}
    </div>
  );
}
