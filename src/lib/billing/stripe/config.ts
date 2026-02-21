const DEFAULT_APP_URL = 'http://localhost:3000';
const DEFAULT_WEBHOOK_TOLERANCE_SECONDS = 300;

export type StripeCheckoutConfig = {
  secretKey: string;
  proLifetimePriceId: string;
  appUrl: string;
};

export type StripeWebhookConfig = {
  webhookSecret: string;
  webhookToleranceSeconds: number;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function normalizeAppUrl(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export function getStripeAppUrl(): string {
  const appUrl =
    process.env.APP_URL?.trim() ??
    process.env.NEXT_PUBLIC_APP_URL?.trim() ??
    process.env.NEXTAUTH_URL?.trim() ??
    DEFAULT_APP_URL;

  return normalizeAppUrl(appUrl);
}

export function getStripeCheckoutConfig(): StripeCheckoutConfig {
  return {
    secretKey: requireEnv('STRIPE_SECRET_KEY'),
    proLifetimePriceId: requireEnv('STRIPE_PRICE_PRO_LIFETIME'),
    appUrl: getStripeAppUrl(),
  };
}

export function getStripeWebhookConfig(): StripeWebhookConfig {
  const tolerance = Number(process.env.BILLING_WEBHOOK_TOLERANCE_SECONDS ?? '');
  return {
    webhookSecret: requireEnv('STRIPE_WEBHOOK_SECRET'),
    webhookToleranceSeconds:
      Number.isInteger(tolerance) && tolerance > 0 ? tolerance : DEFAULT_WEBHOOK_TOLERANCE_SECONDS,
  };
}
