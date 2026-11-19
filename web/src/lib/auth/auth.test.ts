// @vitest-environment node
import { describe, expect, it } from "vitest";
import { authMode, type ServerEnv } from "@/lib/env";
import { DEV_SESSION_TTL_SECONDS, signDevSession, verifyDevSession } from "./dev-session";
import { isSupabaseAuthCookie } from "./cookies";
import { safeNextPath } from "./safe-next";

const SECRET = "x".repeat(40);
const USER = "6f1c2a1e-1b7a-4d0e-9a3b-2b1c0d9e8f7a";
const NOW = 1_800_000_000;

describe("dev session tokens", () => {
  it("round-trips a valid token", () => {
    expect(verifyDevSession(signDevSession(USER, SECRET, NOW), SECRET, NOW + 60)).toBe(USER);
  });

  it("rejects expired, tampered, foreign and malformed tokens", () => {
    const token = signDevSession(USER, SECRET, NOW);
    expect(verifyDevSession(token, SECRET, NOW + DEV_SESSION_TTL_SECONDS + 1)).toBeNull();
    expect(verifyDevSession(token.replace(USER, crypto.randomUUID()), SECRET, NOW)).toBeNull();
    expect(verifyDevSession(token, "y".repeat(40), NOW)).toBeNull();
    expect(verifyDevSession("not-a-token", SECRET, NOW)).toBeNull();
    expect(verifyDevSession(undefined, SECRET, NOW)).toBeNull();
  });
});

describe("safeNextPath", () => {
  it.each([
    ["/modules/abc?x=1", "/modules/abc?x=1"],
    [null, "/"],
    ["https://evil.example", "/"],
    ["//evil.example", "/"],
    ["/\\evil.example", "/"],
    ["javascript:alert(1)", "/"],
  ])("%s -> %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });
});

describe("authMode", () => {
  const base: ServerEnv = { DATABASE_URL: "postgres://localhost/x" };

  it("prefers Supabase whenever it is configured", () => {
    expect(
      authMode({
        ...base,
        NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "k",
        DEV_AUTH_SECRET: SECRET,
      }),
    ).toBe("supabase");
  });

  it("falls back to dev sign-in, then to none", () => {
    expect(authMode({ ...base, DEV_AUTH_SECRET: SECRET })).toBe("dev");
    expect(authMode(base)).toBe("none");
  });
});

describe("isSupabaseAuthCookie", () => {
  it("matches plain and chunked Supabase cookies only", () => {
    expect(isSupabaseAuthCookie("sb-abcd-auth-token")).toBe(true);
    expect(isSupabaseAuthCookie("sb-abcd-auth-token.0")).toBe(true);
    expect(isSupabaseAuthCookie("hs_home")).toBe(false);
  });
});
