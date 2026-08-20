"use client";

import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

/**
 * The second step of signing in, for accounts that have a factor enrolled.
 *
 * Supabase issues a session at AAL1 once the password is accepted; the
 * account is not truly signed in until that session is raised to AAL2. This
 * prompt does that, and refuses to let the reader past until it succeeds.
 */
export function MfaChallenge({
  onVerified,
  onCancel,
}: {
  onVerified: () => void;
  onCancel: () => void;
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { data: list, error: listErr } = await supabase.auth.mfa.listFactors();
    const factor = list?.totp?.find((f) => f.status === "verified");
    if (listErr || !factor) {
      setBusy(false);
      setError("No authenticator is registered for this account.");
      return;
    }
    const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({
      factorId: factor.id,
    });
    if (chErr || !ch) {
      setBusy(false);
      setError(chErr?.message ?? "Could not start verification.");
      return;
    }
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: ch.id,
      code: code.trim(),
    });
    setBusy(false);
    if (vErr) {
      setError("That code was not accepted. Codes change every 30 seconds — try the current one.");
      setCode("");
      return;
    }
    onVerified();
  };

  return (
    <form onSubmit={verify} className="space-y-4">
      <div className="flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-accent-strong mt-0.5" aria-hidden="true" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">One more step</h2>
          <p className="text-sm text-foreground-secondary">
            Enter the six-digit code from your authenticator app.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="mfa-login-code" className="sr-only">
          Authentication code
        </label>
        <input
          id="mfa-login-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          aria-invalid={!!error}
          aria-describedby={error ? "mfa-login-error" : undefined}
          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-center text-xl font-mono tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
        {error && (
          <p id="mfa-login-error" role="alert" className="mt-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={busy || code.length !== 6} className="flex-1">
          {busy ? "Checking…" : "Verify"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
