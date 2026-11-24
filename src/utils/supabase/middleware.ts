import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const createClient = (request: NextRequest) => {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { supabaseResponse, supabase: null };
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      },
    );

    return { supabaseResponse, supabase };
  } catch {
    return { supabaseResponse, supabase: null };
  }
};

// Also export default updateSession helper conforming to standard Next.js / Supabase middleware pattern
export async function updateSession(request: NextRequest) {
  const { supabaseResponse, supabase } = createClient(request);
  if (!supabase) {
    return supabaseResponse;
  }

  try {
    await supabase.auth.getUser();
  } catch {
    // Graceful fallback for offline or network issues
  }
  return supabaseResponse;
}
