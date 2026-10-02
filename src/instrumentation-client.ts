// Error tracking for the browser. Off unless NEXT_PUBLIC_SENTRY_DSN is set at
// build time, so a deploy with no key configured just runs normally.
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || (process.env.NODE_ENV === 'production' ? 'production' : 'development'),
    tracesSampleRate: 0.1,
    // Not setting sendDefaultPii (it defaults to off): the portal handles
    // resumes and private messages, and Sentry should never see their content.
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
