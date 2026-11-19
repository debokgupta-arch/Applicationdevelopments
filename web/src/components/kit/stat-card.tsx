import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  /** "onPrimary" renders a translucent tile for teal hero cards. */
  tone?: "default" | "onPrimary";
  className?: string;
};

export function StatCard({ label, value, hint, tone = "default", className }: StatCardProps) {
  const onPrimary = tone === "onPrimary";
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-card p-4",
        onPrimary ? "bg-primary-foreground/12 text-primary-foreground" : "border bg-card",
        className,
      )}
    >
      <p
        className={cn(
          "text-label font-bold",
          onPrimary ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <p className="text-section font-extrabold">{value}</p>
      {hint && (
        <p
          className={cn(
            "text-label",
            onPrimary ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
