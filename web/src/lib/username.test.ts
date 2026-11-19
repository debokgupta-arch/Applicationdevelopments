import { describe, expect, it } from "vitest";
import { USERNAME_PATTERN, usernameStem, usernameWithSuffix } from "./username";

describe("usernameStem (mirrors migration 0005)", () => {
  it.each([
    ["asha@homeshift.local", "asha"],
    ["Asha.Rao+home@example.com", "asha.raohome"],
    ["jo@example.com", "jo0"],
    ["!!!@example.com", "user"],
    ["a-very-long-email-local-part-indeed@example.com", "averylongemaillocalparti"],
  ])("%s -> %s", (input, expected) => {
    expect(usernameStem(input)).toBe(expected);
  });

  it("always produces a valid user name", () => {
    for (const input of ["x@y.z", "Δ@y.z", "first.last_99@y.z"]) {
      expect(usernameStem(input)).toMatch(USERNAME_PATTERN);
    }
  });
});

describe("usernameWithSuffix", () => {
  it("adds part of the user id and stays within 30 characters", () => {
    const name = usernameWithSuffix(
      "a-very-long-email-local-part-indeed@example.com",
      "6f1c2a1e-1b7a-4d0e-9a3b-2b1c0d9e8f7a",
    );
    expect(name).toBe("averylongemaillocalparti_6f1c2");
    expect(name).toMatch(USERNAME_PATTERN);
  });
});
