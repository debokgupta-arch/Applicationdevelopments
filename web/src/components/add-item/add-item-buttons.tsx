"use client";

import { Plus } from "lucide-react";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAddItem, type AddItemKind } from "./add-item-provider";

type AddItemButtonProps = {
  kind?: AddItemKind;
  label?: string;
  variant?: "default" | "secondary" | "outline";
  className?: string;
};

/** Labelled "+ Add item" style button (top bar, page headers). */
export function AddItemButton({
  kind = "task",
  label = copy.shell.addItem,
  variant = "default",
  className,
}: AddItemButtonProps) {
  const { openAddItem } = useAddItem();
  return (
    <Button type="button" variant={variant} className={className} onClick={() => openAddItem(kind)}>
      <Plus className="size-4" aria-hidden="true" />
      {label}
    </Button>
  );
}

/** Floating "+" above the mobile tab bar. */
export function AddItemFab({ className }: { className?: string }) {
  const { openAddItem } = useAddItem();
  return (
    <Button
      type="button"
      size="icon-lg"
      aria-label={copy.shell.addItem}
      onClick={() => openAddItem("task")}
      className={cn(
        "fixed right-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-30 shadow-lg lg:hidden",
        className,
      )}
    >
      <Plus className="size-6" aria-hidden="true" />
    </Button>
  );
}
