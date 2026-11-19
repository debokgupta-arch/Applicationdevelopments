import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  scrypt,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

// ---------------------------------------------------------------- passwords (local dev backend)

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 } as const;

function scryptAsync(password: string, salt: Buffer, keylen: number, options: ScryptOptions) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, keylen, options, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

/** `scrypt$N$r$p$salt$hash` (base64url). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const { N, r, p, keylen } = SCRYPT;
  const key = await scryptAsync(password, salt, keylen, { N, r, p });
  return ["scrypt", N, r, p, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [algo, n, r, p, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const key = await scryptAsync(password, Buffer.from(salt, "base64url"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

// ---------------------------------------------------------------- one-time codes and tokens

/** Six digits, uniformly random. */
export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** URL-safe single-use token for email links. */
export function generateLinkToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Codes are stored hashed (keyed with the server secret), never in plain text. */
export function hashCode(code: string, secret: string): string {
  return createHmac("sha256", secret).update(code).digest("hex");
}

export function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// ---------------------------------------------------------------- signed short-lived values

/**
 * `<base64url(json)>.<expiresAt>.<hmac>`, used for the "pending verification"
 * cookie that carries who/where between the register and verify screens.
 */
export function signValue(value: unknown, secret: string, ttlSeconds: number, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  const expires = Math.floor(now / 1000) + ttlSeconds;
  const mac = createHmac("sha256", secret).update(`${payload}.${expires}`).digest("base64url");
  return `${payload}.${expires}.${mac}`;
}

export function readSignedValue(
  token: string | undefined,
  secret: string,
  now = Date.now(),
): unknown {
  if (!token) return null;
  const [payload, expires, mac] = token.split(".");
  if (!payload || !expires || !mac) return null;
  const expected = createHmac("sha256", secret).update(`${payload}.${expires}`).digest("base64url");
  if (!sameHash(expected, mac) || Number(expires) * 1000 <= now) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

/** Short stable hash for rate-limit keys (keeps raw identifiers out of the table). */
export function fingerprint(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}
