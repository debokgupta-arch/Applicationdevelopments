import { describe, expect, it } from "vitest";
import { icons } from "lucide-react";
import { DEFAULT_CHECKLIST } from "./default-checklist";
import { buildChecklistRows, seededDueDate } from "./seed-home";

describe("DEFAULT_CHECKLIST", () => {
  it("has the 14 modules from the spec, in order", () => {
    expect(DEFAULT_CHECKLIST).toHaveLength(14);
    expect(DEFAULT_CHECKLIST[0].name).toBe("Planning and setup");
    expect(DEFAULT_CHECKLIST.at(-1)?.name).toBe("Moving day and after");
  });

  it("uses only icons that exist in lucide-react", () => {
    const missing = DEFAULT_CHECKLIST.map((m) => m.icon).filter((name) => !(name in icons));
    expect(missing).toEqual([]);
  });

  it("has no duplicate task titles within a module", () => {
    for (const mod of DEFAULT_CHECKLIST) {
      const titles = mod.tasks.map((task) => task.title);
      expect(new Set(titles).size, mod.name).toBe(titles.length);
    }
  });
});

describe("seededDueDate", () => {
  const painting = { startDaysBeforeMoveIn: 10 };

  it("starts the module's window before move-in and steps forward", () => {
    expect(seededDueDate("2027-03-01", painting, 0)).toBe("2027-02-19");
    expect(seededDueDate("2027-03-01", painting, 1)).toBe("2027-02-21");
  });

  it("never schedules past move-in", () => {
    expect(seededDueDate("2027-03-01", painting, 20)).toBe("2027-03-01");
  });

  it("leaves dates empty without a move-in date", () => {
    expect(seededDueDate(null, painting, 0)).toBeNull();
  });
});

describe("buildChecklistRows", () => {
  let n = 0;
  const rows = buildChecklistRows("home-1", "2027-03-01", DEFAULT_CHECKLIST, () => `id-${n++}`);

  it("creates one row per module and task, all linked to the home", () => {
    expect(rows.moduleRows).toHaveLength(14);
    expect(rows.moduleRows.every((m) => m.homeId === "home-1")).toBe(true);
    expect(rows.parentRows.length + rows.childRows.length).toBe(110);
  });

  it("nests sub-tasks under their parent in the same module", () => {
    const prep = rows.parentRows.find((t) => t.title === "Wall preparation");
    const children = rows.childRows.filter((t) => t.parentTaskId === prep?.id);
    expect(children.map((t) => t.title)).toEqual(["Putty", "Sanding", "Primer"]);
    expect(children.every((t) => t.moduleId === prep?.moduleId)).toBe(true);
  });

  it("gives planned end dates to top-level tasks only", () => {
    expect(rows.parentRows.every((t) => typeof t.plannedEnd === "string")).toBe(true);
    expect(rows.childRows.every((t) => t.plannedEnd === undefined)).toBe(true);
  });
});
