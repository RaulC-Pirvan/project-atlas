import { STRIPE_REQUIRED_CHECKOUT_ENV_KEYS, STRIPE_REQUIRED_WEBHOOK_ENV_KEYS } from './contracts';

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

export type StripePortalConfig = {
  secretKey: string;
  appUrl: string;
  portalConfigurationId: string | null;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function normalizeAppUrl(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('Invalid env: APP_URL/NEXT_PUBLIC_APP_URL/NEXTAUTH_URL must be a URL.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Invalid env: APP_URL/NEXT_PUBLIC_APP_URL/NEXTAUTH_URL must use http/https.');
  }

  return parsed.toString().replace(/\/$/, '');
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
  const [secretKeyEnv, priceIdEnv] = STRIPE_REQUIRED_CHECKOUT_ENV_KEYS;
  return {
    secretKey: requireEnv(secretKeyEnv),
    proLifetimePriceId: requireEnv(priceIdEnv),
    appUrl: getStripeAppUrl(),
  };
}

export function getStripeWebhookConfig(): StripeWebhookConfig {
  const tolerance = Number(process.env.BILLING_WEBHOOK_TOLERANCE_SECONDS ?? '');
  const [webhookSecretEnv] = STRIPE_REQUIRED_WEBHOOK_ENV_KEYS;
  return {
    webhookSecret: requireEnv(webhookSecretEnv),
    webhookToleranceSeconds:
      Number.isInteger(tolerance) && tolerance > 0 ? tolerance : DEFAULT_WEBHOOK_TOLERANCE_SECONDS,
  };
}

export function getStripePortalConfig(): StripePortalConfig {
  const [secretKeyEnv] = STRIPE_REQUIRED_CHECKOUT_ENV_KEYS;
  const portalConfigurationIdRaw = process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID?.trim();

  return {
    secretKey: requireEnv(secretKeyEnv),
    appUrl: getStripeAppUrl(),
    portalConfigurationId: portalConfigurationIdRaw ? portalConfigurationIdRaw : null,
  };
}
