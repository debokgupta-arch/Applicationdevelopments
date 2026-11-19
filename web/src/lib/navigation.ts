import {
  FileText,
  LayoutDashboard,
  ListChecks,
  PencilRuler,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { copy } from "./copy";

export type NavHref = "/" | "/tasks" | "/plan" | "/vendors" | "/documents" | "/settings";

export type NavItem = {
  href: NavHref;
  /** Sidebar label (desktop). */
  label: string;
  /** Bottom-tab label (mobile). */
  shortLabel: string;
  icon: LucideIcon;
  /** Shown in the mobile bottom tab bar; otherwise it lives in the mobile "more" menu. */
  inTabBar: boolean;
};

export const NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/",
    label: copy.nav.dashboard,
    shortLabel: copy.nav.home,
    icon: LayoutDashboard,
    inTabBar: true,
  },
  {
    href: "/tasks",
    label: copy.nav.tasks,
    shortLabel: copy.nav.tasks,
    icon: ListChecks,
    inTabBar: true,
  },
  {
    href: "/plan",
    label: copy.nav.floorPlan,
    shortLabel: copy.nav.plan,
    icon: PencilRuler,
    inTabBar: true,
  },
  {
    href: "/vendors",
    label: copy.nav.vendors,
    shortLabel: copy.nav.vendors,
    icon: Users,
    inTabBar: true,
  },
  {
    href: "/documents",
    label: copy.nav.documents,
    shortLabel: copy.nav.documents,
    icon: FileText,
    inTabBar: false,
  },
  {
    href: "/settings",
    label: copy.nav.settings,
    shortLabel: copy.nav.settings,
    icon: Settings,
    inTabBar: false,
  },
];

export const TAB_BAR_ITEMS = NAV_ITEMS.filter((item) => item.inTabBar);
export const MORE_MENU_ITEMS = NAV_ITEMS.filter((item) => !item.inTabBar);

/** Module pages are opened from the dashboard, so they keep Dashboard highlighted. */
export function isNavItemActive(href: NavHref, pathname: string | null): boolean {
  if (pathname === null) return false;
  if (href === "/") return pathname === "/" || pathname.startsWith("/modules/");
  return pathname === href || pathname.startsWith(`${href}/`);
}
