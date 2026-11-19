import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NAV_ITEMS, TAB_BAR_ITEMS } from "@/lib/navigation";
import { NavLinks } from "./nav-links";

describe("NavLinks", () => {
  it("shows short labels in the tab bar", () => {
    render(<NavLinks items={TAB_BAR_ITEMS} variant="tabs" pathname="/" />);
    for (const name of ["Home", "Tasks", "Plan", "Vendors"]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
  });

  it("shows full labels in the sidebar and marks the current page", () => {
    render(<NavLinks items={NAV_ITEMS} variant="sidebar" pathname="/plan" />);
    expect(screen.getByRole("link", { name: "Floor plan" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  });

  it("highlights nothing in the prerender fallback", () => {
    render(<NavLinks items={NAV_ITEMS} variant="sidebar" pathname={null} />);
    expect(screen.queryByRole("link", { current: "page" })).not.toBeInTheDocument();
  });
});
