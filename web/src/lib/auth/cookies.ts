/** Cookie names shared by the proxy, server code and actions (no Node APIs here). */
export const DEV_SESSION_COOKIE = "hs_dev_session";
export const CURRENT_HOME_COOKIE = "hs_home";

/** Supabase stores its session as `sb-<project-ref>-auth-token` (possibly chunked: `.0`, `.1`). */
export function isSupabaseAuthCookie(name: string): boolean {
  return name.startsWith("sb-") && name.includes("-auth-token");
}
