import { getServerSession } from 'next-auth/next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { appendBillingEventAndProject } from '../../../../lib/billing/persistence';
import { getStripePortalConfig } from '../../../../lib/billing/stripe/config';
import { findLatestStripeCompletedCheckout } from '../../../../lib/billing/stripe/restore';
import { getProEntitlementSummary } from '../../../../lib/pro/entitlement';
import { POST } from '../restore/route';

const { billingEventLedgerFindFirstMock, billingEntitlementProjectionFindUniqueMock } = vi.hoisted(
  () => ({
    billingEventLedgerFindFirstMock: vi.fn(),
    billingEntitlementProjectionFindUniqueMock: vi.fn(),
  }),
);

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('../../../../lib/db/prisma', () => ({
  prisma: {
    billingEventLedger: {
      findFirst: billingEventLedgerFindFirstMock,
    },
    billingEntitlementProjection: {
      findUnique: billingEntitlementProjectionFindUniqueMock,
    },
  },
}));
vi.mock('../../../../lib/billing/persistence', () => ({ appendBillingEventAndProject: vi.fn() }));
vi.mock('../../../../lib/billing/stripe/config', () => ({ getStripePortalConfig: vi.fn() }));
vi.mock('../../../../lib/billing/stripe/restore', () => ({
  findLatestStripeCompletedCheckout: vi.fn(),
}));
vi.mock('../../../../lib/pro/entitlement', () => ({ getProEntitlementSummary: vi.fn() }));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedAppendBillingEventAndProject = vi.mocked(appendBillingEventAndProject);
const mockedGetStripePortalConfig = vi.mocked(getStripePortalConfig);
const mockedFindLatestStripeCompletedCheckout = vi.mocked(findLatestStripeCompletedCheckout);
const mockedGetProEntitlementSummary = vi.mocked(getProEntitlementSummary);

describe('POST /api/pro/restore', () => {
  const previousBillingStripeTestMode = process.env.BILLING_STRIPE_TEST_MODE;

  beforeEach(() => {
    mockedGetServerSession.mockReset();
    mockedAppendBillingEventAndProject.mockReset();
    mockedGetStripePortalConfig.mockReset();
    mockedFindLatestStripeCompletedCheckout.mockReset();
    mockedGetProEntitlementSummary.mockReset();
    billingEventLedgerFindFirstMock.mockReset();
    billingEntitlementProjectionFindUniqueMock.mockReset();
    delete process.env.BILLING_STRIPE_TEST_MODE;

    mockedGetStripePortalConfig.mockReturnValue({
      secretKey: 'sk_test_123',
      appUrl: 'http://localhost:3000',
      portalConfigurationId: null,
    });
    mockedAppendBillingEventAndProject.mockResolvedValue({
      appended: true,
      dedupeReason: null,
      ledgerEvent: {
        id: 'event-row-1',
        eventId: 'event-1',
        userId: 'user-1',
        provider: 'stripe',
        providerEventId: null,
        providerTransactionId: null,
        idempotencyKey: null,
        productKey: 'pro_lifetime_v1',
        planType: 'one_time',
        eventType: 'restore_requested',
        occurredAt: new Date('2026-02-21T09:00:00.000Z'),
        receivedAt: new Date('2026-02-21T09:00:05.000Z'),
        payload: {},
        payloadHash: null,
        signatureVerified: null,
        createdAt: new Date('2026-02-21T09:00:05.000Z'),
      },
      projection: {
        userId: 'user-1',
        productKey: 'pro_lifetime_v1',
        planType: 'one_time',
        status: 'none',
        provider: null,
        providerCustomerId: null,
        providerAccountId: null,
        activeFrom: null,
        activeUntil: null,
        periodStart: null,
        periodEnd: null,
        autoRenew: null,
        lastEventId: 'event-1',
        lastEventType: 'restore_requested',
        updatedAt: new Date('2026-02-21T09:00:05.000Z'),
        version: 1,
      },
    });
  });

  afterEach(() => {
    if (previousBillingStripeTestMode === undefined) {
      delete process.env.BILLING_STRIPE_TEST_MODE;
    } else {
      process.env.BILLING_STRIPE_TEST_MODE = previousBillingStripeTestMode;
    }
  });

  it('returns already_active when user already has pro', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGetProEntitlementSummary.mockResolvedValue({
      isPro: true,
      status: 'active',
      source: 'stripe',
      restoredAt: new Date('2026-02-21T09:00:00.000Z'),
      updatedAt: new Date('2026-02-21T09:00:05.000Z'),
    });

    const response = await POST(
      new Request('https://example.com/api/pro/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'account' }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.outcome).toBe('already_active');
    expect(mockedAppendBillingEventAndProject).not.toHaveBeenCalled();
    expect(mockedFindLatestStripeCompletedCheckout).not.toHaveBeenCalled();

    logSpy.mockRestore();
  });

  it('restores entitlement when a completed stripe checkout exists', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGetProEntitlementSummary
      .mockResolvedValueOnce({
        isPro: false,
        status: 'none',
      })
      .mockResolvedValueOnce({
        isPro: true,
        status: 'active',
        source: 'stripe',
        restoredAt: new Date('2026-02-21T09:00:00.000Z'),
        updatedAt: new Date('2026-02-21T09:00:05.000Z'),
      });
    mockedFindLatestStripeCompletedCheckout.mockResolvedValue({
      checkoutSessionId: 'cs_123',
      paymentIntentId: 'pi_123',
      customerId: 'cus_123',
      amountTotal: 1999,
      currency: 'USD',
      createdAt: new Date('2026-02-21T09:00:00.000Z'),
    });

    const response = await POST(
      new Request('https://example.com/api/pro/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'account' }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.outcome).toBe('restored');
    expect(mockedAppendBillingEventAndProject).toHaveBeenCalledTimes(2);
    expect(mockedAppendBillingEventAndProject).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        event: expect.objectContaining({
          type: 'restore_succeeded',
          providerTransactionId: 'pi_123',
          payload: expect.objectContaining({
            requestOrigin: 'web',
            restoredTransactionId: 'pi_123',
            providerCustomerId: 'cus_123',
          }),
        }),
      }),
    );

    logSpy.mockRestore();
  });

  it('returns not_found when no completed purchase is found', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGetProEntitlementSummary
      .mockResolvedValueOnce({
        isPro: false,
        status: 'none',
      })
      .mockResolvedValueOnce({
        isPro: false,
        status: 'none',
        updatedAt: new Date('2026-02-21T09:00:05.000Z'),
      });
    mockedFindLatestStripeCompletedCheckout.mockResolvedValue(null);

    const response = await POST(
      new Request('https://example.com/api/pro/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'account' }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.outcome).toBe('not_found');
    expect(mockedAppendBillingEventAndProject).toHaveBeenCalledTimes(2);
    expect(mockedAppendBillingEventAndProject).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        event: expect.objectContaining({
          type: 'restore_failed',
          payload: expect.objectContaining({
            requestOrigin: 'web',
            reasonCode: 'not_found',
          }),
        }),
      }),
    );

    logSpy.mockRestore();
  });

  it('uses local billing ledger lookup in stripe test mode', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    process.env.BILLING_STRIPE_TEST_MODE = 'true';

    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGetProEntitlementSummary
      .mockResolvedValueOnce({
        isPro: false,
        status: 'none',
      })
      .mockResolvedValueOnce({
        isPro: true,
        status: 'active',
        source: 'stripe',
        restoredAt: new Date('2026-02-21T09:00:00.000Z'),
        updatedAt: new Date('2026-02-21T09:00:05.000Z'),
      });
    billingEventLedgerFindFirstMock.mockResolvedValue({
      providerEventId: 'checkout_session:cs_local_123',
      providerTransactionId: 'pi_local_123',
      occurredAt: new Date('2026-02-21T09:00:00.000Z'),
      payload: {
        amountCents: 1999,
        currency: 'usd',
        providerCustomerId: 'cus_local_123',
      },
    });
    billingEntitlementProjectionFindUniqueMock.mockResolvedValue({
      providerCustomerId: null,
    });

    const response = await POST(
      new Request('https://example.com/api/pro/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'account' }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.outcome).toBe('restored');
    expect(mockedFindLatestStripeCompletedCheckout).not.toHaveBeenCalled();
    expect(mockedAppendBillingEventAndProject).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        event: expect.objectContaining({
          providerEventId: 'checkout_session:cs_local_123',
          providerTransactionId: 'pi_local_123',
        }),
      }),
    );

    logSpy.mockRestore();
  });

  it('rejects unauthenticated requests', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedGetServerSession.mockResolvedValue(null);

    const response = await POST(
      new Request('https://example.com/api/pro/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'account' }),
      }),
    );
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('unauthorized');

    errorSpy.mockRestore();
  });

  it('rejects invalid request payload', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });

    const response = await POST(
      new Request('https://example.com/api/pro/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'invalid' }),
      }),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('invalid_request');

    errorSpy.mockRestore();
  });

  it('rejects malformed json request body', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });

    const response = await POST(
      new Request('https://example.com/api/pro/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{',
      }),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('invalid_request');

    errorSpy.mockRestore();
  });

  it('returns service-unavailable response when stripe env is missing', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGetProEntitlementSummary.mockResolvedValue({
      isPro: false,
      status: 'none',
    });
    mockedGetStripePortalConfig.mockImplementation(() => {
      throw new Error('Missing required env: STRIPE_SECRET_KEY');
    });

    const response = await POST(
      new Request('https://example.com/api/pro/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'account' }),
      }),
    );
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('internal_error');
    expect(body.error.recovery).toBe('retry_later');
    expect(mockedFindLatestStripeCompletedCheckout).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
