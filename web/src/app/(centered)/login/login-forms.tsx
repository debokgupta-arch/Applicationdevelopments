"use client";

import Link from "next/link";
import { copy } from "@/lib/copy";
import { loginWithName, loginWithPassword } from "@/lib/auth/account-actions";
import { loginSchema, nameLoginSchema } from "@/lib/validation/auth";
import { Field, TextInput } from "@/components/kit/field";
import { Button } from "@/components/ui/button";
import { FormAlert, PasswordInput, useAuthForm } from "@/components/auth/auth-ui";

const t = copy.account;

/** Login: user name only when DEV_NAME_ONLY_LOGIN is on, otherwise user name + password. No OTP. */
export function LoginForms({
  next,
  initialError,
  nameOnly = false,
}: {
  next?: string;
  initialError?: string;
  nameOnly?: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      {initialError && (
        <p role="alert" className="text-body font-semibold text-danger">
          {initialError}
        </p>
      )}
      {nameOnly ? <NameLogin next={next} /> : <PasswordLogin next={next} />}
      <p className="text-center text-body text-muted-foreground">
        {t.login.noAccount}{" "}
        <Link href="/register" className="font-bold text-primary hover:underline">
          {t.login.register}
        </Link>
      </p>
    </div>
  );
}

/** Local testing: name only, no password (DEV_NAME_ONLY_LOGIN). */
function NameLogin({ next }: { next?: string }) {
  const { state, pending, errors, onSubmit, a11y } = useAuthForm(loginWithName, nameLoginSchema);
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      <Field id="name" label={t.login.name} error={errors.name}>
        <TextInput
          id="name"
          name="name"
          autoComplete="username"
          autoFocus
          required
          placeholder={t.login.namePlaceholder}
          {...a11y("name")}
        />
      </Field>
      <FormAlert state={state} />
      <Button type="submit" disabled={pending} className="w-full">
        {t.login.submit}
      </Button>
      <p className="text-center text-label text-muted-foreground">{t.login.nameOnlyNote}</p>
    </form>
  );
}

function PasswordLogin({ next }: { next?: string }) {
  const { state, pending, errors, onSubmit, a11y } = useAuthForm(loginWithPassword, loginSchema);
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      <Field id="identifier" label={t.login.identifier} error={errors.identifier}>
        <TextInput
          id="identifier"
          name="identifier"
          autoComplete="username"
          autoFocus
          required
          placeholder={t.login.identifierPlaceholder}
          {...a11y("identifier")}
        />
      </Field>
      <Field id="password" label={t.login.password} error={errors.password}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          {...a11y("password")}
        />
      </Field>
      <div className="-mt-2 flex justify-end">
        <Link
          href="/forgot-password"
          className="inline-flex min-h-11 items-center text-body font-semibold text-primary hover:underline"
        >
          {t.login.forgot}
        </Link>
      </div>
      <FormAlert state={state} />
      <Button type="submit" disabled={pending} className="w-full">
        {t.login.submit}
      </Button>
    </form>
  );
}
