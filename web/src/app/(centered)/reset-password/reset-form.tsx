"use client";

import { copy } from "@/lib/copy";
import { resetPassword } from "@/lib/auth/account-actions";
import { resetSchema } from "@/lib/validation/auth";
import { Field } from "@/components/kit/field";
import { Button } from "@/components/ui/button";
import { FormAlert, OtpInput, PasswordInput, useAuthForm } from "@/components/auth/auth-ui";

const t = copy.account.reset;

type ResetFormProps = { needsCode: boolean; linkUser: string; linkToken: string };

export function ResetForm({ needsCode, linkUser, linkToken }: ResetFormProps) {
  const { state, pending, errors, onSubmit, a11y } = useAuthForm(resetPassword, resetSchema);
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="u" value={linkUser} />
      <input type="hidden" name="t" value={linkToken} />
      {needsCode && (
        <Field id="code" label={t.code} error={errors.code}>
          <OtpInput id="code" name="code" required autoFocus {...a11y("code")} />
        </Field>
      )}
      <Field id="password" label={t.password} error={errors.password}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          autoFocus={!needsCode}
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
    </form>
  );
}
