import type { ReactNode } from "react";

type PageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Breadcrumb or other context shown above the title. */
  eyebrow?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, eyebrow, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow}
        <h1 className="text-page-title font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-body text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
