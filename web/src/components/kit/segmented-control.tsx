"use client";

import { ToggleGroup } from "radix-ui";
import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onValueChange: (value: T) => void;
  label: string;
  className?: string;
};

/** Single-select pill group (arrow keys move between options). Never allows "no selection". */
export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  label,
  className,
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroup.Root
      type="single"
      aria-label={label}
      value={value}
      onValueChange={(next) => {
        const match = options.find((option) => option.value === next);
        if (match) onValueChange(match.value);
      }}
      className={cn("flex w-full rounded-full bg-muted p-1", className)}
    >
      {options.map((option) => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          className="min-h-11 flex-1 rounded-full px-3 text-body font-semibold text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=on]:bg-card data-[state=on]:text-primary-dark data-[state=on]:shadow-sm"
        >
          {option.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
