import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/supabase/route-protection";

export default async function DashboardPage() {
  await requireAuth();
  
  // Redirect to feed instead of showing dashboard
  redirect("/feed");
}

