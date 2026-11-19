import { and, count, eq, gt, lt } from "drizzle-orm";
import { headers } from "next/headers";
import { adminDb } from "@/db/client";
import { authRateLimits } from "@/db/schema";
import { fingerprint } from "./crypto";

export type Limit = { max: number; windowSeconds: number };

/** Defaults: per identifier/destination, and per client IP. */
export const LIMITS = {
  loginPerIdentifier: { max: 5, windowSeconds: 15 * 60 },
  loginPerIp: { max: 30, windowSeconds: 15 * 60 },
  sendCodePerDestination: { max: 5, windowSeconds: 60 * 60 },
  sendCodePerIp: { max: 20, windowSeconds: 60 * 60 },
} as const satisfies Record<string, Limit>;

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/**
 * Records one event for `key` and reports whether the limit is now exceeded.
 * Keys are hashed so raw emails/phones never sit in the table. Old rows for
 * the key are pruned as a side effect.
 */
export async function hitRateLimit(scope: string, key: string, limit: Limit): Promise<boolean> {
  const db = adminDb();
  const hashed = `${scope}:${fingerprint(key)}`;
  const since = new Date(Date.now() - limit.windowSeconds * 1000);
  await db
    .delete(authRateLimits)
    .where(and(eq(authRateLimits.key, hashed), lt(authRateLimits.createdAt, since)));
  await db.insert(authRateLimits).values({ key: hashed });
  const [row] = await db
    .select({ n: count() })
    .from(authRateLimits)
    .where(and(eq(authRateLimits.key, hashed), gt(authRateLimits.createdAt, since)));
  return (row?.n ?? 0) > limit.max;
}

/** Clears a key after a successful sign-in so earlier typos don't count against the user. */
export async function resetRateLimit(scope: string, key: string): Promise<void> {
  await adminDb()
    .delete(authRateLimits)
    .where(eq(authRateLimits.key, `${scope}:${fingerprint(key)}`));
}
