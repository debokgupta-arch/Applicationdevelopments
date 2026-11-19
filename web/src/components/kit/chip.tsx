import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ChipTone = "neutral" | "amber" | "custom" | "selected";

const toneClasses: Record<ChipTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  amber: "bg-due-soon text-due-soon-foreground",
  custom: "bg-custom-tag text-custom-tag-foreground",
  selected: "bg-primary-tint text-primary-dark",
};

type StaticChipProps = { tone?: ChipTone; children: ReactNode; className?: string };

/** Small static tag: room names, due dates, "Custom". */
export function Chip({ tone = "neutral", children, className }: StaticChipProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-label font-bold whitespace-nowrap",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

type ToggleChipProps = {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  children: ReactNode;
  className?: string;
};

/** Interactive filter/multi-select chip with a 44px touch target. */
export function ToggleChip({ pressed, onPressedChange, children, className }: ToggleChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-body font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        pressed
          ? "border-primary bg-primary-tint text-primary-dark"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}
