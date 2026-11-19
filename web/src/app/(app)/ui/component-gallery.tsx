"use client";

import { useState, type ReactNode } from "react";
import { Inbox } from "lucide-react";
import { DEMO_ROOMS } from "@/lib/demo-data";
import { PAINT_PALETTE } from "@/lib/paint-palette";
import { copy } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import { Chip, ToggleChip } from "@/components/kit/chip";
import { DragHandle } from "@/components/kit/drag-handle";
import { EmptyState } from "@/components/kit/empty-state";
import { Field, TextInput } from "@/components/kit/field";
import { ProgressBar } from "@/components/kit/progress-bar";
import { ProgressRing } from "@/components/kit/progress-ring";
import { ResponsiveDialog } from "@/components/kit/responsive-dialog";
import { RoomChips } from "@/components/kit/room-chips";
import { SegmentedControl } from "@/components/kit/segmented-control";
import { StatCard } from "@/components/kit/stat-card";
import { StatusDot } from "@/components/kit/status-dot";
import { SwatchPicker } from "@/components/kit/swatch-picker";

// Gallery-only sample labels. This page exists for design review, not end users.
const SAMPLE = {
  finishes: [
    { value: "matte", label: "Matte" },
    { value: "satin", label: "Satin" },
    { value: "gloss", label: "Gloss" },
  ],
  finishLabel: "Finish",
  roomsLabel: "Rooms",
  taskTitle: "Wall preparation",
  emptyTitle: "Nothing here yet",
  emptyBody: "Empty states explain what will appear and offer a next step.",
  openDialog: "Open dialog",
  dialogTitle: "Bottom sheet / dialog",
  dialogBody: "A bottom sheet below 1024px and a centred 600px dialog above it.",
} as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-card border bg-card p-5">
      <h2 className="text-section font-extrabold">{title}</h2>
      {children}
    </section>
  );
}

export function ComponentGallery() {
  const [finish, setFinish] = useState<"matte" | "satin" | "gloss">("matte");
  const [rooms, setRooms] = useState<string[]>(["living"]);
  const [colour, setColour] = useState<string | null>(PAINT_PALETTE[2].hex);
  const [filterOn, setFilterOn] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggleRoom = (id: string) =>
    setRooms((current) =>
      current.includes(id) ? current.filter((r) => r !== id) : [...current, id],
    );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Section title="ProgressRing · ProgressBar">
        <div className="flex items-center gap-4">
          <ProgressRing value={0} label="Planning" />
          <ProgressRing value={57} label="Painting" />
          <ProgressRing value={100} label="Cleaning" size={64} />
        </div>
        <ProgressBar value={38} label="Overall progress" />
        <div className="rounded-hero bg-primary p-4">
          <ProgressBar value={62} label="On teal" tone="onPrimary" />
        </div>
      </Section>

      <Section title="StatusDot · DragHandle">
        {(["done", "in_progress", "blocked", "pending"] as const).map((status) => (
          <div key={status} className="flex items-center gap-2">
            <DragHandle label={copy.dragHandle(SAMPLE.taskTitle)} />
            <StatusDot status={status} />
            <span className="font-semibold">{copy.status[status]}</span>
          </div>
        ))}
      </Section>

      <Section title="Chip">
        <div className="flex flex-wrap gap-2">
          <Chip>Living room</Chip>
          <Chip tone="amber">Today</Chip>
          <Chip tone="custom">{copy.chips.custom}</Chip>
          <Chip tone="selected">Selected</Chip>
        </div>
        <div className="flex flex-wrap gap-2">
          <ToggleChip pressed={filterOn} onPressedChange={setFilterOn}>
            All rooms
          </ToggleChip>
          <ToggleChip pressed={!filterOn} onPressedChange={(on) => setFilterOn(!on)}>
            Kitchen
          </ToggleChip>
        </div>
      </Section>

      <Section title="SegmentedControl · Field">
        <SegmentedControl
          label={SAMPLE.finishLabel}
          options={SAMPLE.finishes}
          value={finish}
          onValueChange={setFinish}
        />
        <Field id="gallery-title" label="Title" hint="Required">
          <TextInput id="gallery-title" placeholder="e.g. Fix balcony door lock" />
        </Field>
        <Field id="gallery-error" label="With an error" error="Title is required">
          <TextInput id="gallery-error" aria-invalid aria-describedby="gallery-error-error" />
        </Field>
      </Section>

      <Section title="RoomChips">
        <RoomChips
          label={SAMPLE.roomsLabel}
          rooms={DEMO_ROOMS}
          selected={rooms}
          onToggle={toggleRoom}
          onAddRoom={() => undefined}
        />
      </Section>

      <Section title="SwatchPicker">
        <SwatchPicker
          id="gallery-swatch"
          label={copy.swatches.label}
          swatches={PAINT_PALETTE}
          value={colour}
          onValueChange={(swatch) => setColour(swatch.hex)}
        />
      </Section>

      <Section title="StatCard">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Done" value="8 / 14" hint="57%" />
          <StatCard label="Next due" value="Tomorrow" />
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-hero bg-primary p-3">
          <StatCard tone="onPrimary" label="Tasks done" value="42 / 110" />
          <StatCard tone="onPrimary" label="Spent" value="₹1.2L" />
          <StatCard tone="onPrimary" label="Snags" value="5" />
        </div>
      </Section>

      <Section title="EmptyState · Dialog / BottomSheet">
        <EmptyState
          icon={Inbox}
          title={SAMPLE.emptyTitle}
          description={SAMPLE.emptyBody}
          action={
            <Button type="button" variant="outline" onClick={() => setDialogOpen(true)}>
              {SAMPLE.openDialog}
            </Button>
          }
        />
        <ResponsiveDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={SAMPLE.dialogTitle}
          footer={
            <Button type="button" onClick={() => setDialogOpen(false)}>
              {copy.dialog.close}
            </Button>
          }
        >
          <p className="text-body text-muted-foreground">{SAMPLE.dialogBody}</p>
        </ResponsiveDialog>
      </Section>
    </div>
  );
}
