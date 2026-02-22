import { afterEach, describe, expect, it } from 'vitest';

import {
  getStripeAppUrl,
  getStripeCheckoutConfig,
  getStripePortalConfig,
  getStripeWebhookConfig,
} from '../config';
import {
  STRIPE_OPTIONAL_ENV_KEYS,
  STRIPE_REQUIRED_CHECKOUT_ENV_KEYS,
  STRIPE_REQUIRED_WEBHOOK_ENV_KEYS,
} from '../contracts';

const originalEnv = { ...process.env };

function withEnv(overrides: Record<string, string | undefined>) {
  process.env = { ...originalEnv };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('stripe config contract', () => {
  it('defines required and optional env key contracts', () => {
    expect(STRIPE_REQUIRED_CHECKOUT_ENV_KEYS).toEqual([
      'STRIPE_SECRET_KEY',
      'STRIPE_PRICE_PRO_LIFETIME',
    ]);
    expect(STRIPE_REQUIRED_WEBHOOK_ENV_KEYS).toEqual(['STRIPE_WEBHOOK_SECRET']);
    expect(STRIPE_OPTIONAL_ENV_KEYS).toContain('STRIPE_BILLING_PORTAL_CONFIGURATION_ID');
  });

  it('builds checkout config from required env and normalized app url', () => {
    withEnv({
      STRIPE_SECRET_KEY: 'sk_test_123',
      STRIPE_PRICE_PRO_LIFETIME: 'price_123',
      APP_URL: 'https://atlas.example.com/',
    });

    expect(getStripeCheckoutConfig()).toEqual({
      secretKey: 'sk_test_123',
      proLifetimePriceId: 'price_123',
      appUrl: 'https://atlas.example.com',
    });
  });

  it('throws when checkout config required env is missing', () => {
    withEnv({
      STRIPE_SECRET_KEY: undefined,
      STRIPE_PRICE_PRO_LIFETIME: 'price_123',
      NEXTAUTH_URL: 'https://atlas.example.com',
    });

    expect(() => getStripeCheckoutConfig()).toThrow('Missing required env: STRIPE_SECRET_KEY');
  });

  it('throws when app url env is invalid', () => {
    withEnv({
      STRIPE_SECRET_KEY: 'sk_test_123',
      STRIPE_PRICE_PRO_LIFETIME: 'price_123',
      APP_URL: 'not-a-valid-url',
    });

    expect(() => getStripeAppUrl()).toThrow(
      'Invalid env: APP_URL/NEXT_PUBLIC_APP_URL/NEXTAUTH_URL must be a URL.',
    );
  });

  it('uses webhook tolerance env when valid, otherwise defaults', () => {
    withEnv({
      STRIPE_WEBHOOK_SECRET: 'whsec_123',
      BILLING_WEBHOOK_TOLERANCE_SECONDS: '120',
    });
    expect(getStripeWebhookConfig()).toEqual({
      webhookSecret: 'whsec_123',
      webhookToleranceSeconds: 120,
    });

    withEnv({
      STRIPE_WEBHOOK_SECRET: 'whsec_123',
      BILLING_WEBHOOK_TOLERANCE_SECONDS: '0',
    });
    expect(getStripeWebhookConfig()).toEqual({
      webhookSecret: 'whsec_123',
      webhookToleranceSeconds: 300,
    });
  });

  it('builds portal config with optional configuration id', () => {
    withEnv({
      STRIPE_SECRET_KEY: 'sk_test_123',
      NEXTAUTH_URL: 'https://atlas.example.com',
      STRIPE_BILLING_PORTAL_CONFIGURATION_ID: 'bpc_123',
    });

    expect(getStripePortalConfig()).toEqual({
      secretKey: 'sk_test_123',
      appUrl: 'https://atlas.example.com',
      portalConfigurationId: 'bpc_123',
    });
  });
});
