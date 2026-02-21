import { describe, expect, it } from 'vitest';

import { normalizeStripeWebhookEventToCanonicalEvent, parseStripeWebhookEvent } from '../normalize';

describe('stripe webhook normalization', () => {
  it('maps checkout.session.completed to purchase_succeeded', () => {
    const event = parseStripeWebhookEvent(
      JSON.stringify({
        id: 'evt_1',
        type: 'checkout.session.completed',
        created: 1766361600,
        data: {
          object: {
            id: 'cs_1',
            payment_intent: 'pi_1',
            amount_total: 1999,
            currency: 'usd',
            metadata: {
              userId: 'user-1',
              productKey: 'pro_lifetime_v1',
            },
          },
        },
      }),
    );

    expect(event).not.toBeNull();
    const canonical = normalizeStripeWebhookEventToCanonicalEvent({
      event: event!,
      receivedAt: new Date('2026-02-21T12:00:00.000Z'),
      payloadHash: 'sha256:abc',
    });

    expect(canonical?.type).toBe('purchase_succeeded');
    expect(canonical?.provider).toBe('stripe');
    expect(canonical?.providerEventId).toBe('evt_1');
    expect(canonical?.payload).toEqual({
      transactionId: 'pi_1',
      amountCents: 1999,
      currency: 'USD',
    });
  });

  it('maps checkout.session.expired to purchase_failed', () => {
    const event = parseStripeWebhookEvent(
      JSON.stringify({
        id: 'evt_2',
        type: 'checkout.session.expired',
        created: 1766361601,
        data: {
          object: {
            id: 'cs_2',
            payment_intent: 'pi_2',
            metadata: {
              userId: 'user-1',
              productKey: 'pro_lifetime_v1',
            },
          },
        },
      }),
    );

    expect(event).not.toBeNull();
    const canonical = normalizeStripeWebhookEventToCanonicalEvent({
      event: event!,
      receivedAt: new Date('2026-02-21T12:00:00.000Z'),
    });

    expect(canonical?.type).toBe('purchase_failed');
    expect(canonical?.payload).toEqual({ reasonCode: 'checkout.session.expired' });
  });

  it('maps checkout.session.async_payment_failed to purchase_failed', () => {
    const event = parseStripeWebhookEvent(
      JSON.stringify({
        id: 'evt_2b',
        type: 'checkout.session.async_payment_failed',
        created: 1766361601,
        data: {
          object: {
            id: 'cs_2b',
            payment_intent: 'pi_2b',
            metadata: {
              userId: 'user-1',
              productKey: 'pro_lifetime_v1',
            },
          },
        },
      }),
    );

    expect(event).not.toBeNull();
    const canonical = normalizeStripeWebhookEventToCanonicalEvent({
      event: event!,
      receivedAt: new Date('2026-02-21T12:00:00.000Z'),
    });

    expect(canonical?.type).toBe('purchase_failed');
    expect(canonical?.payload).toEqual({
      reasonCode: 'checkout.session.async_payment_failed',
    });
  });

  it('maps charge.refunded to refund_issued', () => {
    const event = parseStripeWebhookEvent(
      JSON.stringify({
        id: 'evt_3',
        type: 'charge.refunded',
        created: 1766361602,
        data: {
          object: {
            id: 'ch_1',
            amount_refunded: 1999,
            currency: 'usd',
            metadata: {
              userId: 'user-1',
              productKey: 'pro_lifetime_v1',
            },
          },
        },
      }),
    );

    expect(event).not.toBeNull();
    const canonical = normalizeStripeWebhookEventToCanonicalEvent({
      event: event!,
      receivedAt: new Date('2026-02-21T12:00:00.000Z'),
    });

    expect(canonical?.type).toBe('refund_issued');
    expect(canonical?.payload).toEqual({
      transactionId: 'ch_1',
      refundId: 'refund:evt_3',
      amountCents: 1999,
      currency: 'USD',
    });
  });

  it('returns null for unsupported event types', () => {
    const event = parseStripeWebhookEvent(
      JSON.stringify({
        id: 'evt_4',
        type: 'customer.created',
        created: 1766361603,
        data: {
          object: {},
        },
      }),
    );

    expect(event).not.toBeNull();
    const canonical = normalizeStripeWebhookEventToCanonicalEvent({
      event: event!,
      receivedAt: new Date('2026-02-21T12:00:00.000Z'),
    });

    expect(canonical).toBeNull();
  });
});
