import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth/safe-next";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { authMode } from "@/lib/env";

/** Supabase magic-link and Google OAuth both land here with a one-time `code`. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code && authMode() === "supabase") {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  return NextResponse.redirect(new URL("/login?error=link", origin));
}
