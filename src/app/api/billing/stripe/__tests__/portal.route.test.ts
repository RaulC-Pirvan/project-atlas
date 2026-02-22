import { getServerSession } from 'next-auth/next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getStripePortalConfig } from '../../../../../lib/billing/stripe/config';
import { createStripeBillingPortalSession } from '../../../../../lib/billing/stripe/portal';
import { findLatestStripeCompletedCheckout } from '../../../../../lib/billing/stripe/restore';
import { GET } from '../portal/route';

const { billingEntitlementProjectionFindUniqueMock, billingEntitlementProjectionUpdateMock } =
  vi.hoisted(() => ({
    billingEntitlementProjectionFindUniqueMock: vi.fn(),
    billingEntitlementProjectionUpdateMock: vi.fn(),
  }));

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('../../../../../lib/db/prisma', () => ({
  prisma: {
    billingEntitlementProjection: {
      findUnique: billingEntitlementProjectionFindUniqueMock,
      update: billingEntitlementProjectionUpdateMock,
    },
  },
}));
vi.mock('../../../../../lib/billing/stripe/config', () => ({ getStripePortalConfig: vi.fn() }));
vi.mock('../../../../../lib/billing/stripe/portal', () => ({
  createStripeBillingPortalSession: vi.fn(),
}));
vi.mock('../../../../../lib/billing/stripe/restore', () => ({
  findLatestStripeCompletedCheckout: vi.fn(),
}));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedGetStripePortalConfig = vi.mocked(getStripePortalConfig);
const mockedCreateStripeBillingPortalSession = vi.mocked(createStripeBillingPortalSession);
const mockedFindLatestStripeCompletedCheckout = vi.mocked(findLatestStripeCompletedCheckout);

describe('GET /api/billing/stripe/portal', () => {
  beforeEach(() => {
    mockedGetServerSession.mockReset();
    mockedGetStripePortalConfig.mockReset();
    mockedCreateStripeBillingPortalSession.mockReset();
    mockedFindLatestStripeCompletedCheckout.mockReset();
    billingEntitlementProjectionFindUniqueMock.mockReset();
    billingEntitlementProjectionUpdateMock.mockReset();

    mockedGetStripePortalConfig.mockReturnValue({
      secretKey: 'sk_test_123',
      appUrl: 'http://localhost:3000',
      portalConfigurationId: 'bpc_123',
    });
    mockedCreateStripeBillingPortalSession.mockResolvedValue({
      id: 'bps_123',
      url: 'https://billing.stripe.test/session/bps_123',
    });
    billingEntitlementProjectionUpdateMock.mockResolvedValue({});
  });

  it('redirects to billing portal for authenticated users with known stripe customer', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    billingEntitlementProjectionFindUniqueMock.mockResolvedValue({
      provider: 'stripe',
      providerCustomerId: 'cus_123',
    });

    const response = await GET(new Request('https://example.com/api/billing/stripe/portal'));

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://billing.stripe.test/session/bps_123');
    expect(mockedFindLatestStripeCompletedCheckout).not.toHaveBeenCalled();
    expect(mockedCreateStripeBillingPortalSession).toHaveBeenCalledWith({
      secretKey: 'sk_test_123',
      customerId: 'cus_123',
      returnUrl: 'http://localhost:3000/account',
      configurationId: 'bpc_123',
    });

    logSpy.mockRestore();
  });

  it('falls back to Stripe checkout lookup when projection has no customer id', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    billingEntitlementProjectionFindUniqueMock.mockResolvedValue({
      provider: 'stripe',
      providerCustomerId: null,
    });
    mockedFindLatestStripeCompletedCheckout.mockResolvedValue({
      checkoutSessionId: 'cs_123',
      paymentIntentId: 'pi_123',
      customerId: 'cus_lookup',
      amountTotal: 1999,
      currency: 'USD',
      createdAt: new Date('2026-02-21T10:00:00.000Z'),
    });

    const response = await GET(new Request('https://example.com/api/billing/stripe/portal'));

    expect(response.status).toBe(303);
    expect(mockedFindLatestStripeCompletedCheckout).toHaveBeenCalledWith({
      secretKey: 'sk_test_123',
      userId: 'user-1',
      productKey: 'pro_lifetime_v1',
    });
    expect(billingEntitlementProjectionUpdateMock).toHaveBeenCalledWith({
      where: {
        userId_productKey: {
          userId: 'user-1',
          productKey: 'pro_lifetime_v1',
        },
      },
      data: {
        providerCustomerId: 'cus_lookup',
      },
    });

    logSpy.mockRestore();
  });

  it('rejects unauthenticated requests', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedGetServerSession.mockResolvedValue(null);

    const response = await GET(new Request('https://example.com/api/billing/stripe/portal'));
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('unauthorized');

    errorSpy.mockRestore();
  });

  it('returns not_found when no stripe customer could be resolved', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    billingEntitlementProjectionFindUniqueMock.mockResolvedValue({
      provider: 'stripe',
      providerCustomerId: null,
    });
    mockedFindLatestStripeCompletedCheckout.mockResolvedValue(null);

    const response = await GET(new Request('https://example.com/api/billing/stripe/portal'));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('not_found');

    errorSpy.mockRestore();
  });

  it('returns service-unavailable response when stripe env is missing', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGetStripePortalConfig.mockImplementation(() => {
      throw new Error('Missing required env: STRIPE_SECRET_KEY');
    });

    const response = await GET(new Request('https://example.com/api/billing/stripe/portal'));
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('internal_error');
    expect(body.error.recovery).toBe('retry_later');
    expect(mockedCreateStripeBillingPortalSession).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
