"use client";

import { copy } from "@/lib/copy";
import { updateProfile } from "@/lib/auth/account-actions";
import { profileSchema } from "@/lib/validation/auth";
import { Chip } from "@/components/kit/chip";
import { Field, TextInput } from "@/components/kit/field";
import { Button } from "@/components/ui/button";
import { FormAlert, useAuthForm } from "@/components/auth/auth-ui";

const t = copy.account;

type ProfileFormProps = {
  displayName: string;
  username: string;
  email: string | null;
  mobile: string | null;
  emailVerified: boolean;
  mobileVerified: boolean;
};

function ContactRow({
  label,
  value,
  verified,
}: {
  label: string;
  value: string | null;
  verified: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label font-bold text-muted-foreground">{label}</span>
      <span className="flex flex-wrap items-center gap-2 text-body">
        {value ?? <span className="text-muted-foreground">{t.profile.none}</span>}
        {value && (
          <Chip tone={verified ? "selected" : "amber"}>
            {verified ? t.verify.verified : t.verify.unverified}
          </Chip>
        )}
      </span>
    </div>
  );
}

export function ProfileForm(props: ProfileFormProps) {
  const { state, pending, errors, onSubmit, a11y } = useAuthForm(updateProfile, profileSchema);
  return (
    <section
      aria-labelledby="profile-heading"
      className="flex flex-col gap-5 rounded-card border bg-card p-5 lg:p-6"
    >
      <h2 id="profile-heading" className="text-section font-extrabold">
        {t.profile.title}
      </h2>
      <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field id="displayName" label={t.profile.displayName} error={errors.displayName}>
          <TextInput
            id="displayName"
            name="displayName"
            defaultValue={props.displayName}
            required
            {...a11y("displayName")}
          />
        </Field>
        <Field id="username" label={t.profile.username} error={errors.username}>
          <TextInput
            id="username"
            name="username"
            defaultValue={props.username}
            autoCapitalize="none"
            required
            {...a11y("username")}
          />
        </Field>
        <ContactRow label={t.profile.email} value={props.email} verified={props.emailVerified} />
        <ContactRow label={t.profile.mobile} value={props.mobile} verified={props.mobileVerified} />
        <div className="flex flex-col items-start gap-3 sm:col-span-2">
          <FormAlert state={state} />
          <Button type="submit" disabled={pending}>
            {t.profile.save}
          </Button>
        </div>
      </form>
    </section>
  );
}
