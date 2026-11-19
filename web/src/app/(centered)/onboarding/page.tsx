import { Suspense } from "react";
import type { Metadata } from "next";
import { copy } from "@/lib/copy";
import { requireUser } from "@/lib/auth/session";
import { OnboardingWizard } from "./onboarding-wizard";

export const metadata: Metadata = { title: copy.onboarding.title };

/** Reads the session, so the wizard streams in behind Suspense. */
async function Gate() {
  await requireUser();
  return <OnboardingWizard />;
}

export default function OnboardingPage() {
  return (
    <>
      <h1 className="text-page-title font-extrabold tracking-tight">{copy.onboarding.title}</h1>
      <p className="mt-1 mb-6 text-body text-muted-foreground">{copy.onboarding.subtitle}</p>
      <Suspense>
        <Gate />
      </Suspense>
    </>
  );
}
