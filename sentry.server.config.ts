import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  // No-op when no DSN is configured (local dev without Sentry).
  enabled: Boolean(dsn),
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  tracesSampleRate: 0.1,

  // An error should say what broke, not who was reading what when it broke.
  // Cookies carry the session; query strings carry whatever someone searched.
  sendDefaultPii: false,
  beforeSend(event) {
    if (event.request?.cookies) delete event.request.cookies;
    if (event.request?.headers) {
      delete event.request.headers.cookie;
      delete event.request.headers.authorization;
    }
    if (event.request?.query_string) delete event.request.query_string;
    return event;
  },
});
