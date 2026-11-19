import type { ReactNode } from "react";
import { Logo } from "./logo";

/** Minimal frame for sign-in and onboarding: logo above a centred card. */
export function CenteredLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center px-4 py-10 sm:py-16">
      <div className="mb-8">
        <Logo />
      </div>
      <main className="w-full max-w-[520px] rounded-hero border bg-card p-6 shadow-sm sm:p-8">
        {children}
      </main>
    </div>
  );
}
