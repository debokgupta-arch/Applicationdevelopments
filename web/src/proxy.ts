import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEV_SESSION_COOKIE, isSupabaseAuthCookie } from "@/lib/auth/cookies";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/verify",
  "/forgot-password",
  "/reset-password",
  "/auth/",
];

const isPublic = (pathname: string) =>
  PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p.endsWith("/") ? p : `${p}/`));

/** Keeps the Supabase session cookie fresh on every request (official @supabase/ssr pattern). */
async function refreshSupabaseSession(request: NextRequest, url: string, key: string) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

/**
 * Cheap gate: visitors without any session cookie are sent to sign-in.
 * Real verification happens in the Data Access Layer (getSessionUser).
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const response =
    supabaseUrl && supabaseKey
      ? await refreshSupabaseSession(request, supabaseUrl, supabaseKey)
      : NextResponse.next();

  if (isPublic(pathname)) return response;

  const hasSession =
    request.cookies.has(DEV_SESSION_COOKIE) ||
    request.cookies.getAll().some((cookie) => isSupabaseAuthCookie(cookie.name));
  if (hasSession) return response;

  const signIn = new URL("/login", request.url);
  signIn.searchParams.set("next", pathname + search);
  return NextResponse.redirect(signIn);
}

export const config = {
  // Everything except Next internals and files with an extension (fonts, icons, images).
  matcher: ["/((?!_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)"],
};
