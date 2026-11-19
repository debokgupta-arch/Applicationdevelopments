import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
};

/** Label + control + optional hint/error, wired up with ids for screen readers. */
export function Field({ id, label, hint, error, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-label font-bold text-muted-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-label font-semibold text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-label text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

/** 48px rounded input that matches the design system. */
export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-input border border-input bg-card px-3.5 text-body text-foreground placeholder:text-muted-foreground/70 outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-danger",
        className,
      )}
      {...props}
    />
  );
}
