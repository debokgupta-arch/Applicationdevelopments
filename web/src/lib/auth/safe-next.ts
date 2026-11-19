/**
 * Where to send the user after sign-in. Only same-site absolute paths are
 * allowed, so a crafted `?next=` can't bounce them to another origin.
 */
export function safeNextPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(raw)) return fallback;
  return raw;
}
