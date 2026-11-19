import { describe, expect, it } from "vitest";
import { MORE_MENU_ITEMS, NAV_ITEMS, TAB_BAR_ITEMS, isNavItemActive } from "./navigation";

describe("navigation config", () => {
  it("lists the six sidebar items in spec order", () => {
    expect(NAV_ITEMS.map((item) => item.label)).toEqual([
      "Dashboard",
      "Tasks",
      "Floor plan",
      "Vendors",
      "Documents",
      "Settings",
    ]);
  });

  it("puts four items in the mobile tab bar and the rest in the more menu", () => {
    expect(TAB_BAR_ITEMS.map((item) => item.shortLabel)).toEqual([
      "Home",
      "Tasks",
      "Plan",
      "Vendors",
    ]);
    expect(MORE_MENU_ITEMS.map((item) => item.label)).toEqual(["Documents", "Settings"]);
  });
});

describe("isNavItemActive", () => {
  it("keeps Dashboard active on module pages", () => {
    expect(isNavItemActive("/", "/")).toBe(true);
    expect(isNavItemActive("/", "/modules/painting")).toBe(true);
    expect(isNavItemActive("/", "/tasks")).toBe(false);
  });

  it("matches a section and its nested routes only", () => {
    expect(isNavItemActive("/vendors", "/vendors/abc")).toBe(true);
    expect(isNavItemActive("/plan", "/planner")).toBe(false);
  });

  it("matches nothing while the pathname is unknown", () => {
    expect(NAV_ITEMS.some((item) => isNavItemActive(item.href, null))).toBe(false);
  });
});
