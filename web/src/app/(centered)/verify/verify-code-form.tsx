"use client";

import { copy } from "@/lib/copy";
import { verifyMobileCode } from "@/lib/auth/account-actions";
import { otpSchema } from "@/lib/validation/auth";
import { Field } from "@/components/kit/field";
import { Button } from "@/components/ui/button";
import { FormAlert, OtpInput, useAuthForm } from "@/components/auth/auth-ui";

const t = copy.account.verify;

export function VerifyCodeForm() {
  const { state, pending, errors, onSubmit, a11y } = useAuthForm(verifyMobileCode, otpSchema);
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field id="code" label={t.code} error={errors.code}>
        <OtpInput id="code" name="code" required autoFocus {...a11y("code")} />
      </Field>
      <FormAlert state={state} />
      <Button type="submit" disabled={pending} className="w-full">
        {t.submit}
      </Button>
    </form>
  );
}
