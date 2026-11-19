"use client";

import { useState, useTransition, type FormEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldPath } from "react-hook-form";
import { createHome, type CreateHomeResult } from "@/lib/data/home-actions";
import { copy } from "@/lib/copy";
import {
  BHK_OPTIONS,
  CURRENCIES,
  ONBOARDING_STEPS,
  homeSchema,
  type HomeInput,
  type HomeValues,
} from "@/lib/validation/home";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/kit/field";
import { ProgressBar } from "@/components/kit/progress-bar";

const t = copy.onboarding;
const selectClass =
  "h-12 w-full rounded-input border border-input bg-card px-3 text-body text-foreground outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-danger";
const textareaClass =
  "min-h-24 w-full rounded-input border border-input bg-card px-3.5 py-3 text-body text-foreground placeholder:text-muted-foreground/70 outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-danger";

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<HomeInput, unknown, HomeValues>({
    resolver: zodResolver(homeSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      address: "",
      buildingName: "",
      floorLabel: "",
      bhk: "3 BHK",
      possessionDate: "",
      moveInDate: "",
      currency: "INR",
    },
  });
  const { register, formState, trigger, handleSubmit, setError } = form;
  const err = (name: FieldPath<HomeInput>) => formState.errors[name]?.message;
  const invalid = (name: FieldPath<HomeInput>) => (err(name) ? true : undefined);
  const described = (name: FieldPath<HomeInput>) => (err(name) ? `${name}-error` : undefined);

  const isLast = step === ONBOARDING_STEPS.length - 1;

  const goNext = async () => {
    if (await trigger([...ONBOARDING_STEPS[step]])) setStep((s) => s + 1);
  };

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result: CreateHomeResult = await createHome(values);
      if (result.ok) {
        // Full load so the dashboard is rendered fresh with the new home.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate full load; router.push would reuse a stale "/" (see createHome)
        window.location.assign("/");
        return;
      }
      setServerError(result.message);
      for (const [name, message] of Object.entries(result.fieldErrors ?? {})) {
        setError(name as FieldPath<HomeInput>, { message });
      }
    });
  });

  // Enter on an earlier step moves forward instead of submitting the whole form.
  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (isLast) return onSubmit(event);
    event.preventDefault();
    void goNext();
  };

  return (
    <form onSubmit={handleFormSubmit} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-label font-bold text-muted-foreground" aria-live="polite">
          {t.stepOf(step + 1, ONBOARDING_STEPS.length)} · {t.steps[step]}
        </p>
        <ProgressBar value={((step + 1) / ONBOARDING_STEPS.length) * 100} label={t.steps[step]} />
      </div>

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <Field id="name" label={t.fields.name} error={err("name")}>
            <TextInput
              id="name"
              autoFocus
              placeholder={t.fields.namePlaceholder}
              aria-invalid={invalid("name")}
              aria-describedby={described("name")}
              {...register("name")}
            />
          </Field>
          <Field id="address" label={t.fields.address} error={err("address")}>
            <textarea
              id="address"
              rows={3}
              required
              autoComplete="street-address"
              placeholder={t.fields.addressPlaceholder}
              aria-invalid={invalid("address")}
              aria-describedby={described("address")}
              className={textareaClass}
              {...register("address")}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <Field
              id="buildingName"
              label={t.fields.buildingName}
              hint={t.optional}
              error={err("buildingName")}
            >
              <TextInput
                id="buildingName"
                placeholder={t.fields.buildingNamePlaceholder}
                aria-invalid={invalid("buildingName")}
                aria-describedby={described("buildingName") ?? "buildingName-hint"}
                {...register("buildingName")}
              />
            </Field>
            <Field
              id="floorLabel"
              label={t.fields.floorLabel}
              hint={t.optional}
              error={err("floorLabel")}
            >
              <TextInput
                id="floorLabel"
                placeholder={t.fields.floorLabelPlaceholder}
                aria-invalid={invalid("floorLabel")}
                aria-describedby={described("floorLabel") ?? "floorLabel-hint"}
                {...register("floorLabel")}
              />
            </Field>
          </div>
          <Field id="bhk" label={t.fields.bhk} error={err("bhk")}>
            <select
              id="bhk"
              className={selectClass}
              aria-invalid={invalid("bhk")}
              {...register("bhk")}
            >
              {BHK_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="possessionDate"
            label={t.fields.possessionDate}
            hint={t.optional}
            error={err("possessionDate")}
          >
            <TextInput
              id="possessionDate"
              type="date"
              aria-invalid={invalid("possessionDate")}
              aria-describedby={described("possessionDate") ?? "possessionDate-hint"}
              {...register("possessionDate")}
            />
          </Field>
          <Field id="moveInDate" label={t.fields.moveInDate} error={err("moveInDate")}>
            <TextInput
              id="moveInDate"
              type="date"
              required
              aria-invalid={invalid("moveInDate")}
              aria-describedby={described("moveInDate")}
              {...register("moveInDate")}
            />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <Field
            id="totalBudget"
            label={t.fields.budget}
            hint={t.optional}
            error={err("totalBudget")}
          >
            <TextInput
              id="totalBudget"
              type="number"
              inputMode="decimal"
              min={0}
              placeholder={t.fields.budgetPlaceholder}
              aria-invalid={invalid("totalBudget")}
              aria-describedby={described("totalBudget") ?? "totalBudget-hint"}
              {...register("totalBudget", {
                setValueAs: (value: string) => (value === "" ? undefined : Number(value)),
              })}
            />
          </Field>
          <Field id="currency" label={t.fields.currency} error={err("currency")}>
            <select id="currency" className={selectClass} {...register("currency")}>
              {CURRENCIES.map((code) => (
                <option key={code}>{code}</option>
              ))}
            </select>
          </Field>
        </div>
      )}

      {serverError && (
        <p role="alert" className="text-body font-semibold text-danger">
          {serverError}
        </p>
      )}

      <div className="flex justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((s) => s - 1)}
          className={step === 0 ? "invisible" : undefined}
        >
          {t.back}
        </Button>
        {isLast ? (
          <Button type="submit" disabled={pending}>
            {pending ? t.submitting : t.submit}
          </Button>
        ) : (
          <Button type="button" onClick={goNext}>
            {t.next}
          </Button>
        )}
      </div>
    </form>
  );
}
