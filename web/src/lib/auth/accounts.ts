import { eq, or, sql, type SQL } from "drizzle-orm";
import { adminDb } from "@/db/client";
import { profiles } from "@/db/schema";
import type { Identifier } from "./identifier";

/** What the server needs to know about an account to sign it in. */
export type AccountRef = {
  userId: string;
  username: string;
  email: string | null;
  mobile: string | null;
};

const columns = {
  userId: profiles.userId,
  username: profiles.username,
  email: profiles.email,
  mobile: profiles.mobile,
};

/** Looks an account up by user name, mobile or email (case-insensitive via citext). */
export async function findAccount(identifier: Identifier): Promise<AccountRef | null> {
  const column =
    identifier.kind === "email"
      ? profiles.email
      : identifier.kind === "mobile"
        ? profiles.mobile
        : profiles.username;
  const [row] = await adminDb()
    .select(columns)
    .from(profiles)
    .where(eq(column, identifier.value))
    .limit(1);
  return row ?? null;
}

/** Looks an account up by display name (case-insensitive); used by name-only login. */
export async function findAccountByDisplayName(name: string): Promise<AccountRef | null> {
  const [row] = await adminDb()
    .select(columns)
    .from(profiles)
    .where(sql`lower(${profiles.displayName}) = lower(${name.trim()})`)
    .limit(1);
  return row ?? null;
}

export async function findAccountByUserId(userId: string): Promise<AccountRef | null> {
  const [row] = await adminDb()
    .select(columns)
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return row ?? null;
}

/** Which of the given unique fields already belong to another account. */
export async function takenFields(
  fields: { username: string; email: string | null; mobile: string | null },
  exceptUserId?: string,
): Promise<{ username: boolean; email: boolean; mobile: boolean }> {
  const conditions: SQL[] = [eq(profiles.username, fields.username)];
  if (fields.email) conditions.push(eq(profiles.email, fields.email));
  if (fields.mobile) conditions.push(eq(profiles.mobile, fields.mobile));
  const rows = await adminDb()
    .select(columns)
    .from(profiles)
    .where(or(...conditions));
  const others = rows.filter((row) => row.userId !== exceptUserId);
  const lower = (v: string | null) => v?.toLowerCase() ?? null;
  return {
    username: others.some((r) => lower(r.username) === fields.username.toLowerCase()),
    email: Boolean(fields.email) && others.some((r) => lower(r.email) === lower(fields.email)),
    mobile: Boolean(fields.mobile) && others.some((r) => r.mobile === fields.mobile),
  };
}

export async function createProfile(input: {
  userId: string;
  username: string;
  email: string | null;
  mobile: string | null;
}): Promise<void> {
  await adminDb().insert(profiles).values({
    userId: input.userId,
    username: input.username,
    displayName: input.username,
    email: input.email,
    mobile: input.mobile,
  });
}
