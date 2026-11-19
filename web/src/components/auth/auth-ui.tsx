"use client";

import {
  useActionState,
  useEffect,
  useState,
  useTransition,
  type ComponentProps,
  type FormEvent,
} from "react";
import { Eye, EyeOff, FlaskConical } from "lucide-react";
import type { ZodType } from "zod";
import { copy } from "@/lib/copy";
import type { FormState } from "@/lib/auth/account-actions";
import { resendCode } from "@/lib/auth/account-actions";
import { TextInput } from "@/components/kit/field";
import { Button } from "@/components/ui/button";

const t = copy.account;

/** Password input with a 44px show/hide toggle. */
export function PasswordInput(props: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <TextInput {...props} type={visible ? "text" : "password"} className="pr-12" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t.hidePassword : t.showPassword}
        aria-pressed={visible}
        aria-controls={props.id}
        className="absolute top-1/2 right-0.5 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {visible ? (
          <EyeOff className="size-5" aria-hidden="true" />
        ) : (
          <Eye className="size-5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

/** Six-digit code input tuned for SMS autofill. */
export function OtpInput(props: Omit<ComponentProps<"input">, "type">) {
  return (
    <TextInput
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="\d{6}"
      maxLength={6}
      className="text-center font-mono text-section tracking-[0.5em]"
    />
  );
}

/** Local dev backend only: shows the code/link that would have been sent. */
export function DevOutbox({ code, link }: { code?: string; link?: string }) {
  if (!code && !link) return null;
  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-card bg-due-soon p-3 text-label text-due-soon-foreground"
    >
      <FlaskConical className="mt-px size-4 shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <p className="font-bold">{t.devOutboxTitle}</p>
        {code && <p data-testid="dev-code">{t.devCode(code)}</p>}
        {link && (
          <a href={link} data-testid="dev-link" className="font-bold underline">
            {t.devLink}
          </a>
        )}
      </div>
    </div>
  );
}

export function FormAlert({ state }: { state: FormState }) {
  if (state.status === "error" && state.message && !state.fieldErrors) {
    return (
      <p role="alert" className="text-body font-semibold text-danger">
        {state.message}
      </p>
    );
  }
  if (state.status === "done") {
    return (
      <p
        role="status"
        className="rounded-card bg-primary-tint p-3 text-body font-semibold text-primary-dark"
      >
        {state.message}
      </p>
    );
  }
  return null;
}

/** "Resend" with a 30s countdown; the server enforces the same cooldown. */
export function ResendButton({ initialSeconds = 30 }: { initialSeconds?: number }) {
  const [state, action, pending] = useActionState(resendCode, { status: "idle" } as FormState);
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  return (
    <form
      action={action}
      onSubmit={() => setSeconds(30)}
      className="flex flex-col items-start gap-2"
    >
      <Button type="submit" variant="outline" disabled={pending || seconds > 0}>
        {seconds > 0 ? t.verify.resendIn(seconds) : t.verify.resend}
      </Button>
      {state.status !== "idle" && <FormAlert state={state} />}
      {state.status === "done" && <DevOutbox code={state.devCode} link={state.devLink} />}
    </form>
  );
}

/**
 * Runs a server action from a form with a client-side Zod check first (the
 * action validates again). Dispatching manually, instead of `<form action>`,
 * keeps what the user typed when the server returns an error.
 */
export function useAuthForm(
  serverAction: (prev: FormState, formData: FormData) => Promise<FormState>,
  schema?: ZodType,
) {
  const [state, dispatch, pending] = useActionState(serverAction, { status: "idle" } as FormState);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();
  const serverErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (schema) {
      const result = schema.safeParse(Object.fromEntries(formData));
      if (!result.success) {
        const errors: Record<string, string> = {};
        for (const issue of result.error.issues) errors[String(issue.path[0])] ??= issue.message;
        setClientErrors(errors);
        return;
      }
    }
    setClientErrors({});
    startTransition(() => dispatch(formData));
  };

  const errors = { ...serverErrors, ...clientErrors };
  /** Props that wire a field's error to the input for screen readers. */
  const a11y = (name: string) =>
    errors[name] ? { "aria-invalid": true as const, "aria-describedby": `${name}-error` } : {};
  return { state, pending, errors, onSubmit, a11y };
}
