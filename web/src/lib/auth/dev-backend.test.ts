// @vitest-environment node
/**
 * Local dev auth backend and rate limiter against the real database.
 * Skipped without DATABASE_URL; needs `pnpm db:start` + `pnpm db:bootstrap`.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { inArray, sql } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";
import { adminDb, closeDb } from "@/db/client";
import {
  checkDevPassword,
  consumeDevCode,
  createDevUser,
  getDevUser,
  isDevUserVerified,
  issueDevCode,
  markDevVerified,
  setDevPassword,
} from "./dev-backend";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
const { hitRateLimit, resetRateLimit } = await import("./rate-limit");

const hasDb = Boolean(process.env.DATABASE_URL);
const SECRET = "x".repeat(40);

describe.skipIf(!hasDb)("dev auth backend", () => {
  const created: string[] = [];
  const run = crypto.randomUUID().slice(0, 8);
  let userId = "";

  beforeAll(async () => {
    userId = await createDevUser({
      email: `dev-${run}@test.local`,
      mobile: null,
      password: "first-password",
    });
    created.push(userId);
  });

  afterAll(async () => {
    await adminDb().delete(authUsers).where(inArray(authUsers.id, created));
    await closeDb();
  });

  it("stores a hashed password and checks it", async () => {
    const user = await getDevUser(userId);
    expect(user?.encryptedPassword).toMatch(/^scrypt\$/);
    expect(await checkDevPassword(userId, "first-password")).toBe(true);
    expect(await checkDevPassword(userId, "wrong")).toBe(false);
    await setDevPassword(userId, "second-password");
    expect(await checkDevPassword(userId, "second-password")).toBe(true);
  });

  it("starts unverified and becomes verified per channel", async () => {
    expect(isDevUserVerified((await getDevUser(userId))!)).toBe(false);
    await markDevVerified(userId, "email");
    const user = await getDevUser(userId);
    expect(user?.emailConfirmedAt).toBeInstanceOf(Date);
    expect(isDevUserVerified(user!)).toBe(true);
  });

  it("issues single-use codes with a 30s resend cooldown", async () => {
    const first = await issueDevCode(userId, "login_otp", "+919000000099", SECRET, "code");
    expect(first.ok).toBe(true);
    const again = await issueDevCode(userId, "login_otp", "+919000000099", SECRET, "code");
    expect(again).toMatchObject({ ok: false });
    if (!first.ok || again.ok) throw new Error("unexpected");
    expect(again.retryAfterSeconds).toBeGreaterThan(25);

    expect(first.secret).toMatch(/^\d{6}$/);
    expect(await consumeDevCode(userId, "login_otp", first.secret, SECRET)).toBe(true);
    expect(await consumeDevCode(userId, "login_otp", first.secret, SECRET)).toBe(false);
  });

  it("locks a code after 5 wrong attempts and rejects expired codes", async () => {
    await adminDb().execute(sql`delete from auth.dev_codes where user_id = ${userId}`);
    const issued = await issueDevCode(userId, "verify_mobile", "+919000000099", SECRET, "code");
    if (!issued.ok) throw new Error("not issued");
    for (let i = 0; i < 5; i++) {
      expect(await consumeDevCode(userId, "verify_mobile", "000000", SECRET)).toBe(false);
    }
    expect(await consumeDevCode(userId, "verify_mobile", issued.secret, SECRET)).toBe(false);

    await adminDb().execute(sql`delete from auth.dev_codes where user_id = ${userId}`);
    const link = await issueDevCode(
      userId,
      "reset_password",
      `dev-${run}@test.local`,
      SECRET,
      "link",
    );
    if (!link.ok) throw new Error("not issued");
    expect(link.secret.length).toBeGreaterThan(30);
    await adminDb().execute(
      sql`update auth.dev_codes set expires_at = now() - interval '1 minute' where user_id = ${userId}`,
    );
    expect(await consumeDevCode(userId, "reset_password", link.secret, SECRET)).toBe(false);
  });

  it("rate-limits by key within the window and can be reset", async () => {
    const key = `ratelimit-${run}`;
    const limit = { max: 3, windowSeconds: 60 };
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await hitRateLimit("test", key, limit));
    expect(results).toEqual([false, false, false, true]);
    await resetRateLimit("test", key);
    expect(await hitRateLimit("test", key, limit)).toBe(false);
    await resetRateLimit("test", key);
  });
});
