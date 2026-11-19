import type { ComponentProps } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type DragHandleProps = Omit<ComponentProps<"button">, "children"> & { label: string };

/** Six-dot grip; dnd-kit attaches its listeners to this button in phase 4. */
export function DragHandle({ label, className, ...props }: DragHandleProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "flex h-11 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground/70 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing",
        className,
      )}
      {...props}
    >
      <GripVertical className="size-4" aria-hidden="true" />
    </button>
  );
}
