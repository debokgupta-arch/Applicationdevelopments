"use client";

import Link from "next/link";
import { copy } from "@/lib/copy";
import { register } from "@/lib/auth/account-actions";
import { registerSchema } from "@/lib/validation/auth";
import { Field, TextInput } from "@/components/kit/field";
import { Button } from "@/components/ui/button";
import { FormAlert, PasswordInput, useAuthForm } from "@/components/auth/auth-ui";

const t = copy.account.register;

export function RegisterForm() {
  const { state, pending, errors, onSubmit, a11y } = useAuthForm(register, registerSchema);
  const hint = (name: string) => (errors[name] ? {} : { "aria-describedby": `${name}-hint` });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field id="username" label={t.username} hint={t.usernameHint} error={errors.username}>
        <TextInput
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          autoFocus
          required
          placeholder={t.usernamePlaceholder}
          {...hint("username")}
          {...a11y("username")}
        />
      </Field>
      <Field id="mobile" label={t.mobile} hint={t.mobileHint} error={errors.mobile}>
        <TextInput
          id="mobile"
          name="mobile"
          type="tel"
          autoComplete="tel"
          placeholder={t.mobilePlaceholder}
          {...hint("mobile")}
          {...a11y("mobile")}
        />
      </Field>
      <Field id="email" label={t.email} hint={t.optional} error={errors.email}>
        <TextInput
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={t.emailPlaceholder}
          {...hint("email")}
          {...a11y("email")}
        />
      </Field>
      <Field id="password" label={t.password} hint={t.passwordHint} error={errors.password}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          {...hint("password")}
          {...a11y("password")}
        />
      </Field>
      <Field id="confirmPassword" label={t.confirmPassword} error={errors.confirmPassword}>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          required
          {...a11y("confirmPassword")}
        />
      </Field>
      <FormAlert state={state} />
      <Button type="submit" disabled={pending} className="w-full">
        {t.submit}
      </Button>
      <p className="text-center text-body text-muted-foreground">
        {t.haveAccount}{" "}
        <Link href="/login" className="font-bold text-primary hover:underline">
          {t.login}
        </Link>
      </p>
    </form>
  );
}
