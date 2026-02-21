import crypto from 'node:crypto';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appendBillingEventAndProject } from '../../../../../lib/billing/persistence';
import { getStripeWebhookConfig } from '../../../../../lib/billing/stripe/config';
import { POST } from '../webhook/route';

vi.mock('../../../../../lib/db/prisma', () => ({ prisma: {} }));
vi.mock('../../../../../lib/billing/persistence', () => ({
  appendBillingEventAndProject: vi.fn(),
}));
vi.mock('../../../../../lib/billing/stripe/config', () => ({ getStripeWebhookConfig: vi.fn() }));

const mockedAppendBillingEventAndProject = vi.mocked(appendBillingEventAndProject);
const mockedGetStripeWebhookConfig = vi.mocked(getStripeWebhookConfig);

function buildSignatureHeader(args: {
  payload: string;
  secret: string;
  timestamp: number;
}): string {
  const signedPayload = `${args.timestamp}.${args.payload}`;
  const signature = crypto
    .createHmac('sha256', args.secret)
    .update(signedPayload, 'utf8')
    .digest('hex');
  return `t=${args.timestamp},v1=${signature}`;
}

describe('POST /api/billing/stripe/webhook', () => {
  beforeEach(() => {
    mockedAppendBillingEventAndProject.mockReset();
    mockedGetStripeWebhookConfig.mockReset();
    mockedGetStripeWebhookConfig.mockReturnValue({
      webhookSecret: 'whsec_test',
      webhookToleranceSeconds: 300,
    });
    mockedAppendBillingEventAndProject.mockResolvedValue({
      appended: true,
      dedupeReason: null,
      ledgerEvent: {
        id: 'event-row-1',
        eventId: 'stripe:evt_1:purchase_succeeded',
        userId: 'user-1',
        provider: 'stripe',
        providerEventId: 'evt_1',
        providerTransactionId: 'pi_1',
        idempotencyKey: null,
        productKey: 'pro_lifetime_v1',
        planType: 'one_time',
        eventType: 'purchase_succeeded',
        occurredAt: new Date('2026-02-21T09:00:00.000Z'),
        receivedAt: new Date('2026-02-21T09:00:05.000Z'),
        payload: {},
        payloadHash: 'sha256:abc',
        signatureVerified: true,
        createdAt: new Date('2026-02-21T09:00:05.000Z'),
      },
      projection: {
        userId: 'user-1',
        productKey: 'pro_lifetime_v1',
        planType: 'one_time',
        status: 'active',
        provider: 'stripe',
        providerCustomerId: null,
        providerAccountId: null,
        activeFrom: new Date('2026-02-21T09:00:00.000Z'),
        activeUntil: null,
        periodStart: null,
        periodEnd: null,
        autoRenew: null,
        lastEventId: 'stripe:evt_1:purchase_succeeded',
        lastEventType: 'purchase_succeeded',
        updatedAt: new Date('2026-02-21T09:00:05.000Z'),
        version: 1,
      },
    });
  });

  it('rejects invalid signature', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const payload = JSON.stringify({
      id: 'evt_1',
      type: 'checkout.session.completed',
      created: 1766361600,
      data: { object: { metadata: { userId: 'user-1', productKey: 'pro_lifetime_v1' } } },
    });

    const response = await POST(
      new Request('https://example.com/api/billing/stripe/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 't=1766361600,v1=invalid',
        },
        body: payload,
      }),
    );

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('forbidden');
    expect(mockedAppendBillingEventAndProject).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('processes checkout success event into canonical purchase_succeeded', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const nowMs = Date.UTC(2026, 1, 21, 12, 0, 0);
    const timestamp = Math.floor(nowMs / 1000);
    vi.useFakeTimers();
    vi.setSystemTime(nowMs);

    const payload = JSON.stringify({
      id: 'evt_1',
      type: 'checkout.session.completed',
      created: 1766361600,
      data: {
        object: {
          id: 'cs_1',
          payment_intent: 'pi_1',
          amount_total: 1999,
          currency: 'usd',
          metadata: { userId: 'user-1', productKey: 'pro_lifetime_v1' },
        },
      },
    });
    const signature = buildSignatureHeader({
      payload,
      secret: 'whsec_test',
      timestamp,
    });

    const response = await POST(
      new Request('https://example.com/api/billing/stripe/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': signature,
        },
        body: payload,
      }),
    );

    expect(response.status).toBe(200);
    expect(mockedAppendBillingEventAndProject).toHaveBeenCalledWith(
      expect.objectContaining({
        signatureVerified: true,
        event: expect.objectContaining({
          provider: 'stripe',
          type: 'purchase_succeeded',
          productKey: 'pro_lifetime_v1',
        }),
      }),
    );

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.ignored).toBe(false);

    vi.useRealTimers();
    logSpy.mockRestore();
  });

  it('processes refund event into canonical refund_issued', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const nowMs = Date.UTC(2026, 1, 21, 12, 0, 0);
    const timestamp = Math.floor(nowMs / 1000);
    vi.useFakeTimers();
    vi.setSystemTime(nowMs);

    const payload = JSON.stringify({
      id: 'evt_2',
      type: 'charge.refunded',
      created: 1766361600,
      data: {
        object: {
          id: 'ch_1',
          amount_refunded: 1999,
          currency: 'usd',
          metadata: { userId: 'user-1', productKey: 'pro_lifetime_v1' },
        },
      },
    });
    const signature = buildSignatureHeader({
      payload,
      secret: 'whsec_test',
      timestamp,
    });

    const response = await POST(
      new Request('https://example.com/api/billing/stripe/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': signature,
        },
        body: payload,
      }),
    );

    expect(response.status).toBe(200);
    expect(mockedAppendBillingEventAndProject).toHaveBeenCalledWith(
      expect.objectContaining({
        event: expect.objectContaining({
          type: 'refund_issued',
        }),
      }),
    );

    vi.useRealTimers();
    logSpy.mockRestore();
  });
});
