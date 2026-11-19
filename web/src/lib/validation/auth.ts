import { z } from "zod";
import { copy } from "@/lib/copy";
import { normalizeMobile } from "@/lib/phone";
import { USERNAME_PATTERN } from "@/lib/username";

const e = copy.account.errors;

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .refine((v) => v === "" || z.email().safeParse(v).success, e.email);

const optionalMobile = z
  .string()
  .trim()
  .refine((v) => v === "" || normalizeMobile(v) !== null, e.mobile)
  .transform((v) => (v === "" ? "" : (normalizeMobile(v) ?? "")));

export const passwordSchema = z.string().min(8, e.passwordShort).max(72, e.passwordLong);

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, e.usernameLength)
  .max(30, e.usernameLength)
  .regex(USERNAME_PATTERN, e.usernameChars);

/** Register (v2 section 1): user name + mobile and/or email + password twice. */
export const registerSchema = z
  .object({
    username: usernameSchema,
    mobile: optionalMobile,
    email: optionalEmail,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.mobile !== "" || v.email !== "", {
    message: e.contactRequired,
    path: ["email"],
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: e.passwordMismatch,
    path: ["confirmPassword"],
  });

export type RegisterInput = z.input<typeof registerSchema>;
export type RegisterValues = z.output<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, e.identifierRequired),
  password: z.string().min(1, e.passwordRequired),
  next: z.string().optional(),
});

/** Name-only login (local testing switch, no password). */
export const nameLoginSchema = z.object({
  name: z.string().trim().min(1, e.nameRequired),
  next: z.string().optional(),
});

export const mobileSchema = z.object({
  mobile: z
    .string()
    .trim()
    .refine((v) => normalizeMobile(v) !== null, e.mobile)
    .transform((v) => normalizeMobile(v) ?? ""),
});

export const otpSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, e.code),
});

export const forgotSchema = z.object({
  identifier: z.string().trim().min(1, e.identifierRequired),
});

export const resetSchema = z
  .object({
    code: z.string().trim().optional(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: e.passwordMismatch,
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, e.displayName).max(60, e.displayName),
  username: usernameSchema,
});
