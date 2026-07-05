"use client";

import { useState } from "react";
import {
  Users,
  UserPlus,
  UserMinus,
  UserX,
  Search,
  Check,
  X,
  Clock,
  ShieldOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/useToast";
import { useCompanions, ProfileCard } from "@/hooks/useCompanions";

type Tab = "companions" | "requests" | "find" | "blocked";

function initials(card: ProfileCard | null): string {
  const name = card?.display_name || card?.username || "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function CardIdentity({ card }: { card: ProfileCard | null }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <Avatar>
        <AvatarImage src={card?.avatar_url ?? undefined} />
        <AvatarFallback>{initials(card)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="font-medium text-foreground truncate">
          {card?.display_name || card?.username || "Unknown user"}
        </div>
        {card?.username && (
          <div className="text-sm text-muted-foreground truncate">@{card.username}</div>
        )}
      </div>
    </div>
  );
}

export default function CompanionsPage() {
  const companions = useCompanions();
  const { success, error: showError } = useToast();
  const [tab, setTab] = useState<Tab>("companions");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Awaited<ReturnType<typeof companions.search>>>([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (key: string, fn: () => Promise<void>, message: string) => {
    setBusy(key);
    try {
      await fn();
      success(message);
    } catch (e) {
      showError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const runSearch = async () => {
    setSearching(true);
    try {
      setResults(await companions.search(query));
    } catch (e) {
      showError((e as Error).message);
    } finally {
      setSearching(false);
    }
  };

  const pendingCount = companions.incoming.length + companions.outgoing.length;

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: "companions", label: "Companions", count: companions.companions.length },
    { id: "requests", label: "Requests", count: pendingCount },
    { id: "find", label: "Find" },
    { id: "blocked", label: "Blocked", count: companions.blocked.length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-6 md:py-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-2xl flex items-center justify-center">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Companions</h1>
            <p className="text-foreground-secondary">
              Your circle — requests, companions and blocks
            </p>
          </div>
        </div>

        <div className="flex gap-2 border-b border-border mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                tab === t.id
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="text-xs bg-primary-100 text-primary-700 rounded-full px-2 py-0.5">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {companions.loading && (
          <div className="text-center py-12 text-muted-foreground">Loading…</div>
        )}

        {!companions.loading && tab === "companions" && (
          <div className="space-y-3">
            {companions.companions.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">
                  No companions yet. Find someone to walk the path with.
                </p>
                <Button onClick={() => setTab("find")}>
                  <Search className="w-4 h-4 mr-2" />
                  Find companions
                </Button>
              </div>
            )}
            {companions.companions.map((entry) => {
              const other =
                entry.companionship.requester_id === companions.userId
                  ? entry.companionship.addressee_id
                  : entry.companionship.requester_id;
              return (
                <div
                  key={entry.companionship.id}
                  className="flex items-center justify-between bg-card border border-border rounded-lg p-4"
                >
                  <CardIdentity card={entry.card} />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy !== null}
                      onClick={() =>
                        act(
                          entry.companionship.id,
                          () => companions.remove(entry.companionship.id),
                          "Companion removed"
                        )
                      }
                    >
                      <UserMinus className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-error border-error/40 hover:bg-error/10"
                      disabled={busy !== null}
                      onClick={() =>
                        act(`block-${other}`, () => companions.block(other), "User blocked")
                      }
                    >
                      <UserX className="w-4 h-4 mr-1" />
                      Block
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!companions.loading && tab === "requests" && (
          <div className="space-y-6">
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Incoming
              </h2>
              {companions.incoming.length === 0 && (
                <p className="text-sm text-muted-foreground">No incoming requests.</p>
              )}
              <div className="space-y-3">
                {companions.incoming.map((entry) => (
                  <div
                    key={entry.companionship.id}
                    className="flex items-center justify-between bg-card border border-border rounded-lg p-4"
                  >
                    <CardIdentity card={entry.card} />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={busy !== null}
                        onClick={() =>
                          act(
                            entry.companionship.id,
                            () => companions.respond(entry.companionship.id, "accepted"),
                            "Request accepted — you are now companions"
                          )
                        }
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy !== null}
                        onClick={() =>
                          act(
                            `decline-${entry.companionship.id}`,
                            () => companions.respond(entry.companionship.id, "declined"),
                            "Request declined"
                          )
                        }
                      >
                        <X className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Outgoing
              </h2>
              {companions.outgoing.length === 0 && (
                <p className="text-sm text-muted-foreground">No outgoing requests.</p>
              )}
              <div className="space-y-3">
                {companions.outgoing.map((entry) => (
                  <div
                    key={entry.companionship.id}
                    className="flex items-center justify-between bg-card border border-border rounded-lg p-4"
                  >
                    <CardIdentity card={entry.card} />
                    <div className="flex items-center gap-3">
                      <span className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        Pending
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy !== null}
                        onClick={() =>
                          act(
                            `cancel-${entry.companionship.id}`,
                            () => companions.remove(entry.companionship.id),
                            "Request cancelled"
                          )
                        }
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {!companions.loading && tab === "find" && (
          <div>
            <form
              className="flex gap-2 mb-6"
              onSubmit={(e) => {
                e.preventDefault();
                void runSearch();
              }}
            >
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search by username or name…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={searching || !query.trim()}>
                Search
              </Button>
            </form>

            <div className="space-y-3">
              {results.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between bg-card border border-border rounded-lg p-4"
                >
                  <CardIdentity card={r} />
                  <div>
                    {r.relationship === "self" && (
                      <span className="text-sm text-muted-foreground">You</span>
                    )}
                    {r.relationship === "companion" && (
                      <span className="text-sm text-success flex items-center">
                        <Check className="w-4 h-4 mr-1" />
                        Companions
                      </span>
                    )}
                    {r.relationship === "outgoing" && (
                      <span className="text-sm text-muted-foreground flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Requested
                      </span>
                    )}
                    {r.relationship === "incoming" && (
                      <Button
                        size="sm"
                        disabled={busy !== null}
                        onClick={() =>
                          act(
                            `accept-${r.companionshipId}`,
                            () => companions.respond(r.companionshipId!, "accepted"),
                            "Request accepted — you are now companions"
                          )
                        }
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept request
                      </Button>
                    )}
                    {r.relationship === "none" && (
                      <Button
                        size="sm"
                        disabled={busy !== null}
                        onClick={() =>
                          act(
                            `send-${r.id}`,
                            async () => {
                              await companions.sendRequest(r.id);
                              setResults(await companions.search(query));
                            },
                            "Request sent"
                          )
                        }
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Send request
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {!searching && results.length === 0 && query.trim() !== "" && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No results. Try a different name.
                </p>
              )}
            </div>
          </div>
        )}

        {!companions.loading && tab === "blocked" && (
          <div className="space-y-3">
            {companions.blocked.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                You haven&apos;t blocked anyone.
              </p>
            )}
            {companions.blocked.map((b) => (
              <div
                key={b.blocked_id}
                className="flex items-center justify-between bg-card border border-border rounded-lg p-4"
              >
                <CardIdentity card={b.card} />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy !== null}
                  onClick={() =>
                    act(`unblock-${b.blocked_id}`, () => companions.unblock(b.blocked_id), "User unblocked")
                  }
                >
                  <ShieldOff className="w-4 h-4 mr-1" />
                  Unblock
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
