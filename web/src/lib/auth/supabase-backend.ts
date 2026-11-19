/**
 * Supabase Auth backend for register / login / OTP / reset. Used whenever
 * NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.
 *
 * Requires in the Supabase dashboard: Email provider (confirm email on), Phone
 * provider with an SMS provider configured, and the site URL + /auth/callback
 * as an allowed redirect. Not exercised locally (no project yet).
 */
import { createSupabaseServerClient } from "./supabase-server";

type Contact = { channel: "email"; email: string } | { channel: "mobile"; phone: string };

export async function sbSignUp(
  contact: Contact,
  password: string,
  meta: { username: string },
  emailRedirectTo: string,
): Promise<{ userId: string } | { error: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } =
    contact.channel === "email"
      ? await supabase.auth.signUp({
          email: contact.email,
          password,
          options: { emailRedirectTo, data: meta },
        })
      : await supabase.auth.signUp({ phone: contact.phone, password, options: { data: meta } });
  if (error || !data.user) return { error: error?.message ?? "sign-up failed" };
  return { userId: data.user.id };
}

export async function sbResendSignup(contact: Contact, emailRedirectTo: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } =
    contact.channel === "email"
      ? await supabase.auth.resend({
          type: "signup",
          email: contact.email,
          options: { emailRedirectTo },
        })
      : await supabase.auth.resend({ type: "sms", phone: contact.phone });
  return !error;
}

/** Verifies an SMS code (sign-up confirmation, OTP login and mobile reset all use type "sms"). */
export async function sbVerifySms(phone: string, code: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: "sms" });
  return !error;
}

export type SbPasswordResult = "ok" | "invalid" | "unconfirmed";

export async function sbSignInWithPassword(
  contact: Contact,
  password: string,
): Promise<SbPasswordResult> {
  const supabase = await createSupabaseServerClient();
  const { error } =
    contact.channel === "email"
      ? await supabase.auth.signInWithPassword({ email: contact.email, password })
      : await supabase.auth.signInWithPassword({ phone: contact.phone, password });
  if (!error) return "ok";
  return error.code === "email_not_confirmed" || error.code === "phone_not_confirmed"
    ? "unconfirmed"
    : "invalid";
}

/** Sends an SMS code to an existing account only (never creates one). */
export async function sbSendSmsCode(phone: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signInWithOtp({ phone, options: { shouldCreateUser: false } });
}

export async function sbSendResetEmail(email: string, redirectTo: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo });
}

/** Sets a new password for the signed-in user (after a reset link or SMS code). */
export async function sbUpdatePassword(password: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  return !error;
}
