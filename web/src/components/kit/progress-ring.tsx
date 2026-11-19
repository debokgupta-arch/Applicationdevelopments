import { cn } from "@/lib/utils";
import { clampPercent } from "@/lib/format";

type ProgressRingProps = {
  value: number;
  label: string;
  /** Diameter in px. */
  size?: number;
  className?: string;
};

/** Conic-gradient ring with the percent in the middle. Colours come from theme variables. */
export function ProgressRing({ value, label, size = 56, className }: ProgressRingProps) {
  const percent = clampPercent(value);
  return (
    <div
      role="img"
      aria-label={`${label}: ${percent}%`}
      className={cn("relative shrink-0 rounded-full", className)}
      style={{
        width: size,
        height: size,
        background: `conic-gradient(var(--color-primary) ${percent}%, var(--color-primary-tint) 0)`,
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-[5px] flex items-center justify-center rounded-full bg-card text-label font-extrabold text-foreground"
      >
        {percent}%
      </span>
    </div>
  );
}
