import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "./server";

export async function requireAuth() {
  const supabase = await createServerSupabaseClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireGuest() {
  const supabase = await createServerSupabaseClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }
}

export async function getUser() {
  const supabase = await createServerSupabaseClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getSession() {
  const supabase = await createServerSupabaseClient();
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

