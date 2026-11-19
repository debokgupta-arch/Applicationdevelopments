import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PAINT_PALETTE } from "@/lib/paint-palette";
import { ToggleChip } from "./chip";
import { ProgressBar } from "./progress-bar";
import { ProgressRing } from "./progress-ring";
import { RoomChips } from "./room-chips";
import { SegmentedControl } from "./segmented-control";
import { StatusDot } from "./status-dot";
import { SwatchPicker } from "./swatch-picker";

describe("progress", () => {
  it("ProgressBar exposes a clamped value", () => {
    render(<ProgressBar value={130} label="Overall" />);
    expect(screen.getByRole("progressbar", { name: "Overall" })).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
  });

  it("ProgressRing announces its label and percent", () => {
    render(<ProgressRing value={57.4} label="Painting" />);
    expect(screen.getByRole("img", { name: "Painting: 57%" })).toBeInTheDocument();
  });
});

describe("StatusDot", () => {
  it("names each status for screen readers", () => {
    render(
      <>
        <StatusDot status="done" />
        <StatusDot status="in_progress" />
        <StatusDot status="pending" />
      </>,
    );
    for (const name of ["Done", "In progress", "Not started"]) {
      expect(screen.getByRole("img", { name })).toBeInTheDocument();
    }
  });
});

describe("SegmentedControl", () => {
  const options = [
    { value: "matte", label: "Matte" },
    { value: "gloss", label: "Gloss" },
  ] as const;

  function Harness() {
    const [value, setValue] = useState<"matte" | "gloss">("matte");
    return (
      <SegmentedControl label="Finish" options={options} value={value} onValueChange={setValue} />
    );
  }

  it("switches selection on click and never deselects", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const matte = screen.getByRole("radio", { name: "Matte" });
    const gloss = screen.getByRole("radio", { name: "Gloss" });
    expect(matte).toBeChecked();

    await user.click(gloss);
    expect(gloss).toBeChecked();

    await user.click(gloss);
    expect(gloss).toBeChecked();
  });
});

describe("chips", () => {
  it("ToggleChip reports the next pressed state", async () => {
    const onPressedChange = vi.fn();
    render(
      <ToggleChip pressed={false} onPressedChange={onPressedChange}>
        Kitchen
      </ToggleChip>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Kitchen" }));
    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it("RoomChips toggles rooms and offers + Room", async () => {
    const onToggle = vi.fn();
    const onAddRoom = vi.fn();
    render(
      <RoomChips
        label="Rooms"
        rooms={[
          { id: "a", name: "Living room" },
          { id: "b", name: "Kitchen" },
        ]}
        selected={["a"]}
        onToggle={onToggle}
        onAddRoom={onAddRoom}
      />,
    );
    expect(screen.getByRole("button", { name: "Living room" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(screen.getByRole("button", { name: "Kitchen" }));
    await userEvent.click(screen.getByRole("button", { name: "Add a room" }));
    expect(onToggle).toHaveBeenCalledWith("b");
    expect(onAddRoom).toHaveBeenCalledOnce();
  });
});

describe("SwatchPicker", () => {
  it("marks the selected swatch and shows its name", async () => {
    const onValueChange = vi.fn();
    const [first, second] = PAINT_PALETTE;
    render(
      <SwatchPicker
        id="t"
        label="Wall colour"
        swatches={PAINT_PALETTE}
        value={first.hex.toLowerCase()}
        onValueChange={onValueChange}
      />,
    );
    expect(screen.getByRole("radio", { name: first.name })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText(first.name, { selector: "p" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("radio", { name: second.name }));
    expect(onValueChange).toHaveBeenCalledWith(second);
  });
});
