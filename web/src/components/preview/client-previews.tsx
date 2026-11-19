"use client";

import dynamic from "next/dynamic";

/**
 * The previews keep all their state in the browser (random ids, object URLs
 * for uploaded plans), so they render client-side only.
 */
const Loading = () => <div className="h-96 animate-pulse rounded-card bg-muted" />;

export const FloorPlanPreviewClient = dynamic(
  () => import("./floor-plan-preview").then((m) => m.FloorPlanPreview),
  { ssr: false, loading: Loading },
);

export const ModulePreviewClient = dynamic(
  () => import("./module-preview").then((m) => m.ModulePreview),
  { ssr: false, loading: Loading },
);
