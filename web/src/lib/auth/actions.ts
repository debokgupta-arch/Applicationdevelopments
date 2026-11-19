"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authMode } from "@/lib/env";
import { CURRENT_HOME_COOKIE, DEV_SESSION_COOKIE } from "./cookies";
import { createSupabaseServerClient } from "./supabase-server";

/** Log out (account menu). Sign-in itself lives in account-actions.ts. */
export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  if (authMode() === "supabase") {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  cookieStore.delete(DEV_SESSION_COOKIE);
  cookieStore.delete(CURRENT_HOME_COOKIE);
  revalidatePath("/", "layout");
  redirect("/login");
}
