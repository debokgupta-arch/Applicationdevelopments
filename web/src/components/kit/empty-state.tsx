import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <section
      className={cn(
        "flex flex-col items-center gap-3 rounded-card border bg-card px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-primary-tint text-primary">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h2 className="text-section font-extrabold">{title}</h2>
      <p className="max-w-md text-body text-muted-foreground">{description}</p>
      {action}
    </section>
  );
}
