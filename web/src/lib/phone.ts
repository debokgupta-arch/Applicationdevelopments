/**
 * Minimal E.164 handling (no extra library). Default country comes from
 * NEXT_PUBLIC_DEFAULT_COUNTRY_CODE (digits only, default "91" = India).
 */
export const DEFAULT_COUNTRY_CODE = (process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE ?? "91").replace(
  /\D/g,
  "",
);

/** True when the text looks like a phone number rather than a user name. */
export function looksLikePhone(raw: string): boolean {
  return /^\+?[\d\s\-().]{7,20}$/.test(raw.trim()) && /\d{7,}/.test(raw.replace(/\D/g, ""));
}

/**
 * Normalises to E.164 (+<country><number>), or returns null if it can't be a
 * valid mobile number. National numbers get the default country code; for
 * India (+91) the subscriber number must be 10 digits starting 6-9.
 */
export function normalizeMobile(raw: string, countryCode = DEFAULT_COUNTRY_CODE): string | null {
  const trimmed = raw.trim();
  if (!looksLikePhone(trimmed)) return null;
  let digits = trimmed.replace(/\D/g, "");
  let international = trimmed.startsWith("+");
  if (!international && digits.startsWith("00")) {
    digits = digits.slice(2);
    international = true;
  }
  if (!international) {
    digits = countryCode + digits.replace(/^0+/, "");
  }
  if (digits.length < 8 || digits.length > 15) return null;
  if (digits.startsWith("91") && !/^91[6-9]\d{9}$/.test(digits)) return null;
  return `+${digits}`;
}

/** "+919000000010" -> "+91 ••••• •0010" for on-screen hints. */
export function maskMobile(e164: string): string {
  return `${e164.slice(0, 3)} ••••• •${e164.slice(-4)}`;
}

/** "asha.rao@example.com" -> "as•••@example.com" */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 2)}•••@${domain ?? ""}`;
}
