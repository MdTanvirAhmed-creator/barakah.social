import type { Metadata } from "next";
import { StyleReference } from "./StyleReference";

export const metadata: Metadata = {
  title: "Design language",
  robots: { index: false, follow: false },
};

/**
 * The living style reference — every token, type role, primitive and the
 * loader, on both themes and both directions. The visual source of truth
 * for Phases 3–8.
 */
export default function StylePage() {
  return <StyleReference />;
}
