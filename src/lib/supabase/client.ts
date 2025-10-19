import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

// Client-side Supabase client for use in Client Components and browser
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Supabase environment variables not set. Using placeholder client."
    );
    // Return a placeholder client for development
    return createBrowserClient<Database>(
      "https://placeholder.supabase.co",
      "placeholder-key"
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

