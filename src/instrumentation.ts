// Error tracking for the server and edge runtimes. Off unless SENTRY_DSN is
// set, same as the browser side in instrumentation-client.ts.
export async function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  const Sentry = await import('@sentry/nextjs');
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || (process.env.NODE_ENV === 'production' ? 'production' : 'development'),
    tracesSampleRate: 0.1,
    // Not setting sendDefaultPii (it defaults to off): the portal handles
    // resumes and private messages, and Sentry should never see their content.
  });
}

export const onRequestError = async (...args: Parameters<NonNullable<typeof import('@sentry/nextjs').captureRequestError>>) => {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import('@sentry/nextjs');
  Sentry.captureRequestError(...args);
};
