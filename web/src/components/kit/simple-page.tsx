import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { EmptyState } from "./empty-state";
import { PageHeader } from "./page-header";

type SimplePageProps = {
  title: string;
  icon: LucideIcon;
  emptyTitle: string;
  emptyBody: string;
  actions?: ReactNode;
};

/** Header + empty state; used by routes whose content arrives in later phases. */
export function SimplePage({ title, icon, emptyTitle, emptyBody, actions }: SimplePageProps) {
  return (
    <>
      <PageHeader title={title} actions={actions} />
      <EmptyState icon={icon} title={emptyTitle} description={emptyBody} />
    </>
  );
}
