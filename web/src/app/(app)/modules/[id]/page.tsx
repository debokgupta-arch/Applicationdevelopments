import { Suspense } from "react";
import { ModulePreviewClient } from "@/components/preview/client-previews";

/**
 * Interactive preview of v2 section 5 (Module > Task > Sub-task with the eight
 * task-type editors); not yet persisted. Module ids are request data, so the
 * preview renders inside Suspense.
 */
export default function ModulePage({ params }: PageProps<"/modules/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-card bg-muted" />}>
      {params.then(({ id }) => (
        <ModulePreviewClient key={id} moduleId={decodeURIComponent(id)} />
      ))}
    </Suspense>
  );
}
