import { Suspense } from "react";
import type { Metadata } from "next";
import { copy } from "@/lib/copy";
import { readPending } from "@/lib/auth/auth-cookies";
import { maskMobile } from "@/lib/phone";
import { DevOutbox } from "@/components/auth/auth-ui";
import { ResetForm } from "./reset-form";

const t = copy.account.reset;

export const metadata: Metadata = { title: t.title };

/**
 * Two ways in: an emailed link (?u=&t= locally, or a Supabase session after
 * /auth/callback) or a mobile reset started on /forgot-password (needs the SMS code).
 */
async function ResetContent({
  searchParams,
}: {
  searchParams: PageProps<"/reset-password">["searchParams"];
}) {
  const params = await searchParams;
  const pick = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : "");
  const pending = await readPending();
  const mobile = pending?.purpose === "reset" && pending.channel === "mobile" ? pending : null;
  return (
    <div className="flex flex-col gap-5">
      {mobile && (
        <>
          <p className="text-body text-muted-foreground">
            {copy.account.verify.mobileBody(maskMobile(mobile.destination))}
          </p>
          <DevOutbox code={mobile.devCode} />
        </>
      )}
      <ResetForm needsCode={Boolean(mobile)} linkUser={pick("u")} linkToken={pick("t")} />
    </div>
  );
}

export default function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  return (
    <>
      <h1 className="mb-4 text-page-title font-extrabold tracking-tight">{t.title}</h1>
      <Suspense>
        <ResetContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
