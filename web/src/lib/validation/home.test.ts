import { describe, expect, it } from "vitest";
import { homeSchema, type HomeInput } from "./home";

const valid: HomeInput = {
  name: "  Palm Grove 3BHK ",
  address: `Flat 704, Tower B
Whitefield, Bengaluru`,
  buildingName: "",
  floorLabel: "7",
  bhk: "3 BHK",
  possessionDate: "2027-01-01",
  moveInDate: "2027-02-15",
  totalBudget: 800000,
  currency: "INR",
};

const firstError = (input: HomeInput) => {
  const result = homeSchema.safeParse(input);
  return result.success ? null : result.error.issues[0];
};

describe("homeSchema", () => {
  it("accepts a complete home and trims the name", () => {
    const result = homeSchema.parse(valid);
    expect(result.name).toBe("Palm Grove 3BHK");
  });

  it("treats building, possession date and budget as optional", () => {
    expect(
      homeSchema.safeParse({
        ...valid,
        buildingName: "",
        possessionDate: "",
        totalBudget: undefined,
      }).success,
    ).toBe(true);
  });

  it("requires a name, an address and a move-in date", () => {
    expect(firstError({ ...valid, name: "   " })?.path).toEqual(["name"]);
    expect(firstError({ ...valid, address: "  " })?.path).toEqual(["address"]);
    expect(firstError({ ...valid, moveInDate: "" })?.path).toEqual(["moveInDate"]);
  });

  it("rejects move-in before possession", () => {
    const issue = firstError({ ...valid, moveInDate: "2026-12-01" });
    expect(issue?.path).toEqual(["moveInDate"]);
  });

  it("rejects negative budgets and unknown currencies", () => {
    expect(firstError({ ...valid, totalBudget: -1 })?.path).toEqual(["totalBudget"]);
    expect(
      homeSchema.safeParse({ ...valid, currency: "XYZ" as HomeInput["currency"] }).success,
    ).toBe(false);
  });
});
