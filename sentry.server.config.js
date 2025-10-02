import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: "https://e45e12cd45f5de19cd27f3c1320249c3@o4507371130585088.ingest.us.sentry.io/4508447134121984",

  // Adds request headers and IP for users
  sendDefaultPii: true,

  integrations: [
    // send console.log, console.warn, and console.error calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});
