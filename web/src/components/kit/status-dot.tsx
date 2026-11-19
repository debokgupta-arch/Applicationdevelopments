import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/copy";

export type TaskStatus = keyof typeof copy.status;

/**
 * Done = filled teal with check, in progress = amber ring, blocked = red ring
 * with a bar, not started / skipped = grey ring.
 */
export function StatusDot({ status, className }: { status: TaskStatus; className?: string }) {
  return (
    <span
      role="img"
      aria-label={copy.status[status]}
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full",
        status === "done" && "bg-primary text-primary-foreground",
        status === "in_progress" && "border-[2.5px] border-warning",
        status === "blocked" && "border-[2.5px] border-danger text-danger",
        (status === "pending" || status === "skipped") && "border-2 border-input",
        className,
      )}
    >
      {status === "done" && <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />}
      {status === "blocked" && <Minus className="size-3" strokeWidth={3.5} aria-hidden="true" />}
    </span>
  );
}
