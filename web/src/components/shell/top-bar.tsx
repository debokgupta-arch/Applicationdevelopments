import { Suspense } from "react";
import { Bell, Search } from "lucide-react";
import { copy } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import { AddItemButton } from "@/components/add-item/add-item-buttons";
import { MobileMoreMenu } from "./mobile-more-menu";
import { SlotSkeleton, UserMenuSlot } from "./shell-slots";

/** Search, "+ Add item" (desktop), notifications, more-menu (mobile) and the account menu. */
export function TopBar() {
  return (
    <div className="flex items-center gap-2 lg:gap-3">
      <form role="search" className="relative min-w-0 flex-1 lg:max-w-md" action="/tasks">
        <label htmlFor="global-search" className="sr-only">
          {copy.shell.search}
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          id="global-search"
          name="q"
          type="search"
          placeholder={copy.shell.searchPlaceholder}
          className="h-11 w-full rounded-full border border-input bg-card pr-4 pl-10 text-body outline-none placeholder:text-muted-foreground/80 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/30"
        />
      </form>
      <div className="hidden flex-1 lg:block" />
      <AddItemButton className="hidden lg:inline-flex" />
      <Button type="button" variant="ghost" size="icon" aria-label={copy.shell.notifications}>
        <Bell className="size-5" aria-hidden="true" />
      </Button>
      <MobileMoreMenu />
      <Suspense fallback={<SlotSkeleton className="size-11 rounded-full" />}>
        <UserMenuSlot />
      </Suspense>
    </div>
  );
}
