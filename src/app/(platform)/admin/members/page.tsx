"use client";

import * as React from "react";
import { Loader2, Search, ShieldCheck, Shield, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminGate } from "@/components/admin/AdminGate";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";

type Role = "admin" | "moderator";

interface Member {
  id: string;
  username: string;
  display_name: string | null;
  roles: Role[];
}

/**
 * Appointing the people who carry moderation.
 *
 * Everything enforced here is enforced in the database too — only an admin
 * may write user_roles, granted_by is stamped by a trigger rather than sent
 * by this page, and the last admin cannot be removed (migration 33). What
 * this screen adds is the ability to see who holds what, which is the part
 * that was missing: the table existed and was empty, so nobody could appoint
 * anybody.
 */
function MembersAdmin({ self }: { self: string }) {
  const supabase = React.useMemo(() => createClient(), []);
  const { success, error: showError } = useToast();
  const [members, setMembers] = React.useState<Member[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");

  const load = React.useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      sb.from("public_profiles").select("id, username, display_name").order("username"),
      sb.from("user_roles").select("user_id, role"),
    ]);
    const byUser = new Map<string, Role[]>();
    ((roles ?? []) as { user_id: string; role: Role }[]).forEach((r) => {
      byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r.role]);
    });
    setMembers(
      ((profiles ?? []) as Omit<Member, "roles">[]).map((p) => ({
        ...p,
        roles: byUser.get(p.id) ?? [],
      }))
    );
    setLoading(false);
  }, [supabase]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const change = async (member: Member, role: Role, grant: boolean) => {
    setBusy(member.id + role);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    // granted_by is deliberately not sent: a trigger records who actually did
    // this, so the audit column cannot be dressed up from the client.
    const { error } = grant
      ? await sb.from("user_roles").insert({ user_id: member.id, role })
      : await sb.from("user_roles").delete().eq("user_id", member.id).eq("role", role);
    setBusy(null);

    if (error) {
      showError(
        /last admin/i.test(error.message)
          ? "That is the last administrator. Appoint someone else first."
          : error.message
      );
      return;
    }
    success(
      grant
        ? `${member.username} is now ${role === "admin" ? "an administrator" : "a moderator"}`
        : `${member.username} is no longer ${role === "admin" ? "an administrator" : "a moderator"}`
    );
    void load();
  };

  const shown = members.filter(
    (m) =>
      !query ||
      m.username.toLowerCase().includes(query.toLowerCase()) ||
      (m.display_name ?? "").toLowerCase().includes(query.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const admins = members.filter((m) => m.roles.includes("admin")).length;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Members and roles</h1>
        <p className="text-foreground-secondary mt-1">
          Moderators can act on reported content. Administrators can also
          appoint other people. Both are a trust, not a rank — nothing here is
          shown to members.
        </p>
      </div>

      {admins === 1 && (
        <p className="text-sm text-foreground-secondary border-s-2 border-accent ps-3">
          You are the only administrator. If you lose access to this account,
          nobody can appoint anyone. Consider appointing a second person you
          trust.
        </p>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or username"
          className="ps-9"
          aria-label="Search members"
        />
      </div>

      <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
        {shown.map((m) => {
          const isAdmin = m.roles.includes("admin");
          const isModerator = m.roles.includes("moderator");
          return (
            <div key={m.id} className="flex flex-wrap items-center gap-3 p-4 bg-card">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {isAdmin ? (
                  <ShieldCheck className="w-5 h-5 text-accent-strong shrink-0" aria-hidden="true" />
                ) : isModerator ? (
                  <Shield className="w-5 h-5 text-foreground-secondary shrink-0" aria-hidden="true" />
                ) : (
                  <UserIcon className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden="true" />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {m.display_name || m.username}
                    {m.id === self && (
                      <span className="ms-2 text-xs text-muted-foreground">you</span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    @{m.username}
                    {isAdmin
                      ? " · administrator"
                      : isModerator
                        ? " · moderator"
                        : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={isModerator ? "outline" : "default"}
                  disabled={busy === m.id + "moderator" || isAdmin}
                  title={isAdmin ? "Administrators already moderate" : undefined}
                  onClick={() => change(m, "moderator", !isModerator)}
                >
                  {isModerator ? "Remove moderator" : "Make moderator"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy === m.id + "admin"}
                  onClick={() => change(m, "admin", !isAdmin)}
                >
                  {isAdmin ? "Remove admin" : "Make admin"}
                </Button>
              </div>
            </div>
          );
        })}
        {shown.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">No members match that search.</p>
        )}
      </div>
    </div>
  );
}

export default function MembersPage() {
  const supabase = React.useMemo(() => createClient(), []);
  const [self, setSelf] = React.useState<string | null>(null);

  React.useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setSelf(data.user?.id ?? null));
  }, [supabase]);

  return <AdminGate require="admin">{() => <MembersAdmin self={self ?? ""} />}</AdminGate>;
}
