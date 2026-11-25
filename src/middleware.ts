import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

/**
 * Edge-compatible request boundary middleware.
 *
 * Architectural rules:
 * - Never import Prisma, Node-only libraries, or src/server/database here.
 * - Middleware provides lightweight request correlation and coarse route gating
 *   only; authoritative authentication, tenant membership resolution, and RBAC
 *   enforcement MUST happen inside server-side services and route handlers.
 */
export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);

  if (!requestHeaders.has("x-request-id")) {
    requestHeaders.set("x-request-id", crypto.randomUUID());
  }

  let response: NextResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const pathname = request.nextUrl.pathname;
  const requiresSupabaseSessionRefresh = pathname.startsWith("/todos");

  // Only invoke Supabase Auth refresh for Supabase-backed routes; school workspace routes
  // verify custom opaque session cookies in Server Components / API handlers without
  // extra external Supabase network round-trips.
  if (requiresSupabaseSessionRefresh) {
    try {
      const supabaseRes = await updateSession(request);
      if (supabaseRes) {
        response = supabaseRes;
      }
    } catch (err) {
      // Graceful fallback: never fail request invocation if external session updater fails
      console.warn("[Middleware] Supabase session update bypassed:", err);
    }
  }

  response.headers.set("x-request-id", requestHeaders.get("x-request-id")!);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
