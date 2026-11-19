/**
 * LOCAL DEVELOPMENT auth backend. Stands in for Supabase Auth when no Supabase
 * project is configured: password hashes and one-time codes live in the local
 * shim's auth schema (scripts/sql/local-supabase-shim.sql), which never exists
 * on a real Supabase project. Nothing is emailed or texted; codes and links are
 * returned to the caller so the UI can show them in a "dev mode" box.
 */
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { integer, pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { adminDb } from "@/db/client";
import {
  generateLinkToken,
  generateOtp,
  hashCode,
  hashPassword,
  sameHash,
  verifyPassword,
} from "./crypto";

const auth = pgSchema("auth");

/** The columns of the local auth.users this backend reads and writes. */
const devUsers = auth.table("users", {
  id: uuid("id").primaryKey(),
  email: text("email"),
  phone: text("phone"),
  encryptedPassword: text("encrypted_password"),
  emailConfirmedAt: timestamp("email_confirmed_at", { withTimezone: true }),
  phoneConfirmedAt: timestamp("phone_confirmed_at", { withTimezone: true }),
});

const devCodes = auth.table("dev_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  purpose: text("purpose").$type<CodePurpose>().notNull(),
  destination: text("destination").notNull(),
  codeHash: text("code_hash").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CodePurpose = "verify_email" | "verify_mobile" | "login_otp" | "reset_password";
export type Channel = "email" | "mobile";

export const RESEND_COOLDOWN_SECONDS = 30;
const MAX_ATTEMPTS = 5;
const CODE_TTL_SECONDS = 10 * 60;
const LINK_TTL_SECONDS = 24 * 60 * 60;

export type DevUser = typeof devUsers.$inferSelect;

export async function createDevUser(input: {
  email: string | null;
  mobile: string | null;
  password: string;
}): Promise<string> {
  const [row] = await adminDb()
    .insert(devUsers)
    .values({
      id: crypto.randomUUID(),
      email: input.email,
      phone: input.mobile,
      encryptedPassword: await hashPassword(input.password),
    })
    .returning({ id: devUsers.id });
  return row.id;
}

export async function getDevUser(userId: string): Promise<DevUser | null> {
  const [row] = await adminDb().select().from(devUsers).where(eq(devUsers.id, userId)).limit(1);
  return row ?? null;
}

export async function checkDevPassword(userId: string, password: string): Promise<boolean> {
  const user = await getDevUser(userId);
  return verifyPassword(password, user?.encryptedPassword ?? null);
}

export async function setDevPassword(userId: string, password: string): Promise<void> {
  await adminDb()
    .update(devUsers)
    .set({ encryptedPassword: await hashPassword(password) })
    .where(eq(devUsers.id, userId));
}

export async function markDevVerified(userId: string, channel: Channel): Promise<void> {
  const now = new Date();
  await adminDb()
    .update(devUsers)
    .set(channel === "email" ? { emailConfirmedAt: now } : { phoneConfirmedAt: now })
    .where(eq(devUsers.id, userId));
}

export function isDevUserVerified(user: DevUser): boolean {
  return Boolean(user.emailConfirmedAt || user.phoneConfirmedAt);
}

export type IssuedCode =
  { ok: true; secret: string; kind: "code" | "link" } | { ok: false; retryAfterSeconds: number };

/**
 * Issues a 6-digit code (or a link token for email verification / reset),
 * enforcing the 30s resend cooldown. Earlier unused codes for the same purpose
 * are invalidated.
 */
export async function issueDevCode(
  userId: string,
  purpose: CodePurpose,
  destination: string,
  secret: string,
  kind: "code" | "link",
): Promise<IssuedCode> {
  const db = adminDb();
  const [last] = await db
    .select({ createdAt: devCodes.createdAt })
    .from(devCodes)
    .where(and(eq(devCodes.userId, userId), eq(devCodes.purpose, purpose)))
    .orderBy(desc(devCodes.createdAt))
    .limit(1);
  if (last) {
    const elapsed = (Date.now() - last.createdAt.getTime()) / 1000;
    if (elapsed < RESEND_COOLDOWN_SECONDS) {
      return { ok: false, retryAfterSeconds: Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed) };
    }
  }
  await db
    .update(devCodes)
    .set({ consumedAt: new Date() })
    .where(
      and(eq(devCodes.userId, userId), eq(devCodes.purpose, purpose), isNull(devCodes.consumedAt)),
    );

  const plain = kind === "code" ? generateOtp() : generateLinkToken();
  const ttl = kind === "code" ? CODE_TTL_SECONDS : LINK_TTL_SECONDS;
  await db.insert(devCodes).values({
    userId,
    purpose,
    destination,
    codeHash: hashCode(plain, secret),
    expiresAt: new Date(Date.now() + ttl * 1000),
  });
  console.info(
    `[dev auth] ${purpose} for ${destination}: ${kind === "code" ? plain : "(link issued)"}`,
  );
  return { ok: true, secret: plain, kind };
}

/** Checks and consumes the latest live code; counts failed attempts (max 5). */
export async function consumeDevCode(
  userId: string,
  purpose: CodePurpose,
  code: string,
  secret: string,
): Promise<boolean> {
  const db = adminDb();
  const [live] = await db
    .select()
    .from(devCodes)
    .where(
      and(
        eq(devCodes.userId, userId),
        eq(devCodes.purpose, purpose),
        isNull(devCodes.consumedAt),
        gt(devCodes.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(devCodes.createdAt))
    .limit(1);
  if (!live || live.attempts >= MAX_ATTEMPTS) return false;

  if (!sameHash(hashCode(code, secret), live.codeHash)) {
    await db
      .update(devCodes)
      .set({ attempts: live.attempts + 1 })
      .where(eq(devCodes.id, live.id));
    return false;
  }
  await db.update(devCodes).set({ consumedAt: new Date() }).where(eq(devCodes.id, live.id));
  return true;
}
