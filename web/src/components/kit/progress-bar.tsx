import { cn } from "@/lib/utils";
import { clampPercent } from "@/lib/format";

type ProgressBarProps = {
  value: number;
  label: string;
  /** "onPrimary" is for use on teal hero cards. */
  tone?: "default" | "onPrimary";
  className?: string;
};

export function ProgressBar({ value, label, tone = "default", className }: ProgressBarProps) {
  const percent = clampPercent(value);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "h-2 w-full overflow-hidden rounded-full",
        tone === "onPrimary" ? "bg-primary-foreground/25" : "bg-primary-tint",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500",
          tone === "onPrimary" ? "bg-primary-foreground" : "bg-primary",
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
