import { describe, expect, it } from "vitest";
import {
  averageProgress,
  computeProgress,
  daysLate,
  isLate,
  isOverBudget,
  overBudget,
  paintLitres,
  plannedProgress,
  rollupCost,
  rollupDates,
  spaceProgress,
} from "./hierarchy";

describe("computeProgress", () => {
  it("uses the manual override first, then done = 100", () => {
    expect(computeProgress({ status: "pending", manualProgress: 40 })).toBe(40);
    expect(computeProgress({ status: "done" })).toBe(100);
    expect(computeProgress({ status: "pending" })).toBe(0);
  });

  it("counts completed stages, ignoring skipped ones", () => {
    expect(
      computeProgress({
        status: "in_progress",
        stages: [{ status: "done" }, { status: "skipped" }, { status: "pending" }],
      }),
    ).toBe(50);
  });

  it("weights space progress by area", () => {
    const node = {
      status: "in_progress" as const,
      spaces: [
        { percent: 100, areaSqft: 300 },
        { percent: 0, areaSqft: 100 },
      ],
    };
    expect(computeProgress(node)).toBe(75);
    expect(spaceProgress([{ percent: 40 }, { percent: 80 }])).toBe(60);
  });

  it("averages line items by their stage progress", () => {
    expect(
      computeProgress({
        status: "in_progress",
        lineItems: [
          { stages: [{ status: "done" }, { status: "pending" }] },
          { status: "done" },
          { stages: [] },
        ],
      }),
    ).toBe(50);
  });

  it("falls back to sub-tasks done / total", () => {
    expect(
      computeProgress({
        status: "in_progress",
        children: [
          { status: "done" },
          { status: "pending" },
          { status: "skipped" },
          { status: "blocked" },
        ],
      }),
    ).toBeCloseTo(33.333, 2);
  });

  it("module progress averages non-skipped tasks", () => {
    expect(
      averageProgress([{ status: "done" }, { status: "pending" }, { status: "skipped" }]),
    ).toBe(50);
    expect(averageProgress([])).toBe(0);
  });
});

describe("roll-ups", () => {
  it("sums costs and spans dates across non-skipped children", () => {
    const children = [
      {
        status: "done" as const,
        expectedCost: 1000,
        actualCost: 1200,
        plannedStart: "2027-01-05",
        plannedEnd: "2027-01-10",
      },
      {
        status: "pending" as const,
        expectedCost: 500,
        actualCost: null,
        plannedStart: "2027-01-01",
        plannedEnd: "2027-01-20",
      },
      {
        status: "skipped" as const,
        expectedCost: 9999,
        actualCost: 9999,
        plannedEnd: "2027-12-31",
      },
    ];
    expect(rollupCost(children)).toEqual({ expected: 1500, actual: 1200 });
    expect(rollupDates(children)).toEqual({
      plannedStart: "2027-01-01",
      plannedEnd: "2027-01-20",
      actualStart: null,
      actualEnd: null,
    });
  });
});

describe("schedule and budget rules", () => {
  it("plannedProgress is the elapsed share of the window", () => {
    expect(plannedProgress("2027-01-01", "2027-01-11", "2027-01-06")).toBe(50);
    expect(plannedProgress("2027-01-01", "2027-01-11", "2026-12-01")).toBe(0);
    expect(plannedProgress("2027-01-01", "2027-01-11", "2027-02-01")).toBe(100);
    expect(plannedProgress(null, "2027-01-11", "2027-01-06")).toBeNull();
  });

  it("isLate: open past the planned end, or finished after it", () => {
    expect(daysLate({ status: "in_progress", plannedEnd: "2027-01-10" }, "2027-01-14")).toBe(4);
    expect(isLate({ status: "pending", plannedEnd: "2027-01-10" }, "2027-01-10")).toBe(false);
    expect(
      daysLate({ status: "done", plannedEnd: "2027-01-10", actualEnd: "2027-01-12" }, "2027-02-01"),
    ).toBe(2);
    expect(
      isLate({ status: "done", plannedEnd: "2027-01-10", actualEnd: "2027-01-09" }, "2027-02-01"),
    ).toBe(false);
    expect(isLate({ status: "skipped", plannedEnd: "2027-01-10" }, "2027-02-01")).toBe(false);
  });

  it("isOverBudget respects the tolerance", () => {
    expect(overBudget({ expectedCost: 1000, actualCost: 1200 })).toEqual({ amount: 200, pct: 20 });
    expect(isOverBudget({ expectedCost: 1000, actualCost: 1050 }, 10)).toBe(false);
    expect(isOverBudget({ expectedCost: 1000, actualCost: 1150 }, 10)).toBe(true);
    expect(isOverBudget({ expectedCost: null, actualCost: 500 })).toBe(false);
  });

  it("paint helper: area x coats / coverage", () => {
    expect(paintLitres(450, 2, 100)).toBe(9);
    expect(paintLitres(0)).toBe(0);
  });
});
