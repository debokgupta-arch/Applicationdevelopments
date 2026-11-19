/** Small form primitives shared by the preview editors. */
import type { ComponentProps, ReactNode } from "react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

export const inputCls =
  "h-11 w-full min-w-0 rounded-input border border-input bg-card px-3 text-body text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/30";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputCls, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(inputCls, "px-2.5", className)} {...props} />;
}

/** Label wrapping its control (implicit association). */
export function L({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="text-label font-bold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function NumberInput({
  value,
  onValue,
  ...props
}: Omit<ComponentProps<"input">, "value" | "onChange"> & {
  value: number | null;
  onValue: (v: number | null) => void;
}) {
  return (
    <Input
      type="number"
      inputMode="decimal"
      value={value ?? ""}
      onChange={(e) => onValue(e.target.value === "" ? null : Number(e.target.value))}
      {...props}
    />
  );
}

export function DateInput({
  value,
  onValue,
  ...props
}: Omit<ComponentProps<"input">, "value" | "onChange"> & {
  value: string | null;
  onValue: (v: string | null) => void;
}) {
  return (
    <Input
      type="date"
      value={value ?? ""}
      onChange={(e) => onValue(e.target.value || null)}
      {...props}
    />
  );
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
export const money = (n: number | null | undefined) => (n == null ? "—" : inr.format(n));
export const day = (iso: string | null | undefined) =>
  iso ? format(parseISO(iso), "dd MMM yyyy") : "—";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-card border bg-card p-4", className)}>{children}</div>;
}

export function IconBtn({
  label,
  children,
  className,
  ...props
}: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
