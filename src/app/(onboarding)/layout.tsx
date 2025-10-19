import { Metadata } from "next";
import { requireAuth } from "@/lib/supabase/route-protection";

export const metadata: Metadata = {
  title: "Welcome to Barakah.Social",
  description: "Complete your profile and join the community",
};

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure user is authenticated for onboarding
  await requireAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background">
      {children}
    </div>
  );
}

