import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { copy } from "@/lib/copy";
import { readPending } from "@/lib/auth/auth-cookies";
import { maskEmail, maskMobile } from "@/lib/phone";
import { DevOutbox, ResendButton } from "@/components/auth/auth-ui";
import { VerifyCodeForm } from "./verify-code-form";

const t = copy.account.verify;

export const metadata: Metadata = { title: t.title };

/** Reads the pending-verification cookie, so it renders at request time. */
async function VerifyContent() {
  const pending = await readPending();
  if (!pending || pending.purpose === "reset") {
    return (
      <p className="text-body text-muted-foreground">
        {t.expired}{" "}
        <Link href="/login" className="font-bold text-primary hover:underline">
          {copy.account.forgot.back}
        </Link>
      </p>
    );
  }
  const isMobile = pending.channel === "mobile";
  const to = isMobile ? maskMobile(pending.destination) : maskEmail(pending.destination);
  return (
    <div className="flex flex-col gap-5">
      <p className="text-body text-muted-foreground">
        {isMobile ? t.mobileBody(to) : t.emailBody(to)}
      </p>
      <DevOutbox code={pending.devCode} link={pending.devLink} />
      {isMobile && <VerifyCodeForm />}
      <ResendButton />
    </div>
  );
}

export default function VerifyPage() {
  return (
    <>
      <h1 className="mb-4 text-page-title font-extrabold tracking-tight">{t.title}</h1>
      <Suspense>
        <VerifyContent />
      </Suspense>
    </>
  );
}
