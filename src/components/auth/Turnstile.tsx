"use client";

import * as React from "react";

/**
 * Cloudflare Turnstile — a bot check that does not make people identify
 * traffic lights, and does not profile them the way reCAPTCHA does.
 *
 * Renders nothing at all unless NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, so
 * development, CI and any deploy without a key behave exactly as before.
 * Supabase verifies the token server-side against the matching secret, so
 * nothing here is trusted on its own.
 *
 * This loads a script from Cloudflare, which is the one external script the
 * app carries — deliberately, because there is no self-hosted way to run a
 * challenge that a bot cannot simply skip. Fonts and everything else remain
 * self-hosted.
 */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      remove: (id: string) => void;
    };
  }
}

/** True when a key is configured; callers use it to require a token or not. */
export const turnstileEnabled = Boolean(SITE_KEY);

export function Turnstile({
  onToken,
}: {
  onToken: (token: string | null) => void;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const widgetId = React.useRef<string | null>(null);
  // Keep the latest callback without re-rendering the widget.
  const cb = React.useRef(onToken);
  cb.current = onToken;

  React.useEffect(() => {
    if (!SITE_KEY || !ref.current) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const render = () => {
      if (cancelled || !ref.current || !window.turnstile) return;
      if (widgetId.current) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        theme: "auto",
        callback: (token) => cb.current(token),
        "expired-callback": () => cb.current(null),
        "error-callback": () => cb.current(null),
      });
    };

    // Wait on the API itself rather than on a load event. Equivalent in the
    // ordinary case, but it does not care whether this mount is the one that
    // added the script, so a remount cannot end up listening for an event
    // that has already fired, and repeated mounts do not stack listeners.
    const waitForApi = () => {
      if (cancelled) return;
      if (window.turnstile) {
        render();
        return;
      }
      timer = setTimeout(waitForApi, 100);
    };

    if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    waitForApi();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={ref} className="flex justify-center my-2" />;
}
