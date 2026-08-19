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
  // The root layout's "Skip to main content" link targets #main-content.
  // Without a landmark carrying that id, the link went nowhere on the auth
  // pages and keyboard users had no way past the chrome.
  return <main id="main-content">{children}</main>;
}
