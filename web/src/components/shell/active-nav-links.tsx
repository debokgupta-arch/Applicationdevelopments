"use client";

import { usePathname } from "next/navigation";
import { NAV_ITEMS, TAB_BAR_ITEMS } from "@/lib/navigation";
import { NavLinks } from "./nav-links";

/**
 * Highlights the current route. usePathname suspends on dynamic routes while
 * prerendering, so callers wrap this in <Suspense> with an un-highlighted fallback.
 * Items are imported here (not passed in) because icon components can't cross
 * the server-to-client boundary as props.
 */
export function ActiveNavLinks({ variant }: { variant: "tabs" | "sidebar" }) {
  const pathname = usePathname();
  const items = variant === "tabs" ? TAB_BAR_ITEMS : NAV_ITEMS;
  return <NavLinks items={items} variant={variant} pathname={pathname} />;
}
