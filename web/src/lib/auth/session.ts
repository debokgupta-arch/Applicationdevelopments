import { cache } from "react";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { adminDb } from "@/db/client";
import { profiles } from "@/db/schema";
import { authMode, serverEnv } from "@/lib/env";
import { DEV_SESSION_COOKIE } from "./cookies";
import { getDevUser, isDevUserVerified } from "./dev-backend";
import { verifyDevSession } from "./dev-session";
import { createSupabaseServerClient } from "./supabase-server";

/** The narrow user shape the app works with. */
export type SessionUser = {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  mobile: string | null;
};

/** Profile fields for a signed-in user; null if the account has no profile yet. */
async function sessionUserFor(userId: string): Promise<SessionUser | null> {
  const [profile] = await adminDb()
    .select({
      username: profiles.username,
      displayName: profiles.displayName,
      email: profiles.email,
      mobile: profiles.mobile,
    })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return profile ? { id: userId, ...profile } : null;
}

async function readSupabaseUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user ? sessionUserFor(data.user.id) : null;
}

/** Local dev backend: signed cookie -> verified account with a profile. */
async function readDevUser(secret: string): Promise<SessionUser | null> {
  const token = (await cookies()).get(DEV_SESSION_COOKIE)?.value;
  const userId = verifyDevSession(token, secret);
  if (!userId) return null;
  const user = await getDevUser(userId);
  if (!user || !isDevUserVerified(user)) return null;
  return sessionUserFor(userId);
}

/**
 * Data Access Layer entry point: the signed-in user for this request, or null.
 * Reads cookies, so callers must sit behind a <Suspense> boundary.
 * Deduplicated per request with React cache().
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  // Session checks compare token expiry with the current time, so they must
  // run per request, never inside a (runtime) prerender.
  await connection();
  const env = serverEnv();
  switch (authMode(env)) {
    case "supabase":
      return readSupabaseUser();
    case "dev":
      return env.DEV_AUTH_SECRET ? readDevUser(env.DEV_AUTH_SECRET) : null;
    case "none":
      return null;
  }
});

/** Like getSessionUser, but sends signed-out visitors to the sign-in page. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
