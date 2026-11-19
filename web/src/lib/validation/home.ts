import { z } from "zod";
import { copy } from "@/lib/copy";

const e = copy.onboarding.errors;

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD"] as const;
export const BHK_OPTIONS = ["1 RK", "1 BHK", "2 BHK", "3 BHK", "4 BHK", "5+ BHK", "Villa"] as const;

const isoDate = z.iso.date({ error: e.date });
const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().or(z.literal(""));

/** Shared by the onboarding form (client) and the createHome action (server). */
export const homeSchema = z
  .object({
    name: z.string().trim().min(1, e.name).max(80, e.nameLong),
    /** Mandatory since v2; multi-line. */
    address: z.string().trim().min(1, e.address).max(500, e.addressLong),
    buildingName: optionalText(80, e.fieldLong),
    floorLabel: optionalText(20, e.fieldLong),
    bhk: z.enum(BHK_OPTIONS, { error: e.bhk }),
    possessionDate: isoDate.optional().or(z.literal("")),
    moveInDate: isoDate,
    totalBudget: z
      .number({ error: e.budget })
      .min(0, e.budget)
      .max(1_000_000_000_000, e.budget)
      .optional(),
    currency: z.enum(CURRENCIES, { error: e.currency }),
  })
  .refine((v) => !v.possessionDate || v.possessionDate <= v.moveInDate, {
    message: e.moveBeforePossession,
    path: ["moveInDate"],
  });

export type HomeInput = z.input<typeof homeSchema>;
export type HomeValues = z.output<typeof homeSchema>;

/** Fields validated on each wizard step before moving on. */
export const ONBOARDING_STEPS = [
  ["name", "address", "buildingName", "floorLabel", "bhk"],
  ["possessionDate", "moveInDate"],
  ["totalBudget", "currency"],
] as const satisfies readonly (readonly (keyof HomeInput)[])[];
