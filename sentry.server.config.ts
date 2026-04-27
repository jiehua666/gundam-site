import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://26df8ff11384742b685b38f7d11a897f@o4511273637838848.ingest.de.sentry.io/4511273651470416",
  tracesSampleRate: 1,
  enableLogs: true,
  sendDefaultPii: true,
});
