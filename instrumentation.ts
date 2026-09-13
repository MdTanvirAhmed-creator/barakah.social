/**
 * Next.js loads this once per server runtime, and it is what actually pulls
 * the Sentry configs in. Without it, sentry.server.config.ts and
 * sentry.edge.config.ts sit in the repository looking configured and are
 * never executed — the SDK was installed and wired into next.config, but
 * nothing loaded it.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

/**
 * Server-side errors thrown while rendering, in route handlers and in server
 * actions. Next.js calls this; Sentry does not see them otherwise.
 */
export async function onRequestError(
  ...args: Parameters<typeof import("@sentry/nextjs").captureRequestError>
) {
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
}
