"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { withUser } from "@/db/client";
import { homeMembers, homes } from "@/db/schema";
import { initHomeDefaults, seedHome } from "@/db/seed-home";
import { CURRENT_HOME_COOKIE } from "@/lib/auth/cookies";
import { requireUser } from "@/lib/auth/session";
import { copy } from "@/lib/copy";
import { homeSchema, type HomeInput } from "@/lib/validation/home";
import { getUserHomes } from "./homes";

export type CreateHomeResult =
  { ok: true } | { ok: false; message: string; fieldErrors?: Record<string, string> };

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Onboarding: create a home, make the caller its owner and seed the default
 * checklist, all in one transaction under row-level security.
 */
export async function createHome(input: HomeInput): Promise<CreateHomeResult> {
  const user = await requireUser();
  const parsed = homeSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, message: copy.onboarding.errors.fix, fieldErrors };
  }
  const v = parsed.data;

  const homeId = await withUser(user.id, async (tx) => {
    const [home] = await tx
      .insert(homes)
      .values({
        ownerId: user.id,
        name: v.name,
        address: v.address,
        buildingName: v.buildingName || null,
        floorLabel: v.floorLabel || null,
        bhk: v.bhk,
        possessionDate: v.possessionDate || null,
        moveInDate: v.moveInDate,
        totalBudget: v.totalBudget ?? null,
        currency: v.currency,
      })
      .returning({ id: homes.id });

    await tx.insert(homeMembers).values({ homeId: home.id, userId: user.id, role: "owner" });
    await initHomeDefaults(tx, home.id, v.currency);
    await seedHome(tx, home.id, v.moveInDate);
    return home.id;
  });

  (await cookies()).set(CURRENT_HOME_COOKIE, homeId, {
    path: "/",
    sameSite: "lax",
    maxAge: ONE_YEAR,
  });
  revalidatePath("/", "layout");
  // No redirect() here: the client router would reuse its earlier view of "/"
  // (which redirected to onboarding while the user had no home). The wizard
  // does a full page load instead.
  return { ok: true };
}

/** Home switcher: remember the choice, only for homes the user can actually see. */
export async function setCurrentHome(homeId: string): Promise<void> {
  const id = z.uuid().parse(homeId);
  const list = await getUserHomes();
  if (!list.some((home) => home.id === id)) return;
  (await cookies()).set(CURRENT_HOME_COOKIE, id, { path: "/", sameSite: "lax", maxAge: ONE_YEAR });
  // Every page shows data for the current home.
  revalidatePath("/", "layout");
}
