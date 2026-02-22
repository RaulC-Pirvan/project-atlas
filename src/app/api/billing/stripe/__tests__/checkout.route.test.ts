import { getServerSession } from 'next-auth/next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createStripeCheckoutSession } from '../../../../../lib/billing/stripe/checkout';
import { getStripeCheckoutConfig } from '../../../../../lib/billing/stripe/config';
import { getProEntitlementSummary } from '../../../../../lib/pro/entitlement';
import { GET } from '../checkout/route';

const { billingProductMappingUpsertMock } = vi.hoisted(() => ({
  billingProductMappingUpsertMock: vi.fn(),
}));

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('../../../../../lib/db/prisma', () => ({
  prisma: {
    billingProductMapping: {
      upsert: billingProductMappingUpsertMock,
    },
  },
}));
vi.mock('../../../../../lib/pro/entitlement', () => ({ getProEntitlementSummary: vi.fn() }));
vi.mock('../../../../../lib/billing/stripe/config', () => ({ getStripeCheckoutConfig: vi.fn() }));
vi.mock('../../../../../lib/billing/stripe/checkout', () => ({
  createStripeCheckoutSession: vi.fn(),
}));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedGetProEntitlementSummary = vi.mocked(getProEntitlementSummary);
const mockedGetStripeCheckoutConfig = vi.mocked(getStripeCheckoutConfig);
const mockedCreateStripeCheckoutSession = vi.mocked(createStripeCheckoutSession);

describe('GET /api/billing/stripe/checkout', () => {
  const previousTestMode = process.env.BILLING_STRIPE_TEST_MODE;
  const previousTestCheckoutUrl = process.env.BILLING_STRIPE_TEST_CHECKOUT_URL;

  beforeEach(() => {
    mockedGetServerSession.mockReset();
    mockedGetProEntitlementSummary.mockReset();
    mockedGetStripeCheckoutConfig.mockReset();
    mockedCreateStripeCheckoutSession.mockReset();
    billingProductMappingUpsertMock.mockReset();

    mockedGetStripeCheckoutConfig.mockReturnValue({
      secretKey: 'sk_test_123',
      proLifetimePriceId: 'price_123',
      appUrl: 'http://localhost:3000',
    });
    mockedCreateStripeCheckoutSession.mockResolvedValue({
      id: 'cs_test_1',
      url: 'https://checkout.stripe.test/session/cs_test_1',
    });
    billingProductMappingUpsertMock.mockResolvedValue({
      id: 'mapping-1',
    });
    delete process.env.BILLING_STRIPE_TEST_MODE;
    delete process.env.BILLING_STRIPE_TEST_CHECKOUT_URL;
  });

  afterEach(() => {
    if (previousTestMode === undefined) {
      delete process.env.BILLING_STRIPE_TEST_MODE;
    } else {
      process.env.BILLING_STRIPE_TEST_MODE = previousTestMode;
    }
    if (previousTestCheckoutUrl === undefined) {
      delete process.env.BILLING_STRIPE_TEST_CHECKOUT_URL;
    } else {
      process.env.BILLING_STRIPE_TEST_CHECKOUT_URL = previousTestCheckoutUrl;
    }
  });

  it('creates hosted checkout and redirects authenticated users', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGetProEntitlementSummary.mockResolvedValue({
      isPro: false,
      status: 'none',
    });

    const response = await GET(new Request('https://example.com/api/billing/stripe/checkout'));
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://checkout.stripe.test/session/cs_test_1');
    expect(billingProductMappingUpsertMock).toHaveBeenCalledTimes(1);
    expect(mockedCreateStripeCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        productKey: 'pro_lifetime_v1',
        priceId: 'price_123',
      }),
    );

    const logLines = logSpy.mock.calls.map((args) => String(args[0]));
    expect(logLines.some((line) => line.includes('"message":"billing.checkout.initiated"'))).toBe(
      true,
    );
    expect(logLines.some((line) => line.includes('"message":"billing.checkout.redirect"'))).toBe(
      true,
    );

    logSpy.mockRestore();
  });

  it('rejects unauthenticated requests', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedGetServerSession.mockResolvedValue(null);

    const response = await GET(new Request('https://example.com/api/billing/stripe/checkout'));
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('unauthorized');

    errorSpy.mockRestore();
  });

  it('blocks checkout when user already has active pro', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGetProEntitlementSummary.mockResolvedValue({
      isPro: true,
      status: 'active',
      source: 'manual',
    });

    const response = await GET(new Request('https://example.com/api/billing/stripe/checkout'));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('invalid_request');
    expect(mockedCreateStripeCheckoutSession).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('returns service-unavailable response when stripe env is missing', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGetProEntitlementSummary.mockResolvedValue({
      isPro: false,
      status: 'none',
    });
    mockedGetStripeCheckoutConfig.mockImplementation(() => {
      throw new Error('Missing required env: STRIPE_SECRET_KEY');
    });

    const response = await GET(new Request('https://example.com/api/billing/stripe/checkout'));
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('internal_error');
    expect(body.error.recovery).toBe('retry_later');
    expect(body.error.message).toBe('Checkout is temporarily unavailable. Please try again later.');
    expect(mockedCreateStripeCheckoutSession).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('returns internal error when Stripe session creation fails upstream', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGetProEntitlementSummary.mockResolvedValue({
      isPro: false,
      status: 'none',
    });
    mockedCreateStripeCheckoutSession.mockRejectedValue(
      new Error('Stripe checkout session creation failed.'),
    );

    const response = await GET(new Request('https://example.com/api/billing/stripe/checkout'));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('internal_error');
    expect(body.error.message).toBe('Internal server error.');

    errorSpy.mockRestore();
  });

  it('uses deterministic test-mode checkout redirect without calling Stripe API', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    process.env.BILLING_STRIPE_TEST_MODE = 'true';
    process.env.BILLING_STRIPE_TEST_CHECKOUT_URL = 'https://checkout.stripe.test/session/custom';

    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGetProEntitlementSummary.mockResolvedValue({
      isPro: false,
      status: 'none',
    });

    const response = await GET(new Request('https://example.com/api/billing/stripe/checkout'));
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://checkout.stripe.test/session/custom');
    expect(mockedCreateStripeCheckoutSession).not.toHaveBeenCalled();

    const logLines = logSpy.mock.calls.map((args) => String(args[0]));
    expect(logLines.some((line) => line.includes('"message":"billing.checkout.redirect"'))).toBe(
      true,
    );
    expect(logLines.some((line) => line.includes('"testMode":true'))).toBe(true);

    logSpy.mockRestore();
  });
});
