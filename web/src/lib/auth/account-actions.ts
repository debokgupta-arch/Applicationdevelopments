"use server";

/**
 * Register, verify, log in (password or OTP), forgot/reset password, profile.
 * Every action validates with Zod on the server, rate-limits where abuse is
 * possible, and never reveals whether an identifier belongs to an account.
 * Two backends: Supabase Auth when configured, otherwise the local dev backend.
 */
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { withUser } from "@/db/client";
import { profiles } from "@/db/schema";
import { copy } from "@/lib/copy";
import { authMode, nameOnlyLogin, serverEnv, type ServerEnv } from "@/lib/env";
import {
  forgotSchema,
  loginSchema,
  nameLoginSchema,
  mobileSchema,
  otpSchema,
  profileSchema,
  registerSchema,
  resetSchema,
} from "@/lib/validation/auth";
import {
  createProfile,
  findAccount,
  findAccountByDisplayName,
  findAccountByUserId,
  takenFields,
} from "./accounts";
import {
  clearPending,
  readPending,
  setPending,
  startDevSession,
  type Pending,
} from "./auth-cookies";
import { hashPassword, verifyPassword } from "./crypto";
import {
  checkDevPassword,
  consumeDevCode,
  createDevUser,
  getDevUser,
  isDevUserVerified,
  issueDevCode,
  markDevVerified,
  setDevPassword,
  type Channel,
  type CodePurpose,
} from "./dev-backend";
import { classifyIdentifier } from "./identifier";
import { LIMITS, clientIp, hitRateLimit, resetRateLimit } from "./rate-limit";
import { safeNextPath } from "./safe-next";
import { requireUser } from "./session";
import {
  sbResendSignup,
  sbSendResetEmail,
  sbSendSmsCode,
  sbSignInWithPassword,
  sbSignUp,
  sbUpdatePassword,
  sbVerifySms,
} from "./supabase-backend";

const t = copy.account;

export type FormState =
  | { status: "idle" }
  | { status: "error"; message?: string; fieldErrors?: Record<string, string> }
  | { status: "done"; message: string; devCode?: string; devLink?: string };

const fail = (message: string, fieldErrors?: Record<string, string>): FormState => ({
  status: "error",
  message,
  fieldErrors,
});

function fieldErrorsOf(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const issue of issues) out[String(issue.path[0] ?? "form")] ??= issue.message;
  return out;
}

async function origin(env: ServerEnv): Promise<string> {
  if (env.NEXT_PUBLIC_SITE_URL) return env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function contactOf(channel: Channel, destination: string) {
  return channel === "email"
    ? ({ channel, email: destination } as const)
    : ({ channel, phone: destination } as const);
}

/** Dev backend: issue a code or link and describe it for the dev outbox. */
async function devIssue(
  env: ServerEnv,
  userId: string,
  purpose: CodePurpose,
  destination: string,
  kind: "code" | "link",
  linkPath?: string,
): Promise<{ devCode?: string; devLink?: string } | { cooldown: number }> {
  const secret = env.DEV_AUTH_SECRET ?? "";
  const issued = await issueDevCode(userId, purpose, destination, secret, kind);
  if (!issued.ok) return { cooldown: issued.retryAfterSeconds };
  if (kind === "code") return { devCode: issued.secret };
  const url = new URL(linkPath ?? "/", await origin(env));
  url.searchParams.set("u", userId);
  url.searchParams.set("t", issued.secret);
  return { devLink: url.toString() };
}

/** Starts verification for a new or unverified account and goes to /verify. */
async function beginVerification(
  env: ServerEnv,
  userId: string,
  channel: Channel,
  destination: string,
  next?: string,
): Promise<never> {
  const pending: Pending = { purpose: "verify", channel, destination, userId, next };
  if (authMode(env) === "dev") {
    const delivered = await devIssue(
      env,
      userId,
      channel === "email" ? "verify_email" : "verify_mobile",
      destination,
      channel === "email" ? "link" : "code",
      "/auth/verify-email",
    );
    if (!("cooldown" in delivered)) Object.assign(pending, delivered);
  }
  await setPending(pending);
  redirect("/verify");
}

async function finishSignIn(userId: string, next: string | undefined): Promise<never> {
  const env = serverEnv();
  if (authMode(env) === "dev" && env.DEV_AUTH_SECRET) {
    await startDevSession(userId, env.DEV_AUTH_SECRET);
  }
  await clearPending();
  revalidatePath("/", "layout");
  redirect(safeNextPath(next));
}

// ---------------------------------------------------------------- register

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(t.errors.generic, fieldErrorsOf(parsed.error.issues));
  const v = parsed.data;
  const email = v.email || null;
  const mobile = v.mobile || null;

  if (await hitRateLimit("register-ip", await clientIp(), LIMITS.sendCodePerIp)) {
    return fail(t.errors.tooMany);
  }
  const taken = await takenFields({ username: v.username, email, mobile });
  if (taken.username || taken.email || taken.mobile) {
    const fieldErrors: Record<string, string> = {};
    if (taken.username) fieldErrors.username = t.errors.usernameTaken;
    if (taken.email) fieldErrors.email = t.errors.emailTaken;
    if (taken.mobile) fieldErrors.mobile = t.errors.mobileTaken;
    return fail(t.errors.generic, fieldErrors);
  }

  // A mobile number is verified by OTP straight away; otherwise the email by link.
  const channel: Channel = mobile ? "mobile" : "email";
  const destination = (mobile ?? email) as string;
  const env = serverEnv();

  let userId: string;
  switch (authMode(env)) {
    case "dev":
      userId = await createDevUser({ email, mobile, password: v.password });
      break;
    case "supabase": {
      const result = await sbSignUp(
        contactOf(channel, destination),
        v.password,
        { username: v.username },
        `${await origin(env)}/auth/callback?next=/`,
      );
      if ("error" in result) return fail(t.errors.generic);
      userId = result.userId;
      break;
    }
    case "none":
      return fail(t.errors.notConfigured);
  }
  await createProfile({ userId, username: v.username, email, mobile });

  // Local backend: no OTP / verification step; the new account is signed straight in.
  if (authMode(env) === "dev") {
    await markDevVerified(userId, channel);
    return finishSignIn(userId, "/onboarding");
  }

  if (authMode(env) === "supabase") {
    await setPending({ purpose: "verify", channel, destination, userId });
    redirect("/verify");
  }
  return beginVerification(env, userId, channel, destination);
}

// ---------------------------------------------------------------- verify + resend

export async function verifyMobileCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = otpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(t.errors.code, fieldErrorsOf(parsed.error.issues));
  const pending = await readPending();
  if (!pending || pending.channel !== "mobile") return fail(t.verify.expired);
  const env = serverEnv();
  const code = parsed.data.code;

  if (pending.purpose === "verify" || pending.purpose === "login") {
    if (await hitRateLimit("verify", pending.destination, LIMITS.loginPerIdentifier)) {
      return fail(t.errors.tooMany);
    }
    let ok = false;
    if (authMode(env) === "dev" && pending.userId && env.DEV_AUTH_SECRET) {
      const purpose = pending.purpose === "verify" ? "verify_mobile" : "login_otp";
      ok = await consumeDevCode(pending.userId, purpose, code, env.DEV_AUTH_SECRET);
      // A correct login OTP also proves the number belongs to the user.
      if (ok) await markDevVerified(pending.userId, "mobile");
    } else if (authMode(env) === "supabase") {
      ok = await sbVerifySms(pending.destination, code);
    }
    if (!ok || !pending.userId) return fail(t.errors.wrongCode, { code: t.errors.wrongCode });
    await resetRateLimit("verify", pending.destination);
    return finishSignIn(pending.userId, pending.next);
  }
  return fail(t.verify.expired);
}

export async function resendCode(): Promise<FormState> {
  const pending = await readPending();
  if (!pending) return fail(t.verify.expired);
  const env = serverEnv();
  if (await hitRateLimit("send", pending.destination, LIMITS.sendCodePerDestination)) {
    return fail(t.errors.tooMany);
  }

  if (authMode(env) === "dev") {
    if (!pending.userId) return { status: "done", message: t.verify.resent };
    const purpose: CodePurpose =
      pending.purpose === "login"
        ? "login_otp"
        : pending.purpose === "reset"
          ? "reset_password"
          : pending.channel === "email"
            ? "verify_email"
            : "verify_mobile";
    const delivered = await devIssue(
      env,
      pending.userId,
      purpose,
      pending.destination,
      pending.channel === "email" ? "link" : "code",
      purpose === "reset_password" ? "/reset-password" : "/auth/verify-email",
    );
    if ("cooldown" in delivered) return fail(t.errors.cooldown(delivered.cooldown));
    await setPending({ ...pending, ...delivered });
    return { status: "done", message: t.verify.resent, ...delivered };
  }

  if (authMode(env) === "supabase") {
    if (pending.purpose === "verify") {
      await sbResendSignup(
        contactOf(pending.channel, pending.destination),
        `${await origin(env)}/auth/callback?next=/`,
      );
    } else if (pending.channel === "mobile") {
      await sbSendSmsCode(pending.destination);
    }
  }
  return { status: "done", message: t.verify.resent };
}

// ---------------------------------------------------------------- login

/** Hash checked for unknown identifiers so response time doesn't reveal existence. */
const DUMMY_HASH = hashPassword("not-a-real-password");

export async function loginWithPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(t.errors.generic, fieldErrorsOf(parsed.error.issues));
  const { identifier, password, next } = parsed.data;

  const ip = await clientIp();
  if (
    (await hitRateLimit("login-id", identifier.toLowerCase(), LIMITS.loginPerIdentifier)) ||
    (await hitRateLimit("login-ip", ip, LIMITS.loginPerIp))
  ) {
    return fail(t.errors.tooMany);
  }

  const ident = classifyIdentifier(identifier);
  const account = ident ? await findAccount(ident) : null;
  const env = serverEnv();

  if (authMode(env) === "dev") {
    if (!account) {
      await verifyPassword(password, await DUMMY_HASH);
      return fail(t.errors.invalidCredentials);
    }
    if (!(await checkDevPassword(account.userId, password))) {
      return fail(t.errors.invalidCredentials);
    }
    await resetRateLimit("login-id", identifier.toLowerCase());
    const user = await getDevUser(account.userId);
    if (user && !isDevUserVerified(user)) {
      const channel: Channel = account.mobile ? "mobile" : "email";
      return beginVerification(
        env,
        account.userId,
        channel,
        (account.mobile ?? account.email) as string,
        next,
      );
    }
    return finishSignIn(account.userId, next);
  }

  if (authMode(env) === "supabase") {
    if (!account) return fail(t.errors.invalidCredentials);
    const contact = account.email
      ? contactOf("email", account.email)
      : contactOf("mobile", account.mobile as string);
    const result = await sbSignInWithPassword(contact, password);
    if (result === "invalid") return fail(t.errors.invalidCredentials);
    await resetRateLimit("login-id", identifier.toLowerCase());
    if (result === "unconfirmed") {
      await setPending({
        purpose: "verify",
        channel: contact.channel,
        destination: contact.channel === "email" ? contact.email : contact.phone,
        userId: account.userId,
        next,
      });
      redirect("/verify");
    }
    return finishSignIn(account.userId, next);
  }
  return fail(t.errors.notConfigured);
}

/**
 * Local testing only (DEV_NAME_ONLY_LOGIN): signs in with just a name, user
 * name, mobile or email, with no password. Read-only: nothing is written to the DB.
 */
export async function loginWithName(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!nameOnlyLogin()) return fail(t.errors.notConfigured);
  const parsed = nameLoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(t.errors.generic, fieldErrorsOf(parsed.error.issues));
  const { name, next } = parsed.data;
  const ident = classifyIdentifier(name);
  const account =
    (ident ? await findAccount(ident) : null) ?? (await findAccountByDisplayName(name));
  if (!account) return fail(t.login.nameNotFound);
  return finishSignIn(account.userId, next);
}

export async function sendLoginOtp(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = mobileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(t.errors.mobile, fieldErrorsOf(parsed.error.issues));
  const mobile = parsed.data.mobile;
  if (
    (await hitRateLimit("send", mobile, LIMITS.sendCodePerDestination)) ||
    (await hitRateLimit("send-ip", await clientIp(), LIMITS.sendCodePerIp))
  ) {
    return fail(t.errors.tooMany);
  }

  const account = await findAccount({ kind: "mobile", value: mobile });
  const next = String(formData.get("next") ?? "") || undefined;
  const pending: Pending = {
    purpose: "login",
    channel: "mobile",
    destination: mobile,
    userId: account?.userId ?? null,
    next,
  };
  const env = serverEnv();
  if (authMode(env) === "dev" && account) {
    const delivered = await devIssue(env, account.userId, "login_otp", mobile, "code");
    if ("cooldown" in delivered) return fail(t.errors.cooldown(delivered.cooldown));
    Object.assign(pending, delivered);
  } else if (authMode(env) === "supabase") {
    await sbSendSmsCode(mobile);
  }
  await setPending(pending);
  // Same response whether or not the number is registered.
  return { status: "done", message: t.login.otpSent, devCode: pending.devCode };
}

// ---------------------------------------------------------------- forgot / reset

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = forgotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(t.errors.generic, fieldErrorsOf(parsed.error.issues));
  const raw = parsed.data.identifier;
  if (
    (await hitRateLimit("forgot", raw.toLowerCase(), LIMITS.sendCodePerDestination)) ||
    (await hitRateLimit("send-ip", await clientIp(), LIMITS.sendCodePerIp))
  ) {
    return fail(t.errors.tooMany);
  }

  const ident = classifyIdentifier(raw);
  const account = ident ? await findAccount(ident) : null;
  const sent: FormState = { status: "done", message: t.forgot.sent };
  if (!ident || !account) return sent;

  // Typed a mobile number -> SMS code; otherwise the email link if there is one.
  const channel: Channel = ident.kind === "mobile" || !account.email ? "mobile" : "email";
  const destination = (channel === "email" ? account.email : account.mobile) as string;
  if (!destination) return sent;
  const env = serverEnv();

  if (authMode(env) === "dev") {
    const delivered = await devIssue(
      env,
      account.userId,
      "reset_password",
      destination,
      channel === "email" ? "link" : "code",
      "/reset-password",
    );
    if ("cooldown" in delivered) return fail(t.errors.cooldown(delivered.cooldown));
    if (channel === "mobile") {
      await setPending({
        purpose: "reset",
        channel,
        destination,
        userId: account.userId,
        ...delivered,
      });
      redirect("/reset-password");
    }
    return { ...sent, ...delivered };
  }

  if (authMode(env) === "supabase") {
    if (channel === "email") {
      await sbSendResetEmail(
        destination,
        `${await origin(env)}/auth/callback?next=/reset-password`,
      );
      return sent;
    }
    await sbSendSmsCode(destination);
    await setPending({ purpose: "reset", channel, destination, userId: account.userId });
    redirect("/reset-password");
  }
  return sent;
}

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(t.errors.generic, fieldErrorsOf(parsed.error.issues));
  const { password, code } = parsed.data;
  const linkUser = String(formData.get("u") ?? "");
  const linkToken = String(formData.get("t") ?? "");
  const env = serverEnv();
  const pending = await readPending();

  if (authMode(env) === "dev" && env.DEV_AUTH_SECRET) {
    let userId: string | null = null;
    let channel: Channel = "email";
    if (linkUser && linkToken) {
      if (await consumeDevCode(linkUser, "reset_password", linkToken, env.DEV_AUTH_SECRET)) {
        userId = linkUser;
      }
    } else if (pending?.purpose === "reset" && pending.userId && code) {
      if (await consumeDevCode(pending.userId, "reset_password", code, env.DEV_AUTH_SECRET)) {
        userId = pending.userId;
        channel = "mobile";
      }
    }
    if (!userId) return fail(t.reset.invalid, code ? { code: t.errors.wrongCode } : undefined);
    await setDevPassword(userId, password);
    await markDevVerified(userId, channel);
    return finishSignIn(userId, "/");
  }

  if (authMode(env) === "supabase") {
    if (pending?.purpose === "reset" && pending.channel === "mobile") {
      if (!code || !(await sbVerifySms(pending.destination, code))) {
        return fail(t.reset.invalid, { code: t.errors.wrongCode });
      }
    }
    if (!(await sbUpdatePassword(password))) return fail(t.reset.invalid);
    await clearPending();
    revalidatePath("/", "layout");
    redirect("/");
  }
  return fail(t.errors.notConfigured);
}

// ---------------------------------------------------------------- profile

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(t.errors.generic, fieldErrorsOf(parsed.error.issues));
  const v = parsed.data;
  const current = await findAccountByUserId(user.id);
  const taken = await takenFields({ username: v.username, email: null, mobile: null }, user.id);
  if (taken.username) return fail(t.errors.generic, { username: t.errors.usernameTaken });

  await withUser(user.id, (tx) =>
    tx
      .update(profiles)
      .set({ displayName: v.displayName, username: v.username })
      .where(eq(profiles.userId, user.id)),
  );
  if (current?.username !== v.username) revalidatePath("/", "layout");
  revalidatePath("/settings");
  return { status: "done", message: t.profile.saved };
}
