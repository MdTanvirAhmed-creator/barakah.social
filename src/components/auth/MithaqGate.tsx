"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Sends anyone who has not accepted the Mithaq to the threshold.
 *
 * This is the courtesy, not the rule. The rule is in the database:
 * has_accepted_mithaq guards inserting posts and comments (migration 30), so
 * someone who skips this page still cannot contribute. What this avoids is
 * the worse experience of letting them wander in, write something, and be
 * refused by a policy they were never shown.
 */
export function MithaqGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = React.useMemo(() => createClient(), []);
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        // Route protection elsewhere handles signed-out visitors.
        if (!cancelled) setChecked(true);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("profiles")
        .select("mithaq_accepted_at")
        .eq("id", user.id)
        .single();
      if (cancelled) return;
      if (!data?.mithaq_accepted_at && pathname !== "/onboarding") {
        router.replace("/onboarding");
        return;
      }
      setChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, pathname, supabase]);

  // Render nothing until the check resolves, so the feed never flashes up
  // behind someone who has not yet agreed to be here.
  if (!checked) return null;
  return <>{children}</>;
}
