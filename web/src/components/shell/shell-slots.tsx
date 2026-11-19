import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getCurrentHome, getMoveReadiness, getUserHomes } from "@/lib/data/homes";
import { CurrentHomeCard } from "./current-home-card";
import { MoveReadinessCard } from "./move-readiness-card";
import { UserMenu } from "./user-menu";

/*
 * Request-time pieces of the shell. Each reads the session, so AppShell renders
 * them inside their own <Suspense> boundary and the rest of the frame stays static.
 */

/** Sidebar home switcher; also sends users without a home to onboarding. */
export async function HomeSwitcherSlot() {
  const homes = await getUserHomes();
  const current = await getCurrentHome();
  if (!current) redirect("/onboarding");
  return <CurrentHomeCard homes={homes} currentId={current.id} />;
}

export async function MoveReadinessSlot() {
  const current = await getCurrentHome();
  if (!current) return null;
  return <MoveReadinessCard percent={await getMoveReadiness(current.id)} />;
}

export async function UserMenuSlot() {
  const user = await requireUser();
  const contact = user.email ?? user.mobile;
  return (
    <UserMenu
      name={user.displayName}
      detail={contact ? `@${user.username} · ${contact}` : `@${user.username}`}
    />
  );
}

/** Placeholder with the same footprint as the real card, to avoid layout shift. */
export function SlotSkeleton({ className }: { className: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-card bg-muted ${className}`} />;
}
