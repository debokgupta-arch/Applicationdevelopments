import { copy } from "@/lib/copy";
import { clampPercent } from "@/lib/format";
import { ProgressBar } from "@/components/kit/progress-bar";

export function MoveReadinessCard({ percent }: { percent: number }) {
  const value = clampPercent(percent);
  return (
    <section className="flex flex-col gap-2 rounded-card bg-primary p-4 text-primary-foreground">
      <h2 className="text-label font-bold text-primary-foreground/85">
        {copy.shell.moveReadiness}
      </h2>
      <p className="text-page-title font-extrabold">{value}%</p>
      <ProgressBar value={value} tone="onPrimary" label={copy.shell.moveReadiness} />
    </section>
  );
}
