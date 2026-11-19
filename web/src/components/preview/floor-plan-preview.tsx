"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  AlertTriangle,
  ImageUp,
  MousePointer2,
  Pencil,
  Plus,
  SquareDashed,
  Trash2,
} from "lucide-react";
import { demoFloors, uid, type PFloor, type PRect, type PRoom } from "@/lib/preview/data";
import { cn } from "@/lib/utils";
import { Chip, ToggleChip } from "@/components/kit/chip";
import { ProgressBar } from "@/components/kit/progress-bar";
import { SegmentedControl } from "@/components/kit/segmented-control";
import { Button } from "@/components/ui/button";
import { Card, IconBtn, Input, L, NumberInput } from "./ui";

const SQM_PER_SQFT = 0.092903;
const ROOM_PRESETS = [
  "Living",
  "Master bedroom",
  "Bedroom",
  "Kitchen",
  "Bath",
  "Balcony",
  "Dining",
  "Utility",
];

type Unit = "sqft" | "sqm";
const fmtArea = (sqft: number | null, unit: Unit) =>
  sqft == null
    ? "—"
    : unit === "sqft"
      ? `${Math.round(sqft)} sq ft`
      : `${(sqft * SQM_PER_SQFT).toFixed(1)} sq m`;

export function FloorPlanPreview() {
  const [floors, setFloors] = useState<PFloor[]>(demoFloors);
  const [activeId, setActiveId] = useState(floors[0].id);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(
    floors[0].rooms[0]?.id ?? null,
  );
  const [unit, setUnit] = useState<Unit>("sqft");
  const [renamingFloor, setRenamingFloor] = useState<string | null>(null);
  const floor = floors.find((f) => f.id === activeId) ?? floors[0];

  const setFloor = (patch: Partial<PFloor>) =>
    setFloors((fs) => fs.map((f) => (f.id === floor.id ? { ...f, ...patch } : f)));
  const setRoom = (id: string, patch: Partial<PRoom>) =>
    setFloor({
      rooms: floor.rooms.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        // Area auto-computes from length x width when both are present.
        if (("lengthFt" in patch || "widthFt" in patch) && next.lengthFt && next.widthFt) {
          next.areaSqft = Math.round(next.lengthFt * next.widthFt * 100) / 100;
        }
        return next;
      }),
    });
  const addRoom = (name: string) => {
    const room: PRoom = {
      id: uid(),
      name,
      lengthFt: null,
      widthFt: null,
      areaSqft: null,
      rect: null,
    };
    setFloor({ rooms: [...floor.rooms, room] });
    setSelectedRoomId(room.id);
  };

  const addFloor = () => {
    const f: PFloor = {
      id: uid(),
      label: `Floor ${floors.length + 1}`,
      totalAreaSqft: null,
      planUrl: null,
      rooms: [],
    };
    setFloors((fs) => [...fs, f]);
    setActiveId(f.id);
    setRenamingFloor(f.id);
  };
  const deleteFloor = (id: string) => {
    if (floors.length === 1) return;
    const rest = floors.filter((f) => f.id !== id);
    setFloors(rest);
    if (activeId === id) setActiveId(rest[0].id);
  };
  const moveFloor = (id: string, delta: -1 | 1) =>
    setFloors((fs) => {
      const i = fs.findIndex((f) => f.id === id);
      const j = i + delta;
      if (j < 0 || j >= fs.length) return fs;
      const out = [...fs];
      [out[i], out[j]] = [out[j], out[i]];
      return out;
    });

  const roomsTotal = floor.rooms.reduce((a, r) => a + (r.areaSqft ?? 0), 0);
  const over = floor.totalAreaSqft != null && roomsTotal > floor.totalAreaSqft;

  return (
    <div className="flex flex-col gap-6">
      <div
        className="rounded-card bg-due-soon px-4 py-3 text-label font-semibold text-due-soon-foreground"
        role="note"
      >
        Preview: everything here works, but changes aren&apos;t saved yet (they reset on reload).
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-page-title font-extrabold tracking-tight">Floor plan and colours</h1>
        <SegmentedControl
          label="Area unit"
          className="w-48"
          options={[
            { value: "sqft", label: "sq ft" },
            { value: "sqm", label: "sq m" },
          ]}
          value={unit}
          onValueChange={setUnit}
        />
      </div>

      {/* Floor tabs */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Floors">
        {floors.map((f, i) =>
          renamingFloor === f.id ? (
            <form
              key={f.id}
              onSubmit={(e) => {
                e.preventDefault();
                setRenamingFloor(null);
              }}
            >
              <Input
                autoFocus
                aria-label="Floor name"
                className="w-40"
                value={f.label}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) =>
                  setFloors((fs) =>
                    fs.map((x) => (x.id === f.id ? { ...x, label: e.target.value } : x)),
                  )
                }
                onBlur={() => setRenamingFloor(null)}
              />
            </form>
          ) : (
            <span key={f.id} className="inline-flex items-center">
              <ToggleChip pressed={f.id === floor.id} onPressedChange={() => setActiveId(f.id)}>
                {f.label}
                <span className="text-label font-normal opacity-70">{f.rooms.length}</span>
              </ToggleChip>
              {f.id === floor.id && (
                <>
                  <IconBtn label={`Rename ${f.label}`} onClick={() => setRenamingFloor(f.id)}>
                    <Pencil className="size-4" aria-hidden="true" />
                  </IconBtn>
                  <IconBtn
                    label={`Move ${f.label} left`}
                    disabled={i === 0}
                    onClick={() => moveFloor(f.id, -1)}
                  >
                    ‹
                  </IconBtn>
                  <IconBtn
                    label={`Move ${f.label} right`}
                    disabled={i === floors.length - 1}
                    onClick={() => moveFloor(f.id, 1)}
                  >
                    ›
                  </IconBtn>
                  <IconBtn
                    label={`Delete ${f.label}`}
                    disabled={floors.length === 1}
                    onClick={() => deleteFloor(f.id)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </IconBtn>
                </>
              )}
            </span>
          ),
        )}
        <button
          type="button"
          onClick={addFloor}
          className="inline-flex min-h-11 items-center gap-1 rounded-full border border-dashed border-input px-4 text-body font-semibold text-primary outline-none hover:bg-primary-tint focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Plus className="size-4" aria-hidden="true" /> Add floor
        </button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <PlanCanvas
          floor={floor}
          selectedRoomId={selectedRoomId}
          unit={unit}
          onSelect={setSelectedRoomId}
          onPlan={(planUrl) => setFloor({ planUrl })}
          onRect={(roomId, rect) => setRoom(roomId, { rect })}
          onNewRoomWithRect={(rect) => {
            const room: PRoom = {
              id: uid(),
              name: `Room ${floor.rooms.length + 1}`,
              lengthFt: null,
              widthFt: null,
              areaSqft: null,
              rect,
            };
            setFloor({ rooms: [...floor.rooms, room] });
            setSelectedRoomId(room.id);
          }}
        />

        <Card className="flex flex-col gap-4">
          <h2 className="text-section font-extrabold">{floor.label}</h2>
          <L label={`Total area (sq ft)`}>
            <NumberInput
              value={floor.totalAreaSqft}
              onValue={(totalAreaSqft) => setFloor({ totalAreaSqft })}
            />
          </L>
          <div className="flex flex-col gap-1.5">
            <p className="text-label font-bold text-muted-foreground">Rooms vs total</p>
            <p className="font-extrabold">
              {fmtArea(roomsTotal, unit)}{" "}
              <span className="font-normal text-muted-foreground">
                of {fmtArea(floor.totalAreaSqft, unit)}
              </span>
            </p>
            <ProgressBar
              value={floor.totalAreaSqft ? (roomsTotal / floor.totalAreaSqft) * 100 : 0}
              label="Room area as share of total"
            />
            {over && (
              <p
                role="status"
                className="flex items-start gap-1.5 text-label font-semibold text-due-soon-foreground"
              >
                <AlertTriangle className="mt-px size-4 shrink-0" aria-hidden="true" />
                Rooms add up to {fmtArea(roomsTotal - (floor.totalAreaSqft ?? 0), unit)} more than
                the floor total. Check the sizes (this won&apos;t block you).
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Rooms table */}
      <section className="flex flex-col gap-3" aria-labelledby="rooms-heading">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="rooms-heading" className="text-section font-extrabold">
            Rooms and spaces on {floor.label}
          </h2>
          <Button variant="outline" onClick={() => addRoom(`Room ${floor.rooms.length + 1}`)}>
            <Plus className="size-4" aria-hidden="true" /> Add room
          </Button>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Quick add">
          {ROOM_PRESETS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => addRoom(name)}
              className="inline-flex min-h-11 items-center gap-1 rounded-full border border-dashed border-input px-3 text-body font-semibold text-muted-foreground outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Plus className="size-3.5" aria-hidden="true" /> {name}
            </button>
          ))}
        </div>
        {floor.rooms.length === 0 && (
          <Card className="text-center text-body text-muted-foreground">
            No rooms on this floor yet. Add one above, or draw it on an uploaded plan.
          </Card>
        )}
        <div className="flex flex-col gap-2">
          {floor.rooms.map((r) => (
            <div
              key={r.id}
              onFocusCapture={() => setSelectedRoomId(r.id)}
              className={cn(
                "grid grid-cols-2 items-end gap-2 rounded-card border bg-card p-3 sm:grid-cols-[2fr_1fr_1fr_1.2fr_auto]",
                selectedRoomId === r.id && "border-[1.5px] border-primary",
              )}
            >
              <L label="Name" className="col-span-2 sm:col-span-1">
                <Input value={r.name} onChange={(e) => setRoom(r.id, { name: e.target.value })} />
              </L>
              <L label="Length (ft)">
                <NumberInput
                  value={r.lengthFt}
                  onValue={(lengthFt) => setRoom(r.id, { lengthFt })}
                />
              </L>
              <L label="Width (ft)">
                <NumberInput value={r.widthFt} onValue={(widthFt) => setRoom(r.id, { widthFt })} />
              </L>
              <L label={r.lengthFt && r.widthFt ? "Area (auto)" : "Area (sq ft)"}>
                <NumberInput
                  value={r.areaSqft}
                  readOnly={Boolean(r.lengthFt && r.widthFt)}
                  onValue={(areaSqft) => setRoom(r.id, { areaSqft })}
                />
              </L>
              <div className="flex items-center">
                {r.rect && (
                  <Chip tone="selected" className="mr-1">
                    On plan
                  </Chip>
                )}
                <IconBtn
                  label={`Delete ${r.name}`}
                  onClick={() => setFloor({ rooms: floor.rooms.filter((x) => x.id !== r.id) })}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </IconBtn>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------- plan canvas

type CanvasProps = {
  floor: PFloor;
  selectedRoomId: string | null;
  unit: Unit;
  onSelect: (id: string) => void;
  onPlan: (url: string | null) => void;
  onRect: (roomId: string, rect: PRect) => void;
  onNewRoomWithRect: (rect: PRect) => void;
};

function PlanCanvas({
  floor,
  selectedRoomId,
  unit,
  onSelect,
  onPlan,
  onRect,
  onNewRoomWithRect,
}: CanvasProps) {
  const [mode, setMode] = useState<"select" | "draw">("select");
  const [draft, setDraft] = useState<PRect | null>(null);
  const area = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const resizing = useRef<string | null>(null);

  const pct = (e: ReactPointerEvent) => {
    const box = area.current!.getBoundingClientRect();
    return {
      x: Math.min(100, Math.max(0, ((e.clientX - box.left) / box.width) * 100)),
      y: Math.min(100, Math.max(0, ((e.clientY - box.top) / box.height) * 100)),
    };
  };

  const onDown = (e: ReactPointerEvent) => {
    if (mode !== "draw") return;
    area.current?.setPointerCapture(e.pointerId);
    start.current = pct(e);
    setDraft({ ...start.current, w: 0, h: 0 });
  };
  const onMove = (e: ReactPointerEvent) => {
    const p = pct(e);
    if (resizing.current) {
      const room = floor.rooms.find((r) => r.id === resizing.current);
      if (room?.rect)
        onRect(room.id, {
          ...room.rect,
          w: Math.max(3, p.x - room.rect.x),
          h: Math.max(3, p.y - room.rect.y),
        });
      return;
    }
    if (!start.current) return;
    setDraft({
      x: Math.min(start.current.x, p.x),
      y: Math.min(start.current.y, p.y),
      w: Math.abs(p.x - start.current.x),
      h: Math.abs(p.y - start.current.y),
    });
  };
  const onUp = () => {
    resizing.current = null;
    if (draft && draft.w > 2 && draft.h > 2) {
      const target = floor.rooms.find((r) => r.id === selectedRoomId && !r.rect);
      if (target) onRect(target.id, draft);
      else onNewRoomWithRect(draft);
      setMode("select");
    }
    start.current = null;
    setDraft(null);
  };

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          label="Canvas tool"
          className="w-auto flex-1 sm:max-w-xs"
          options={[
            { value: "select", label: "Select" },
            { value: "draw", label: "Draw room" },
          ]}
          value={mode}
          onValueChange={setMode}
        />
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-body font-semibold outline-none focus-within:ring-3 focus-within:ring-ring/50 hover:bg-muted">
          <ImageUp className="size-4" aria-hidden="true" />{" "}
          {floor.planUrl ? "Replace plan" : "Upload plan"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPlan(URL.createObjectURL(file));
            }}
          />
        </label>
        {floor.planUrl && (
          <Button variant="ghost" size="sm" onClick={() => onPlan(null)}>
            Remove plan
          </Button>
        )}
      </div>
      <p className="flex items-center gap-1.5 text-label text-muted-foreground">
        {mode === "draw" ? (
          <SquareDashed className="size-4" aria-hidden="true" />
        ) : (
          <MousePointer2 className="size-4" aria-hidden="true" />
        )}
        {mode === "draw"
          ? "Drag on the plan to draw a room. It's linked to the selected room if that has no shape yet, otherwise a new room is added."
          : "Tap a room to select it; drag its corner handle to resize."}{" "}
        PDF plans (first page) come with the full version.
      </p>

      <div
        ref={area}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        className={cn(
          "relative aspect-[4/3] w-full touch-none overflow-hidden rounded-input border bg-[length:24px_24px] select-none",
          "bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)]",
          mode === "draw" && "cursor-crosshair",
        )}
        role="application"
        aria-label={`Floor plan for ${floor.label}`}
      >
        {floor.planUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL from the user's file
          <img
            src={floor.planUrl}
            alt={`Uploaded plan of ${floor.label}`}
            className="pointer-events-none absolute inset-0 size-full object-contain"
          />
        ) : (
          <ManualLayout
            floor={floor}
            selectedRoomId={selectedRoomId}
            unit={unit}
            onSelect={onSelect}
          />
        )}

        {floor.rooms
          .filter((r) => r.rect)
          .map((r) => {
            const sel = r.id === selectedRoomId;
            return (
              <div
                key={r.id}
                className={cn(
                  "absolute rounded-sm border-2 bg-primary/10",
                  sel ? "border-primary bg-primary/20" : "border-muted-foreground/50",
                )}
                style={{
                  left: `${r.rect!.x}%`,
                  top: `${r.rect!.y}%`,
                  width: `${r.rect!.w}%`,
                  height: `${r.rect!.h}%`,
                }}
              >
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onSelect(r.id)}
                  className="absolute inset-0 flex items-start p-1 text-left text-label font-bold text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="rounded bg-card/90 px-1">{r.name}</span>
                </button>
                {sel && (
                  <span
                    role="presentation"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      area.current?.setPointerCapture(e.pointerId);
                      resizing.current = r.id;
                    }}
                    className="absolute -right-2 -bottom-2 size-5 cursor-nwse-resize rounded-full border-2 border-card bg-primary"
                  />
                )}
              </div>
            );
          })}
        {draft && (
          <div
            className="pointer-events-none absolute border-2 border-dashed border-primary bg-primary/10"
            style={{
              left: `${draft.x}%`,
              top: `${draft.y}%`,
              width: `${draft.w}%`,
              height: `${draft.h}%`,
            }}
          />
        )}
      </div>
    </Card>
  );
}

/** Without an uploaded plan: rooms as tiles sized by their area. */
function ManualLayout({
  floor,
  selectedRoomId,
  unit,
  onSelect,
}: {
  floor: PFloor;
  selectedRoomId: string | null;
  unit: Unit;
  onSelect: (id: string) => void;
}) {
  const unplaced = floor.rooms.filter((r) => !r.rect);
  if (unplaced.length === 0) {
    return (
      <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-body text-muted-foreground">
        Upload a plan, or switch to “Draw room” to sketch rooms on the grid.
      </p>
    );
  }
  const max = Math.max(...unplaced.map((r) => r.areaSqft ?? 50));
  return (
    <div className="absolute inset-0 flex flex-wrap content-start gap-2 overflow-auto p-3">
      {unplaced.map((r) => {
        const scale = Math.sqrt((r.areaSqft ?? 50) / max);
        return (
          <button
            key={r.id}
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onSelect(r.id)}
            style={{
              width: `${Math.max(22, scale * 46)}%`,
              height: `${Math.max(64, scale * 150)}px`,
            }}
            className={cn(
              "flex flex-col items-start justify-between rounded-input border-2 bg-card/90 p-2 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              r.id === selectedRoomId ? "border-primary bg-primary-tint" : "border-border",
            )}
          >
            <span className="text-body font-bold">{r.name}</span>
            <span className="text-label text-muted-foreground">{fmtArea(r.areaSqft, unit)}</span>
          </button>
        );
      })}
    </div>
  );
}
