import * as Sentry from "@sentry/nextjs";

/**
 * Browser-side errors — which on a React application is most of what there is
 * to learn. Server and edge were configured; the client never was, so every
 * crash a member actually experienced went unreported.
 *
 * Only NEXT_PUBLIC_SENTRY_DSN here: this file ships to the browser, so a
 * server-only variable would simply be undefined and Sentry would quietly do
 * nothing.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  // No-op without a DSN, so local development and any keyless deploy behave
  // exactly as before.
  enabled: Boolean(dsn),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  tracesSampleRate: 0.1,

  // Session Replay is deliberately off. It records what people do on screen,
  // and this platform holds private religious discussion between companions —
  // exactly the material nobody agreed to have replayed to an administrator.
  //
  // Sample rates of zero would be enough, but they are a number someone could
  // change without thinking. Dropping the integration entirely means replay
  // cannot be switched on from the Sentry dashboard, and the replay code is
  // not shipped to anyone's browser at all.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  integrations: (defaults) =>
    defaults.filter((integration) => !/replay/i.test(integration.name)),

  // Keep personal data out of error reports. An error should say what broke,
  // not who was reading what when it broke.
  sendDefaultPii: false,
  beforeSend(event) {
    if (event.request?.cookies) delete event.request.cookies;
    if (event.request?.headers) {
      delete event.request.headers.cookie;
      delete event.request.headers.authorization;
    }
    // Query strings can carry a search someone typed; the path is enough.
    if (event.request?.query_string) delete event.request.query_string;
    return event;
  },
});

/** Lets Sentry tie a slow navigation to the route that caused it. */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
