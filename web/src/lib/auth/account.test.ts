// @vitest-environment node
import { describe, expect, it } from "vitest";
import { maskEmail, maskMobile, normalizeMobile } from "@/lib/phone";
import { registerSchema, resetSchema } from "@/lib/validation/auth";
import { hashPassword, readSignedValue, signValue, verifyPassword } from "./crypto";
import { classifyIdentifier } from "./identifier";

describe("normalizeMobile (default country India)", () => {
  it.each([
    ["98765 43210", "+919876543210"],
    ["098765-43210", "+919876543210"],
    ["+91 98765 43210", "+919876543210"],
    ["0091 9876543210", "+919876543210"],
    ["+1 (415) 555-0100", "+14155550100"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizeMobile(input)).toBe(expected);
  });

  it.each(["12345", "5876543210", "+91 12345 67890", "abc", "+1234567890123456"])(
    "rejects %s",
    (input) => {
      expect(normalizeMobile(input)).toBeNull();
    },
  );

  it("masks contacts for on-screen hints", () => {
    expect(maskMobile("+919876543210")).toBe("+91 ••••• •3210");
    expect(maskEmail("asha.rao@example.com")).toBe("as•••@example.com");
  });
});

describe("classifyIdentifier", () => {
  it("detects email, mobile and user name", () => {
    expect(classifyIdentifier(" Asha@Example.com ")).toEqual({
      kind: "email",
      value: "asha@example.com",
    });
    expect(classifyIdentifier("98765 43210")).toEqual({ kind: "mobile", value: "+919876543210" });
    expect(classifyIdentifier("Asha.Rao")).toEqual({ kind: "username", value: "asha.rao" });
  });

  it("returns null for text that can't be any of them", () => {
    expect(classifyIdentifier("")).toBeNull();
    expect(classifyIdentifier("not an email@")).toBeNull();
    expect(classifyIdentifier("ab")).toBeNull();
    expect(classifyIdentifier("bad name!")).toBeNull();
  });
});

describe("passwords and signed values", () => {
  it("hashes with a random salt and verifies only the right password", async () => {
    const a = await hashPassword("correct horse");
    const b = await hashPassword("correct horse");
    expect(a).not.toBe(b);
    expect(a.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse", a)).toBe(true);
    expect(await verifyPassword("wrong horse", a)).toBe(false);
    expect(await verifyPassword("anything", null)).toBe(false);
  });

  it("round-trips signed values and rejects tampering or expiry", () => {
    const secret = "s".repeat(40);
    const token = signValue({ channel: "mobile" }, secret, 60, 1_000_000);
    expect(readSignedValue(token, secret, 1_000_000)).toEqual({ channel: "mobile" });
    expect(readSignedValue(token, secret, 1_000_000 + 61_000)).toBeNull();
    expect(readSignedValue(token, "t".repeat(40), 1_000_000)).toBeNull();
    expect(readSignedValue(`x${token}`, secret, 1_000_000)).toBeNull();
  });
});

describe("registerSchema", () => {
  const base = {
    username: "Asha.Rao",
    mobile: "",
    email: "",
    password: "longenough",
    confirmPassword: "longenough",
  };
  const pathsOf = (input: typeof base) => {
    const r = registerSchema.safeParse(input);
    return r.success ? [] : r.error.issues.map((i) => i.path[0]);
  };

  it("needs a mobile number or an email ID", () => {
    expect(pathsOf(base)).toEqual(["email"]);
    expect(pathsOf({ ...base, email: "asha@example.com" })).toEqual([]);
    expect(pathsOf({ ...base, mobile: "98765 43210" })).toEqual([]);
  });

  it("normalises the user name and mobile", () => {
    const r = registerSchema.parse({ ...base, mobile: "98765 43210" });
    expect(r.username).toBe("asha.rao");
    expect(r.mobile).toBe("+919876543210");
  });

  it("validates user name, mobile, email and passwords", () => {
    expect(pathsOf({ ...base, email: "a@b.co", username: "ab" })).toContain("username");
    expect(pathsOf({ ...base, email: "a@b.co", username: "bad name" })).toContain("username");
    expect(pathsOf({ ...base, mobile: "12345" })).toContain("mobile");
    expect(pathsOf({ ...base, email: "nope" })).toContain("email");
    expect(
      pathsOf({ ...base, email: "a@b.co", password: "short", confirmPassword: "short" }),
    ).toContain("password");
    expect(pathsOf({ ...base, email: "a@b.co", confirmPassword: "different" })).toContain(
      "confirmPassword",
    );
  });

  it("resetSchema requires matching passwords", () => {
    expect(resetSchema.safeParse({ password: "longenough", confirmPassword: "nope" }).success).toBe(
      false,
    );
  });
});
