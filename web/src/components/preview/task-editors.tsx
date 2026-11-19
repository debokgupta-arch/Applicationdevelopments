"use client";

import { differenceInCalendarDays, parseISO } from "date-fns";
import { ArrowDown, ArrowUp, MessageCircle, Paperclip, Phone, Plus, Trash2 } from "lucide-react";
import {
  paintLitres,
  plannedProgress,
  spaceProgress,
  stageProgress,
  wallAreaFromFloor,
} from "@/lib/hierarchy";
import type { Status } from "@/lib/hierarchy";
import { PAINT_PALETTE } from "@/lib/paint-palette";
import {
  lineItem,
  stage,
  uid,
  type PLineItem,
  type PNode,
  type PRoom,
  type PStage,
} from "@/lib/preview/data";
import { cn } from "@/lib/utils";
import { Chip } from "@/components/kit/chip";
import { ProgressBar } from "@/components/kit/progress-bar";
import { SegmentedControl } from "@/components/kit/segmented-control";
import { StatusDot } from "@/components/kit/status-dot";
import { SwatchPicker } from "@/components/kit/swatch-picker";
import { Button } from "@/components/ui/button";
import { Card, DateInput, IconBtn, Input, L, NumberInput, Select, day, money } from "./ui";

type EditorProps = {
  node: PNode;
  rooms: readonly PRoom[];
  today: string;
  onChange: (patch: Partial<PNode>) => void;
};

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "pending", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];
const NEXT_STATUS: Record<Status, Status> = {
  pending: "in_progress",
  in_progress: "done",
  done: "pending",
  blocked: "in_progress",
  skipped: "pending",
};

const roomName = (rooms: readonly PRoom[], id: string) =>
  rooms.find((r) => r.id === id)?.name ?? "—";
const replace = <T extends { id: string }>(xs: T[], id: string, patch: Partial<T>) =>
  xs.map((x) => (x.id === id ? { ...x, ...patch } : x));
const without = <T extends { id: string }>(xs: T[], id: string) => xs.filter((x) => x.id !== id);
const swap = <T,>(xs: T[], i: number, j: number) => {
  if (j < 0 || j >= xs.length) return xs;
  const out = [...xs];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
};

export function TaskTypeEditor(props: EditorProps) {
  switch (props.node.taskType) {
    case "selection":
      return <SelectionEditor {...props} />;
    case "contact":
      return <ContactEditor {...props} />;
    case "cost_monitor":
      return <CostMonitorEditor {...props} />;
    case "schedule":
      return <ScheduleEditor {...props} />;
    case "space_progress":
      return <SpaceProgressEditor {...props} />;
    case "line_items":
      return <LineItemsEditor {...props} />;
    case "stages":
      return <StagesEditor {...props} />;
    case "plain":
      return null;
  }
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-body font-extrabold">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------- 2. Selection

function SelectionEditor({ node, rooms, onChange }: EditorProps) {
  const set = (id: string, patch: Partial<PNode["selections"][number]>) =>
    onChange({ selections: replace(node.selections, id, patch) });
  return (
    <Section
      title="Colour and quantity per space"
      action={
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            onChange({
              selections: [
                ...node.selections,
                {
                  id: uid(),
                  roomId: rooms[0]?.id ?? "",
                  colorHex: PAINT_PALETTE[0].hex,
                  colorName: PAINT_PALETTE[0].name,
                  finish: "matte",
                  brand: "",
                  quantity: null,
                  unit: "L",
                  expectedCost: null,
                },
              ],
            })
          }
        >
          <Plus className="size-4" aria-hidden="true" /> Add space
        </Button>
      }
    >
      {node.selections.map((s) => {
        const room = rooms.find((r) => r.id === s.roomId);
        const wall =
          room?.lengthFt && room.widthFt ? wallAreaFromFloor(room.lengthFt, room.widthFt) : 0;
        const suggested = paintLitres(wall);
        return (
          <Card key={s.id} className="flex flex-col gap-3">
            <div className="flex items-end gap-2">
              <L label="Space" className="flex-1">
                <Select value={s.roomId} onChange={(e) => set(s.id, { roomId: e.target.value })}>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </Select>
              </L>
              <IconBtn
                label="Remove space"
                onClick={() => onChange({ selections: without(node.selections, s.id) })}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </IconBtn>
            </div>
            <SwatchPicker
              id={`sw-${s.id}`}
              label="Wall colour"
              swatches={PAINT_PALETTE}
              value={s.colorHex}
              onValueChange={(sw) => set(s.id, { colorHex: sw.hex, colorName: sw.name })}
            />
            <SegmentedControl
              label="Finish"
              options={[
                { value: "matte", label: "Matte" },
                { value: "satin", label: "Satin" },
                { value: "gloss", label: "Gloss" },
              ]}
              value={s.finish}
              onValueChange={(finish) => set(s.id, { finish })}
            />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <L label="Brand">
                <Input value={s.brand} onChange={(e) => set(s.id, { brand: e.target.value })} />
              </L>
              <L label="Quantity">
                <NumberInput value={s.quantity} onValue={(quantity) => set(s.id, { quantity })} />
              </L>
              <L label="Unit">
                <Input value={s.unit} onChange={(e) => set(s.id, { unit: e.target.value })} />
              </L>
              <L label="Est. cost (₹)">
                <NumberInput
                  value={s.expectedCost}
                  onValue={(expectedCost) => set(s.id, { expectedCost })}
                />
              </L>
            </div>
            {wall > 0 && (
              <p className="flex flex-wrap items-center gap-2 text-label text-muted-foreground">
                Paint helper: ~{wall} sq ft of wall × 2 coats ÷ 100 sq ft/L ≈{" "}
                <strong className="text-foreground">{suggested} L</strong>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => set(s.id, { quantity: suggested, unit: "L" })}
                >
                  Use {suggested} L
                </Button>
              </p>
            )}
          </Card>
        );
      })}
    </Section>
  );
}

// ---------------------------------------------------------------- 3. Contact

function ContactEditor({ node, onChange }: EditorProps) {
  const set = (id: string, patch: Partial<PNode["contacts"][number]>) =>
    onChange({ contacts: replace(node.contacts, id, patch) });
  return (
    <Section
      title="Contacts"
      action={
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            onChange({
              contacts: [
                ...node.contacts,
                { id: uid(), name: "", company: "", phone: "", rate: null, isAppointed: false },
              ],
            })
          }
        >
          <Plus className="size-4" aria-hidden="true" /> Add contact
        </Button>
      }
    >
      {node.contacts.map((c) => {
        const digits = c.phone.replace(/\D/g, "");
        return (
          <Card key={c.id} className={cn("flex flex-col gap-3", c.isAppointed && "border-primary")}>
            <div className="grid grid-cols-2 gap-2">
              <L label="Name">
                <Input value={c.name} onChange={(e) => set(c.id, { name: e.target.value })} />
              </L>
              <L label="Company">
                <Input value={c.company} onChange={(e) => set(c.id, { company: e.target.value })} />
              </L>
              <L label="Phone">
                <Input
                  type="tel"
                  value={c.phone}
                  onChange={(e) => set(c.id, { phone: e.target.value })}
                />
              </L>
              <L label="Rate / quote (₹)">
                <NumberInput value={c.rate} onValue={(rate) => set(c.id, { rate })} />
              </L>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="outline" disabled={!digits}>
                <a href={`tel:${c.phone}`}>
                  <Phone className="size-4" aria-hidden="true" /> Call
                </a>
              </Button>
              <Button asChild size="sm" variant="outline" disabled={!digits}>
                <a href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4" aria-hidden="true" /> WhatsApp
                </a>
              </Button>
              <Button
                size="sm"
                variant={c.isAppointed ? "default" : "secondary"}
                aria-pressed={c.isAppointed}
                onClick={() =>
                  onChange({
                    contacts: node.contacts.map((x) => ({
                      ...x,
                      isAppointed: x.id === c.id ? !c.isAppointed : false,
                    })),
                  })
                }
              >
                {c.isAppointed ? "Appointed" : "Appoint"}
              </Button>
              <IconBtn
                label="Remove contact"
                className="ml-auto"
                onClick={() => onChange({ contacts: without(node.contacts, c.id) })}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </IconBtn>
            </div>
          </Card>
        );
      })}
    </Section>
  );
}

// ---------------------------------------------------------------- 4. Cost monitor

function CostMonitorEditor({ node, onChange }: EditorProps) {
  const set = (id: string, patch: Partial<PNode["payments"][number]>) =>
    onChange({ payments: replace(node.payments, id, patch) });
  const paid = node.payments.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const due = node.payments.filter((p) => p.status === "due").reduce((a, p) => a + p.amount, 0);
  const expected = node.expectedCost ?? 0;
  return (
    <Section
      title="Payments ledger"
      action={
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            onChange({
              payments: [
                ...node.payments,
                { id: uid(), payee: "", amount: 0, paidOn: null, mode: "UPI", status: "due" },
              ],
            })
          }
        >
          <Plus className="size-4" aria-hidden="true" /> Add payment
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Expected", money(expected)],
          ["Paid", money(paid)],
          ["Due", money(due)],
          ["Remaining", money(expected - paid)],
        ].map(([label, value]) => (
          <Card
            key={label}
            className={cn(
              "p-3",
              label === "Remaining" && expected - paid < 0 && "border-danger text-danger",
            )}
          >
            <p className="text-label font-bold text-muted-foreground">{label}</p>
            <p className="font-extrabold">{value}</p>
          </Card>
        ))}
      </div>
      {node.payments.map((p) => (
        <Card
          key={p.id}
          className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr_auto_auto]"
        >
          <L label="Payee" className="col-span-2 sm:col-span-1">
            <Input value={p.payee} onChange={(e) => set(p.id, { payee: e.target.value })} />
          </L>
          <L label="Amount (₹)">
            <NumberInput value={p.amount} onValue={(v) => set(p.id, { amount: v ?? 0 })} />
          </L>
          <L label="Date">
            <DateInput value={p.paidOn} onValue={(paidOn) => set(p.id, { paidOn })} />
          </L>
          <L label="Mode">
            <Input value={p.mode} onChange={(e) => set(p.id, { mode: e.target.value })} />
          </L>
          <Button
            size="sm"
            variant={p.status === "paid" ? "default" : "outline"}
            aria-pressed={p.status === "paid"}
            onClick={() => set(p.id, { status: p.status === "paid" ? "due" : "paid" })}
            className="h-11"
          >
            {p.status === "paid" ? "Paid" : "Due"}
          </Button>
          <IconBtn
            label="Remove payment"
            onClick={() => onChange({ payments: without(node.payments, p.id) })}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </IconBtn>
        </Card>
      ))}
      <p className="flex items-center gap-1 text-label text-muted-foreground">
        <Paperclip className="size-3.5" aria-hidden="true" /> Bill / receipt upload per payment
        arrives with file storage.
      </p>
    </Section>
  );
}

// ---------------------------------------------------------------- 5. Schedule

function variance(planned: string | null, actual: string | null) {
  if (!planned || !actual) return null;
  return differenceInCalendarDays(parseISO(actual), parseISO(planned));
}

function ScheduleEditor({ node, today }: EditorProps) {
  const start = variance(node.plannedStart, node.actualStart);
  const end = variance(node.plannedEnd, node.actualEnd);
  const planned = plannedProgress(node.plannedStart, node.plannedEnd, today);
  const chip = (v: number | null) =>
    v == null ? (
      <Chip>—</Chip>
    ) : v > 0 ? (
      <Chip tone="amber">{v} days late</Chip>
    ) : v < 0 ? (
      <Chip tone="selected">{-v} days early</Chip>
    ) : (
      <Chip tone="selected">On time</Chip>
    );
  return (
    <Section title="Schedule variance">
      <div className="grid grid-cols-2 gap-2">
        <Card className="flex flex-col gap-1 p-3">
          <span className="text-label font-bold text-muted-foreground">Start</span>
          {chip(start)}
        </Card>
        <Card className="flex flex-col gap-1 p-3">
          <span className="text-label font-bold text-muted-foreground">End</span>
          {chip(end)}
        </Card>
      </div>
      {planned != null && (
        <div className="flex flex-col gap-1">
          <p className="text-label text-muted-foreground">
            Planned progress today: {Math.round(planned)}%
          </p>
          <ProgressBar value={planned} label="Planned progress" />
        </div>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------- 6. Space progress

function SpaceProgressEditor({ node, rooms, today, onChange }: EditorProps) {
  const entries = rooms.map(
    (r) => node.spaces.find((s) => s.roomId === r.id) ?? { roomId: r.id, percent: 0 },
  );
  const setPct = (roomId: string, percent: number) =>
    onChange({ spaces: entries.map((s) => (s.roomId === roomId ? { ...s, percent } : s)) });
  const actual = spaceProgress(
    entries.map((s) => ({
      percent: s.percent,
      areaSqft: rooms.find((r) => r.id === s.roomId)?.areaSqft,
    })),
  );
  const planned = plannedProgress(node.plannedStart, node.plannedEnd, today);
  return (
    <Section title="Progress per space">
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-3">
          <p className="text-label font-bold text-muted-foreground">Actual (area-weighted)</p>
          <p className="text-section font-extrabold">{Math.round(actual ?? 0)}%</p>
        </Card>
        <Card
          className={cn("p-3", planned != null && (actual ?? 0) + 10 < planned && "border-danger")}
        >
          <p className="text-label font-bold text-muted-foreground">Planned by today</p>
          <p className="text-section font-extrabold">
            {planned == null ? "—" : `${Math.round(planned)}%`}
          </p>
        </Card>
      </div>
      {entries.map((s) => {
        const room = rooms.find((r) => r.id === s.roomId);
        return (
          <div key={s.roomId} className="grid grid-cols-[1fr_72px] items-center gap-x-3 gap-y-1">
            <label htmlFor={`sp-${s.roomId}`} className="text-body font-semibold">
              {room?.name}{" "}
              <span className="text-label font-normal text-muted-foreground">
                {room?.areaSqft ? `${room.areaSqft} sq ft` : ""}
              </span>
            </label>
            <span className="text-right text-body font-extrabold">{s.percent}%</span>
            <input
              id={`sp-${s.roomId}`}
              type="range"
              min={0}
              max={100}
              step={5}
              value={s.percent}
              onChange={(e) => setPct(s.roomId, Number(e.target.value))}
              className="col-span-2 h-11 accent-primary"
            />
          </div>
        );
      })}
    </Section>
  );
}

// ---------------------------------------------------------------- 7. Line items

function LineItemsEditor({ node, rooms, today, onChange }: EditorProps) {
  const set = (id: string, patch: Partial<PLineItem>) =>
    onChange({ lineItems: replace(node.lineItems, id, patch) });
  const byRoom = rooms
    .map((r) => ({ room: r, items: node.lineItems.filter((li) => li.roomId === r.id) }))
    .filter((g) => g.items.length > 0);
  const total = (k: "expectedCost" | "actualCost", xs: PLineItem[]) =>
    xs.reduce((a, x) => a + (x[k] ?? 0), 0);

  return (
    <Section
      title="Room-wise items"
      action={
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            onChange({ lineItems: [...node.lineItems, lineItem(rooms[0]?.id ?? "", "New item")] })
          }
        >
          <Plus className="size-4" aria-hidden="true" /> Add item
        </Button>
      }
    >
      <p className="text-label text-muted-foreground">
        Total: expected {money(total("expectedCost", node.lineItems))} · actual{" "}
        {money(total("actualCost", node.lineItems))}
      </p>
      {byRoom.map(({ room, items }) => (
        <div key={room.id} className="flex flex-col gap-2">
          <h4 className="flex items-center justify-between text-label font-bold text-muted-foreground uppercase">
            <span>{room.name}</span>
            <span className="normal-case">
              {money(total("expectedCost", items))} exp · {money(total("actualCost", items))} act
            </span>
          </h4>
          {items.map((li) => {
            const late = li.status !== "done" && li.plannedEnd != null && li.plannedEnd < today;
            const over =
              (li.expectedCost ?? 0) > 0 && (li.actualCost ?? 0) > (li.expectedCost ?? 0);
            const prog = li.status === "done" ? 100 : (stageProgress(li.stages) ?? 0);
            return (
              <Card
                key={li.id}
                className={cn("flex flex-col gap-3", (late || over) && "border-danger")}
              >
                <div className="flex items-end gap-2">
                  <L label="Item" className="flex-1">
                    <Input value={li.name} onChange={(e) => set(li.id, { name: e.target.value })} />
                  </L>
                  <L label="Space" className="w-36">
                    <Select
                      value={li.roomId}
                      onChange={(e) => set(li.id, { roomId: e.target.value })}
                    >
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </Select>
                  </L>
                  <IconBtn
                    label="Duplicate item"
                    onClick={() =>
                      onChange({
                        lineItems: [
                          ...node.lineItems,
                          {
                            ...li,
                            id: uid(),
                            name: `${li.name} (copy)`,
                            stages: li.stages.map((s) => ({ ...s, id: uid() })),
                            materials: li.materials.map((m) => ({ ...m, id: uid() })),
                          },
                        ],
                      })
                    }
                  >
                    <Plus className="size-4" aria-hidden="true" />
                  </IconBtn>
                  <IconBtn
                    label="Delete item"
                    onClick={() => onChange({ lineItems: without(node.lineItems, li.id) })}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </IconBtn>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {late && <Chip tone="amber">Late</Chip>}
                  {over && (
                    <Chip className="bg-danger/10 text-danger">
                      Over budget by {money((li.actualCost ?? 0) - (li.expectedCost ?? 0))}
                    </Chip>
                  )}
                  <Chip>{Math.round(prog)}% done</Chip>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <L label="Qty">
                    <NumberInput
                      value={li.quantity}
                      onValue={(quantity) => set(li.id, { quantity })}
                    />
                  </L>
                  <L label="Unit">
                    <Input value={li.unit} onChange={(e) => set(li.id, { unit: e.target.value })} />
                  </L>
                  <L label="Expected (₹)">
                    <NumberInput
                      value={li.expectedCost}
                      onValue={(expectedCost) => set(li.id, { expectedCost })}
                    />
                  </L>
                  <L label="Actual (₹)">
                    <NumberInput
                      value={li.actualCost}
                      onValue={(actualCost) => set(li.id, { actualCost })}
                    />
                  </L>
                  <L label="Planned start">
                    <DateInput
                      value={li.plannedStart}
                      onValue={(plannedStart) => set(li.id, { plannedStart })}
                    />
                  </L>
                  <L label="Planned end">
                    <DateInput
                      value={li.plannedEnd}
                      onValue={(plannedEnd) => set(li.id, { plannedEnd })}
                    />
                  </L>
                  <L label="Actual start">
                    <DateInput
                      value={li.actualStart}
                      onValue={(actualStart) => set(li.id, { actualStart })}
                    />
                  </L>
                  <L label="Actual end">
                    <DateInput
                      value={li.actualEnd}
                      onValue={(actualEnd) => set(li.id, { actualEnd })}
                    />
                  </L>
                </div>
                <StageChips stages={li.stages} onChange={(stages) => set(li.id, { stages })} />
                <details className="group">
                  <summary className="flex min-h-11 cursor-pointer items-center text-body font-semibold text-primary">
                    Materials ({li.materials.length}) and designs ({li.designs.length})
                  </summary>
                  <div className="flex flex-col gap-2 pt-1">
                    {li.materials.map((m) => (
                      <div key={m.id} className="grid grid-cols-[2fr_1fr_1fr_auto] items-end gap-2">
                        <Input
                          aria-label="Material"
                          value={m.material}
                          onChange={(e) =>
                            set(li.id, {
                              materials: replace(li.materials, m.id, { material: e.target.value }),
                            })
                          }
                        />
                        <NumberInput
                          aria-label="Quantity"
                          value={m.quantity}
                          onValue={(quantity) =>
                            set(li.id, { materials: replace(li.materials, m.id, { quantity }) })
                          }
                        />
                        <Input
                          aria-label="Unit"
                          value={m.unit}
                          onChange={(e) =>
                            set(li.id, {
                              materials: replace(li.materials, m.id, { unit: e.target.value }),
                            })
                          }
                        />
                        <IconBtn
                          label="Remove material"
                          onClick={() => set(li.id, { materials: without(li.materials, m.id) })}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </IconBtn>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="self-start"
                      onClick={() =>
                        set(li.id, {
                          materials: [
                            ...li.materials,
                            { id: uid(), material: "", quantity: null, unit: "pcs" },
                          ],
                        })
                      }
                    >
                      <Plus className="size-4" aria-hidden="true" /> Add material
                    </Button>
                    <div className="flex flex-wrap items-center gap-2">
                      {li.designs.map((name) => (
                        <Chip key={name} tone="custom">
                          <Paperclip className="size-3" aria-hidden="true" />
                          {name}
                        </Chip>
                      ))}
                      <label className="inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-full border border-dashed border-input px-4 text-body font-semibold text-primary focus-within:ring-3 focus-within:ring-ring/50">
                        <Plus className="size-4" aria-hidden="true" /> Upload design
                        <input
                          type="file"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) set(li.id, { designs: [...li.designs, f.name] });
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </details>
              </Card>
            );
          })}
        </div>
      ))}
    </Section>
  );
}

/** Compact stage pipeline for a line item: tap a stage to advance its status. */
function StageChips({ stages, onChange }: { stages: PStage[]; onChange: (s: PStage[]) => void }) {
  if (stages.length === 0) return null;
  return (
    <ol className="flex flex-wrap items-center gap-1.5" aria-label="Stages">
      {stages.map((s, i) => (
        <li key={s.id} className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange(replace(stages, s.id, { status: NEXT_STATUS[s.status] }))}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border px-3 text-label font-bold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label={`${s.name}: ${STATUS_OPTIONS.find((o) => o.value === s.status)?.label ?? s.status}. Tap to change.`}
          >
            <StatusDot status={s.status} className="size-4" />
            {s.name}
          </button>
          {i < stages.length - 1 && (
            <span aria-hidden="true" className="text-muted-foreground">
              →
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

// ---------------------------------------------------------------- 8. Stages

function StagesEditor({ node, today, onChange }: EditorProps) {
  const set = (id: string, patch: Partial<PStage>) =>
    onChange({ stages: replace(node.stages, id, patch) });
  return (
    <Section
      title="Stages"
      action={
        <Button
          size="sm"
          variant="outline"
          onClick={() => onChange({ stages: [...node.stages, stage("New stage")] })}
        >
          <Plus className="size-4" aria-hidden="true" /> Add stage
        </Button>
      }
    >
      <ol className="flex flex-col gap-2">
        {node.stages.map((s, i) => {
          const late = s.status !== "done" && s.plannedEnd != null && s.plannedEnd < today;
          return (
            <li key={s.id}>
              <Card className={cn("flex flex-col gap-3", late && "border-danger")}>
                <div className="flex items-center gap-2">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-tint text-label font-extrabold text-primary-dark">
                    {i + 1}
                  </span>
                  <Input
                    aria-label="Stage name"
                    value={s.name}
                    onChange={(e) => set(s.id, { name: e.target.value })}
                  />
                  <IconBtn
                    label="Move stage up"
                    disabled={i === 0}
                    onClick={() => onChange({ stages: swap(node.stages, i, i - 1) })}
                  >
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </IconBtn>
                  <IconBtn
                    label="Move stage down"
                    disabled={i === node.stages.length - 1}
                    onClick={() => onChange({ stages: swap(node.stages, i, i + 1) })}
                  >
                    <ArrowDown className="size-4" aria-hidden="true" />
                  </IconBtn>
                  <IconBtn
                    label="Delete stage"
                    onClick={() => onChange({ stages: without(node.stages, s.id) })}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </IconBtn>
                </div>
                {late && (
                  <Chip tone="amber" className="self-start">
                    Late since {day(s.plannedEnd)}
                  </Chip>
                )}
                <SegmentedControl
                  label={`Status of ${s.name}`}
                  options={STATUS_OPTIONS}
                  value={s.status === "skipped" ? "pending" : s.status}
                  onValueChange={(status) => set(s.id, { status })}
                />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <L label="Planned start">
                    <DateInput
                      value={s.plannedStart}
                      onValue={(plannedStart) => set(s.id, { plannedStart })}
                    />
                  </L>
                  <L label="Planned end">
                    <DateInput
                      value={s.plannedEnd}
                      onValue={(plannedEnd) => set(s.id, { plannedEnd })}
                    />
                  </L>
                  <L label="Actual start">
                    <DateInput
                      value={s.actualStart}
                      onValue={(actualStart) => set(s.id, { actualStart })}
                    />
                  </L>
                  <L label="Actual end">
                    <DateInput
                      value={s.actualEnd}
                      onValue={(actualEnd) => set(s.id, { actualEnd })}
                    />
                  </L>
                  <L label="Amount (₹)" className="col-span-2 sm:col-span-1">
                    <NumberInput value={s.amount} onValue={(amount) => set(s.id, { amount })} />
                  </L>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

export { STATUS_OPTIONS, roomName };
