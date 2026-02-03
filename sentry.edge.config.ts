import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;
const isEnabled =
  Boolean(dsn) &&
  (process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true');

Sentry.init({
  dsn: dsn ?? '',
  enabled: isEnabled,
  tracesSampleRate: 0,
});
