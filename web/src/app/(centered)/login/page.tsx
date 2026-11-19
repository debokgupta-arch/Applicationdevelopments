import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { copy } from "@/lib/copy";
import { nameOnlyLogin } from "@/lib/env";
import { LoginForms } from "./login-forms";

export const metadata: Metadata = { title: copy.account.login.title };

const ERRORS: Record<string, string> = { link: copy.account.reset.invalid };

/** searchParams are request data, so the forms render inside Suspense. */
export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <>
      <h1 className="text-page-title font-extrabold tracking-tight">{copy.account.login.title}</h1>
      <Suspense>
        {searchParams.then(async (params) => {
          await connection();
          const nameOnly = nameOnlyLogin();
          const next = typeof params.next === "string" ? params.next : undefined;
          const error = typeof params.error === "string" ? ERRORS[params.error] : undefined;
          return (
            <>
              <p className="mt-1 mb-6 text-body text-muted-foreground">
                {nameOnly ? copy.account.login.nameSubtitle : copy.account.login.subtitle}
              </p>
              <LoginForms next={next} initialError={error} nameOnly={nameOnly} />
            </>
          );
        })}
      </Suspense>
    </>
  );
}
