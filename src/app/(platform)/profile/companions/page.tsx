import { redirect } from "next/navigation";

// The mock-era companion management page is superseded by the real
// Companions flow (requests, bonds, blocks on the `companionships` table).
export default function ProfileCompanionsRedirect() {
  redirect("/companions");
}
