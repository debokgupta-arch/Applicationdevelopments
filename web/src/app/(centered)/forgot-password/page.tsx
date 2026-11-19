"use client";

import Link from "next/link";
import { copy } from "@/lib/copy";
import { requestPasswordReset } from "@/lib/auth/account-actions";
import { forgotSchema } from "@/lib/validation/auth";
import { Field, TextInput } from "@/components/kit/field";
import { Button } from "@/components/ui/button";
import { DevOutbox, FormAlert, useAuthForm } from "@/components/auth/auth-ui";

const t = copy.account.forgot;

export default function ForgotPasswordPage() {
  const { state, pending, errors, onSubmit, a11y } = useAuthForm(
    requestPasswordReset,
    forgotSchema,
  );
  return (
    <>
      <h1 className="text-page-title font-extrabold tracking-tight">{t.title}</h1>
      <p className="mt-1 mb-6 text-body text-muted-foreground">{t.subtitle}</p>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Field id="identifier" label={t.identifier} error={errors.identifier}>
          <TextInput
            id="identifier"
            name="identifier"
            autoComplete="username"
            autoFocus
            required
            {...a11y("identifier")}
          />
        </Field>
        <FormAlert state={state} />
        {state.status === "done" && <DevOutbox code={state.devCode} link={state.devLink} />}
        <Button type="submit" disabled={pending} className="w-full">
          {t.submit}
        </Button>
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center justify-center text-body font-semibold text-primary hover:underline"
        >
          {t.back}
        </Link>
      </form>
    </>
  );
}
