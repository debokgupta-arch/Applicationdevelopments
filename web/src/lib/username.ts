/** User names: 3-30 chars of lowercase letters, digits, "." and "_" (v2 spec section 1). */
export const USERNAME_PATTERN = /^[a-z0-9._]{3,30}$/;

/**
 * Same rule as migration 0005: the email's local part (or any text), lowercased,
 * stripped to allowed characters, padded to 3 and capped at 24 so a suffix fits.
 */
export function usernameStem(source: string): string {
  const cleaned =
    source
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, "") || "user";
  return cleaned.padEnd(3, "0").slice(0, 24);
}

/** A stem plus a short suffix from the user id, for when the bare stem is taken. */
export function usernameWithSuffix(source: string, userId: string): string {
  return `${usernameStem(source)}_${userId.replace(/-/g, "").slice(0, 5)}`;
}
