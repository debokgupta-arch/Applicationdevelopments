import { z } from "zod";
import { looksLikePhone, normalizeMobile } from "@/lib/phone";
import { USERNAME_PATTERN } from "@/lib/username";

export type Identifier =
  | { kind: "email"; value: string }
  | { kind: "mobile"; value: string }
  | { kind: "username"; value: string };

/**
 * Login accepts "user name, mobile number or email ID" in one field.
 * Returns null when the text can't be any of them.
 */
export function classifyIdentifier(raw: string): Identifier | null {
  const text = raw.trim();
  if (!text) return null;
  if (text.includes("@")) {
    const email = z.email().safeParse(text.toLowerCase());
    return email.success ? { kind: "email", value: email.data } : null;
  }
  if (looksLikePhone(text)) {
    const mobile = normalizeMobile(text);
    return mobile ? { kind: "mobile", value: mobile } : null;
  }
  const username = text.toLowerCase();
  return USERNAME_PATTERN.test(username) ? { kind: "username", value: username } : null;
}
