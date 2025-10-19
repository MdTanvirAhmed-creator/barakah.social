import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = await cookies();
    const supabase = await createServerSupabaseClient();
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Get user to check if profile exists
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!profile) {
          // Create profile if it doesn't exist
          await supabase
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

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}

