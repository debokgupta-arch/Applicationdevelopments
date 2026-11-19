import { Suspense } from "react";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { copy } from "@/lib/copy";
import { getCurrentHome } from "@/lib/data/homes";
import { formatLongToday } from "@/lib/format";
import { EmptyState } from "@/components/kit/empty-state";
import { PageHeader } from "@/components/kit/page-header";
import { Button } from "@/components/ui/button";

/** Preview modules (v2 section 6) until the dashboard lists real ones (phase 7). */
const PREVIEW_MODULES = [
  ["painting", "Painting"],
  ["carpentry", "Carpentry"],
  ["appliances", "Appliances"],
  ["electrical", "Electrical"],
  ["plumbing", "Plumbing"],
] as const;

/** Today's date and the current home are per request, so they stream in behind Suspense. */
async function Subtitle() {
  const home = await getCurrentHome();
  const today = formatLongToday(new Date());
  return home ? copy.dashboard.subtitle(today, home.name) : today;
}

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title={copy.dashboard.title}
        subtitle={
          <Suspense fallback={<span className="invisible">.</span>}>
            <Subtitle />
          </Suspense>
        }
      />
      <EmptyState
        icon={LayoutDashboard}
        title={copy.dashboard.emptyTitle}
        description={copy.dashboard.emptyBody}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {PREVIEW_MODULES.map(([id, name]) => (
              <Button key={id} asChild variant="outline">
                <Link href={`/modules/${id}`}>{name}</Link>
              </Button>
            ))}
            <Button asChild>
              <Link href="/plan">Floor plan</Link>
            </Button>
          </div>
        }
      />
    </>
  );
}
