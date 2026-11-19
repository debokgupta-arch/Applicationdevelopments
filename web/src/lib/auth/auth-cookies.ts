import { cookies } from "next/headers";
import { z } from "zod";
import { authSecret } from "@/lib/env";
import { DEV_SESSION_COOKIE } from "./cookies";
import { readSignedValue, signValue } from "./crypto";
import { DEV_SESSION_TTL_SECONDS, signDevSession } from "./dev-session";

const PENDING_COOKIE = "hs_pending";
const PENDING_TTL_SECONDS = 30 * 60;

/**
 * Carries an in-progress verification between screens (register -> verify,
 * OTP login, mobile password reset). Signed and httpOnly; `devCode`/`devLink`
 * are only ever set by the local dev backend.
 */
const pendingSchema = z.object({
  purpose: z.enum(["verify", "login", "reset"]),
  channel: z.enum(["email", "mobile"]),
  destination: z.string(),
  userId: z.string().nullable(),
  next: z.string().optional(),
  devCode: z.string().optional(),
  devLink: z.string().optional(),
});
export type Pending = z.infer<typeof pendingSchema>;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function setPending(pending: Pending): Promise<void> {
  (await cookies()).set(PENDING_COOKIE, signValue(pending, authSecret(), PENDING_TTL_SECONDS), {
    ...cookieOptions,
    maxAge: PENDING_TTL_SECONDS,
  });
}

export async function readPending(): Promise<Pending | null> {
  const raw = (await cookies()).get(PENDING_COOKIE)?.value;
  const parsed = pendingSchema.safeParse(readSignedValue(raw, authSecret()));
  return parsed.success ? parsed.data : null;
}

export async function clearPending(): Promise<void> {
  (await cookies()).delete(PENDING_COOKIE);
}

/** Local dev backend only: start a signed cookie session. */
export async function startDevSession(userId: string, devSecret: string): Promise<void> {
  (await cookies()).set(DEV_SESSION_COOKIE, signDevSession(userId, devSecret), {
    ...cookieOptions,
    maxAge: DEV_SESSION_TTL_SECONDS,
  });
}
