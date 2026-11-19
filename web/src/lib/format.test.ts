import { describe, expect, it } from "vitest";
import { clampPercent, formatLongToday, formatShortDate, initialsOf } from "./format";

describe("clampPercent", () => {
  it.each([
    [-5, 0],
    [0, 0],
    [37.6, 38],
    [100, 100],
    [140, 100],
    [Number.NaN, 0],
  ])("%s -> %s", (input, expected) => {
    expect(clampPercent(input)).toBe(expected);
  });
});

describe("initialsOf", () => {
  it("uses first and last name initials", () => {
    expect(initialsOf("Asha Rao")).toBe("AR");
    expect(initialsOf("  asha  devi rao ")).toBe("AR");
  });

  it("handles single names and blanks", () => {
    expect(initialsOf("madonna")).toBe("M");
    expect(initialsOf("   ")).toBe("?");
  });
});

describe("dates", () => {
  it("formats ISO dates without timezone drift", () => {
    expect(formatShortDate("2027-01-15")).toBe("15 Jan 2027");
  });

  it("formats today as weekday, day month", () => {
    expect(formatLongToday(new Date(2026, 10, 18))).toBe("Wednesday, 18 November");
  });
});
