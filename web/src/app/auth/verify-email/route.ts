import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { clearPending, startDevSession } from "@/lib/auth/auth-cookies";
import { consumeDevCode, markDevVerified } from "@/lib/auth/dev-backend";
import { authMode, serverEnv } from "@/lib/env";

/**
 * Local dev backend only: the "emailed" verification link lands here.
 * (With Supabase, the confirmation link goes to /auth/callback instead.)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const userId = searchParams.get("u") ?? "";
  const token = searchParams.get("t") ?? "";
  const env = serverEnv();

  if (authMode(env) === "dev" && env.DEV_AUTH_SECRET && userId && token) {
    if (await consumeDevCode(userId, "verify_email", token, env.DEV_AUTH_SECRET)) {
      await markDevVerified(userId, "email");
      await startDevSession(userId, env.DEV_AUTH_SECRET);
      await clearPending();
      revalidatePath("/", "layout");
      return NextResponse.redirect(new URL("/", origin));
    }
  }
  return NextResponse.redirect(new URL("/login?error=link", origin));
}
