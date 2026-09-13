"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export type AdminAccess = "admin" | "moderator" | null;

/**
 * The lock on the admin section.
 *
 * /admin and everything under it had no authorisation check of any kind: any
 * signed-in member could open the reports queue, the verification screens and
 * the settings. RLS meant most queries returned nothing, so little leaked —
 * but "the data happened to be protected" is not the same as "the door was
 * locked", and only one of the nine pages looked at roles at all.
 *
 * The roles come from user_roles, which since migration 33 is the single
 * source of truth. This is still only the door: every page behind it depends
 * on RLS for the data itself, and should continue to.
 */
export function AdminGate({
  children,
  require: required = "moderator",
}: {
  children: (access: Exclude<AdminAccess, null>) => React.ReactNode;
  /** "admin" for pages only an admin may see; "moderator" admits both. */
  require?: "admin" | "moderator";
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const [access, setAccess] = React.useState<AdminAccess>(null);
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setChecking(false);
        return;
      }
      // A member may read their own roles; that is all this needs.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (cancelled) return;
      const roles = ((data ?? []) as { role: string }[]).map((r) => r.role);
      setAccess(roles.includes("admin") ? "admin" : roles.includes("moderator") ? "moderator" : null);
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const permitted = access === "admin" || (required === "moderator" && access === "moderator");

  if (!permitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7 text-muted-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Not your responsibility</h1>
          <p className="text-sm text-foreground-secondary">
            {required === "admin"
              ? "This is for administrators. Moderation tools are elsewhere."
              : "These are the moderation tools, kept to the people who carry that trust."}
          </p>
          <Button asChild variant="outline">
            <Link href="/feed">Back to the feed</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children(access as Exclude<AdminAccess, null>)}</>;
}
