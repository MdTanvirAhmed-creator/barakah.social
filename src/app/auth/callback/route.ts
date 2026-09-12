import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  // Providers report their own failures here, before any exchange happens.
  const providerError =
    requestUrl.searchParams.get("error_description") ||
    requestUrl.searchParams.get("error");

  if (code) {
    const cookieStore = await cookies();
    const supabase = await createServerSupabaseClient();
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // Swallowing this was why a sign-in failure said only "expired link or
      // invalid code" — true of almost nothing and useful for diagnosing
      // nothing. The reason travels to the error page so it can be read.
      console.error("[auth/callback] code exchange failed:", error.message);
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?reason=${encodeURIComponent(error.message)}`
      );
    }

    {
      // Get user to check if profile exists
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if profile exists
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!profile) {
          // Create profile if it doesn't exist
          await (supabase as any)
            .from('profiles')
            .insert({
              id: user.id,
              username: user.email?.split('@')[0] || 'user',
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              bio: '',
              avatar_url: user.user_metadata?.avatar_url,
              interests: []
            });
        }
      }
      
      // Redirect to feed instead of dashboard
      return NextResponse.redirect(`${origin}/feed`);
    }
  }

  // No code at all: either the provider refused, or this route was reached
  // directly.
  const reason =
    providerError ?? (code ? "sign-in could not be completed" : "no authorization code was returned");
  console.error("[auth/callback] no session created:", reason);
  return NextResponse.redirect(
    `${origin}/auth/auth-code-error?reason=${encodeURIComponent(reason)}`
  );
}

