"use client";

import * as React from "react";
import { ShieldCheck, ShieldOff, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";

/**
 * Two-factor authentication (TOTP).
 *
 * Uses Supabase's built-in MFA, which is already enabled on the project, so
 * this is entirely a matter of enrolment and verification — no secret of ours
 * is involved and no code of ours ever handles the shared key beyond showing
 * it once for the reader to store.
 *
 * Optional by design: an account without a second factor keeps working
 * exactly as before. Turning it on is a choice, and turning it off requires
 * the same app that turned it on.
 */
interface Factor {
  id: string;
  friendly_name?: string;
  status: string;
}

export function TwoFactor() {
  const supabase = React.useMemo(() => createClient(), []);
  const { success, error: showError } = useToast();

  const [factors, setFactors] = React.useState<Factor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);

  // Enrolment in progress.
  const [pending, setPending] = React.useState<{
    factorId: string;
    qr: string;
    secret: string;
  } | null>(null);
  const [code, setCode] = React.useState("");

  const refresh = React.useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error) {
      setFactors(((data?.totp ?? []) as Factor[]).filter((f) => f.status === "verified"));
    }
    setLoading(false);
  }, [supabase]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const beginEnrol = async () => {
    setBusy(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)}`,
    });
    setBusy(false);
    if (error || !data) {
      showError(error?.message ?? "Could not start setup.");
      return;
    }
    setCode("");
    setPending({
      factorId: data.id,
      qr: data.totp.qr_code,
      secret: data.totp.secret,
    });
  };

  const confirmEnrol = async () => {
    if (!pending) return;
    setBusy(true);
    const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({
      factorId: pending.factorId,
    });
    if (chErr || !ch) {
      setBusy(false);
      showError(chErr?.message ?? "Could not verify. Please try again.");
      return;
    }
    const { error } = await supabase.auth.mfa.verify({
      factorId: pending.factorId,
      challengeId: ch.id,
      code: code.trim(),
    });
    setBusy(false);
    if (error) {
      showError("That code was not accepted. Check your authenticator and try again.");
      return;
    }
    setPending(null);
    setCode("");
    await refresh();
    success("Two-factor authentication is on");
  };

  const cancelEnrol = async () => {
    if (pending) await supabase.auth.mfa.unenroll({ factorId: pending.factorId });
    setPending(null);
    setCode("");
  };

  const remove = async (factorId: string) => {
    setBusy(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setBusy(false);
    if (error) {
      showError(error.message);
      return;
    }
    await refresh();
    success("Two-factor authentication is off");
  };

  const enabled = factors.length > 0;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        {enabled ? (
          <ShieldCheck className="w-5 h-5 text-accent-strong mt-0.5" aria-hidden="true" />
        ) : (
          <ShieldOff className="w-5 h-5 text-muted-foreground mt-0.5" aria-hidden="true" />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {enabled ? "Two-factor authentication is on" : "Two-factor authentication is off"}
          </p>
          <p className="text-sm text-muted-foreground">
            {enabled
              ? "Signing in asks for a code from your authenticator app as well as your password."
              : "Add a code from an authenticator app to your sign-in, so a password alone is not enough."}
          </p>
        </div>
      </div>

      {pending ? (
        <div className="rounded-lg border border-border bg-background p-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              1. Scan this with your authenticator app
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Any TOTP app works — Google Authenticator, Aegis, 1Password, Raivo.
            </p>
            {/* Supabase returns the QR as an SVG data URI. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pending.qr}
              alt="QR code for setting up two-factor authentication"
              className="w-44 h-44 bg-white rounded-md p-2"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Or enter this key by hand
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono bg-muted px-2 py-1.5 rounded break-all">
                {pending.secret}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(pending.secret);
                  success("Key copied");
                }}
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div>
            <label
              htmlFor="mfa-code"
              className="block text-sm font-medium text-foreground mb-1"
            >
              2. Enter the six-digit code it shows
            </label>
            <input
              id="mfa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-40 px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={confirmEnrol} disabled={busy || code.length !== 6} size="sm">
              {busy ? "Checking…" : "Turn on"}
            </Button>
            <Button variant="ghost" size="sm" onClick={cancelEnrol} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      ) : enabled ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => remove(factors[0].id)}
          disabled={busy}
        >
          Turn off two-factor authentication
        </Button>
      ) : (
        <Button size="sm" onClick={beginEnrol} disabled={busy}>
          {busy ? "Preparing…" : "Set up two-factor authentication"}
        </Button>
      )}
    </div>
  );
}
