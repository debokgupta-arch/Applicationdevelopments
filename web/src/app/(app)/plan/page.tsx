import type { Metadata } from "next";
import { copy } from "@/lib/copy";
import { FloorPlanPreviewClient } from "@/components/preview/client-previews";

export const metadata: Metadata = { title: copy.pages.plan.title };

/** Interactive preview of v2 section 4 (floors, rooms, plan canvas); not yet persisted. */
export default function PlanPage() {
  return <FloorPlanPreviewClient />;
}
