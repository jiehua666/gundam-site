import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // We recommend adjusting this value in production
  tracesSampleRate: 1,

  // Enable debug mode to see Sentry logs in console
  debug: false,

  // Set environment
  environment: process.env.NODE_ENV,

  // Enable session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
});
