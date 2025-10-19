import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - Barakah.Social",
  description: "Sign in or create an account on Barakah.Social",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

