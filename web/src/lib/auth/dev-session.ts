import { createHmac, timingSafeEqual } from "node:crypto";

/** Dev sessions last a week; they only exist on local machines. */
export const DEV_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** `<userId>.<expiresAtEpochSeconds>.<hmac>` */
export function signDevSession(
  userId: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): string {
  const payload = `${userId}.${nowSeconds + DEV_SESSION_TTL_SECONDS}`;
  return `${payload}.${sign(payload, secret)}`;
}

/** Returns the user id for a valid, unexpired token; otherwise null. */
export function verifyDevSession(
  token: string | undefined,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expires, mac] = parts;
  if (!UUID.test(userId) || !/^\d+$/.test(expires)) return null;

  const expected = Buffer.from(sign(`${userId}.${expires}`, secret));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  if (Number(expires) <= nowSeconds) return null;
  return userId;
}
