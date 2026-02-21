import { getServerSession } from 'next-auth/next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
    expect(mockedCreateStripeCheckoutSession).toHaveBeenCalledTimes(1);

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
});
