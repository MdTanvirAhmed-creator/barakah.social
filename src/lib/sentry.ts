// Sentry Error Tracking Configuration
// Uncomment and configure when ready to use Sentry

/*
import * as Sentry from "@sentry/nextjs";

export function initSentry() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      
      // Performance Monitoring
      tracesSampleRate: 1.0,
      
      // Session Replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      
      // Environment
      environment: process.env.NODE_ENV,
      
      // Release tracking
      release: process.env.NEXT_PUBLIC_APP_VERSION,
      
      // Ignore errors
      ignoreErrors: [
        "ResizeObserver loop limit exceeded",
        "Non-Error promise rejection captured",
      ],
      
      // Before send hook
      beforeSend(event, hint) {
        // Filter out sensitive information
        if (event.request) {
          delete event.request.cookies;
        }
        return event;
      },
    });
  }
}

// Custom error capture with context
export function captureError(error: Error, context?: Record<string, any>) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, {
      contexts: {
        custom: context,
      },
    });
  } else {
    console.error("Error:", error, "Context:", context);
  }
}

// Performance monitoring
export function capturePerformance(name: string, duration: number) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.metrics.distribution(name, duration, {
      unit: "millisecond",
    });
  }
}
*/

// Placeholder implementations for when Sentry is not configured
export function initSentry() {
  console.log("Sentry not configured. Add NEXT_PUBLIC_SENTRY_DSN to enable.");
}

export function captureError(error: Error, context?: Record<string, any>) {
  console.error("Error:", error, "Context:", context);
}

export function capturePerformance(name: string, duration: number) {
  console.log(`Performance: ${name} took ${duration}ms`);
}
