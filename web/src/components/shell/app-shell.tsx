import { Suspense, type ReactNode } from "react";
import { copy } from "@/lib/copy";
import { NAV_ITEMS, TAB_BAR_ITEMS } from "@/lib/navigation";
import { AddItemFab } from "@/components/add-item/add-item-buttons";
import { AddItemProvider } from "@/components/add-item/add-item-provider";
import { ActiveNavLinks } from "./active-nav-links";
import { Logo } from "./logo";
import { NavLinks } from "./nav-links";
import { HomeSwitcherSlot, MoveReadinessSlot, SlotSkeleton } from "./shell-slots";
import { TopBar } from "./top-bar";

/**
 * Responsive frame (spec section 4): 240px sidebar at >= 1024px, bottom tab bar
 * plus floating "+" below that. Everything that depends on the request (the
 * pathname, the signed-in user, their homes) streams in behind Suspense, so the
 * frame itself prerenders.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AddItemProvider>
      <div className="flex min-h-dvh">
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-5 overflow-y-auto border-r bg-card p-4 lg:flex">
          <Logo />
          <Suspense fallback={<SlotSkeleton className="h-[78px]" />}>
            <HomeSwitcherSlot />
          </Suspense>
          <nav aria-label={copy.nav.label}>
            <Suspense fallback={<NavLinks items={NAV_ITEMS} variant="sidebar" pathname={null} />}>
              <ActiveNavLinks variant="sidebar" />
            </Suspense>
          </nav>
          <div className="mt-auto">
            <Suspense fallback={<SlotSkeleton className="h-[112px]" />}>
              <MoveReadinessSlot />
            </Suspense>
          </div>
        </aside>

        <div className="mx-auto flex w-full max-w-[1164px] min-w-0 flex-1 flex-col gap-6 px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-32 lg:px-8 lg:pt-6 lg:pb-12">
          <TopBar />
          <main className="flex flex-col gap-6">{children}</main>
        </div>

        <nav
          aria-label={copy.nav.label}
          className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          <Suspense fallback={<NavLinks items={TAB_BAR_ITEMS} variant="tabs" pathname={null} />}>
            <ActiveNavLinks variant="tabs" />
          </Suspense>
        </nav>
        <AddItemFab />
      </div>
    </AddItemProvider>
  );
}
