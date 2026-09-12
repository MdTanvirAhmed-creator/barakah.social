"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Mithaq } from "@/components/auth/Mithaq";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";

/** Bump when the Mithaq text changes, so members re-consent to the new one. */
const MITHAQ_VERSION = "1";

/**
 * The threshold.
 *
 * Signing up by email walks through the Mithaq on the way in. Signing in with
 * Google does not — it lands straight on the feed, which meant a member could
 * be posting before ever seeing the covenant. Worse, acceptance was never
 * recorded for anyone, so there was no way to say who had agreed to what.
 *
 * This is where anyone without a recorded acceptance is sent. Reading the
 * platform is open; contributing is not, and the database enforces that
 * (has_accepted_mithaq, migration 30) rather than trusting this page.
 *
 * People arriving here from Google also have no username of their own — the
 * trigger gave them one like user_a1b2c3d4 — so they choose it here, along
 * with how they are named to others.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const { success, error: showError } = useToast();

  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [generatedUsername, setGeneratedUsername] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("username, full_name, mithaq_accepted_at")
        .eq("id", user.id)
        .single();
      if (cancelled) return;

      if (profile?.mithaq_accepted_at) {
        router.replace("/feed");
        return;
      }
      // A username the trigger invented, not one they chose.
      const auto = /^user_[0-9a-f]{8}$/.test(profile?.username ?? "");
      setGeneratedUsername(auto);
      setUsername(auto ? "" : profile?.username ?? "");
      setFullName(profile?.full_name === "Anonymous User" ? "" : profile?.full_name ?? "");
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  const usernameValid = /^[a-zA-Z0-9_]{3,30}$/.test(username);

  const accept = async () => {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      router.replace("/login");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("profiles")
      .update({
        username,
        full_name: fullName.trim() || username,
        mithaq_accepted_at: new Date().toISOString(),
        mithaq_version: MITHAQ_VERSION,
      })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      showError(
        /duplicate|unique/i.test(error.message)
          ? "That username is already taken."
          : "Could not save. Please try again."
      );
      return;
    }
    success("Welcome. May it be of benefit.");
    router.replace("/feed");
    router.refresh();
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl text-foreground">Before you enter</h1>
          <p className="text-foreground-secondary">
            This is the covenant every member of Barakah.social keeps with the
            others. Please read it in full.
          </p>
        </div>

        <Mithaq onScrollComplete={setHasScrolled} hasScrolledToBottom={hasScrolled} />

        <div className="space-y-5 bg-card border border-border rounded-lg p-6">
          {generatedUsername && (
            <p className="text-sm text-foreground-secondary">
              Choose how you appear here. You were given a temporary name when
              your account was created.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="onboarding-username">Username</Label>
            <Input
              id="onboarding-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. abu_yusuf"
              aria-describedby="onboarding-username-help"
            />
            <p id="onboarding-username-help" className="text-xs text-muted-foreground">
              Letters, numbers and underscores. Between 3 and 30 characters.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="onboarding-name">Display name</Label>
            <Input
              id="onboarding-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="How others will see you"
            />
            <p className="text-xs text-muted-foreground">
              This is shown on everything you write. It need not be your legal
              name.
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              disabled={!hasScrolled}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-border accent-primary-600 disabled:opacity-40"
            />
            <span className="text-sm text-foreground">
              I have read the Mithaq and I accept it.
              {!hasScrolled && (
                <span className="block text-xs text-muted-foreground mt-0.5">
                  Please read to the end first.
                </span>
              )}
            </span>
          </label>

          <Button
            onClick={accept}
            disabled={!accepted || !usernameValid || saving}
            className="w-full bg-primary-600 hover:bg-primary-700"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Accept and enter"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
