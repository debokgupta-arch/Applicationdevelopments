import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  /** Public origin used in magic-link / OAuth redirects, e.g. https://homeshift.app */
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
  /** Enables the local-only dev auth backend. Must never be set in production. */
  DEV_AUTH_SECRET: z.string().min(32).optional(),
  /** Signs short-lived auth cookies (pending verification). Falls back to DEV_AUTH_SECRET. */
  AUTH_SECRET: z.string().min(32).optional(),
  /** Local testing only: log in with just a name, no password. Ignored unless dev auth is on. */
  DEV_NAME_ONLY_LOGIN: z.enum(["1", "true"]).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

/** Validated server environment, parsed on first use (not at import, so builds without a DB work). */
export function serverEnv(): ServerEnv {
  if (!cached) {
    const blankToUndefined = Object.fromEntries(
      Object.entries(process.env).map(([key, value]) => [key, value === "" ? undefined : value]),
    );
    const parsed = serverEnvSchema.safeParse(blankToUndefined);
    if (!parsed.success) {
      throw new Error(`Invalid server environment:\n${z.prettifyError(parsed.error)}`);
    }
    cached = parsed.data;
  }
  return cached;
}

export type AuthMode = "supabase" | "dev" | "none";

/** Supabase wins whenever it is configured; the dev sign-in is only a local fallback. */
export function authMode(env: ServerEnv = serverEnv()): AuthMode {
  if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return "supabase";
  if (env.DEV_AUTH_SECRET) return "dev";
  return "none";
}

/** Password-free "name only" login: local dev backend plus an explicit opt-in flag. */
export function nameOnlyLogin(env: ServerEnv = serverEnv()): boolean {
  return authMode(env) === "dev" && env.DEV_NAME_ONLY_LOGIN !== undefined;
}

/** Secret for signing auth cookies; throws when neither secret is configured. */
export function authSecret(env: ServerEnv = serverEnv()): string {
  const secret = env.AUTH_SECRET ?? env.DEV_AUTH_SECRET;
  if (!secret) throw new Error("Set AUTH_SECRET (or DEV_AUTH_SECRET locally) in .env.local.");
  return secret;
}
