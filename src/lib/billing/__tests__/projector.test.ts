import { describe, expect, it } from 'vitest';

import type { CanonicalBillingEvent } from '../events';
import { createEmptyBillingEntitlementProjection } from '../projection';
import { applyBillingEventToProjection } from '../projector';

function buildBaseEvent(type: CanonicalBillingEvent['type']): CanonicalBillingEvent {
  const occurredAt = new Date('2026-02-21T09:00:00.000Z');
  const receivedAt = new Date('2026-02-21T09:00:05.000Z');

  if (type === 'purchase_succeeded') {
    return {
      eventId: 'evt:purchase_succeeded',
      type,
      userId: 'user-1',
      provider: 'stripe',
      productKey: 'pro_lifetime_v1',
      planType: 'one_time',
      occurredAt,
      receivedAt,
      providerEventId: 'evt_provider_1',
      providerTransactionId: 'txn_1',
      payload: {
        transactionId: 'txn_1',
        amountCents: 1999,
        currency: 'USD',
      },
    };
  }

  if (type === 'purchase_failed') {
    return {
      eventId: 'evt:purchase_failed',
      type,
      userId: 'user-1',
      provider: 'stripe',
      productKey: 'pro_lifetime_v1',
      planType: 'one_time',
      occurredAt,
      receivedAt,
      providerEventId: 'evt_provider_2',
      payload: {
        reasonCode: 'checkout.session.expired',
      },
    };
  }

  if (type === 'chargeback_lost') {
    return {
      eventId: 'evt:chargeback_lost',
      type: 'chargeback_lost',
      userId: 'user-1',
      provider: 'stripe',
      productKey: 'pro_lifetime_v1',
      planType: 'one_time',
      occurredAt,
      receivedAt,
      providerEventId: 'evt_provider_4',
      providerTransactionId: 'txn_1',
      payload: {
        disputeId: 'dp_1',
        transactionId: 'txn_1',
      },
    };
  }

  if (type === 'chargeback_opened') {
    return {
      eventId: 'evt:chargeback_opened',
      type: 'chargeback_opened',
      userId: 'user-1',
      provider: 'stripe',
      productKey: 'pro_lifetime_v1',
      planType: 'one_time',
      occurredAt,
      receivedAt,
      providerEventId: 'evt_provider_6',
      providerTransactionId: 'txn_1',
      payload: {
        disputeId: 'dp_1',
        transactionId: 'txn_1',
      },
    };
  }

  if (type === 'chargeback_won') {
    return {
      eventId: 'evt:chargeback_won',
      type: 'chargeback_won',
      userId: 'user-1',
      provider: 'stripe',
      productKey: 'pro_lifetime_v1',
      planType: 'one_time',
      occurredAt,
      receivedAt,
      providerEventId: 'evt_provider_5',
      providerTransactionId: 'txn_1',
      payload: {
        disputeId: 'dp_1',
        transactionId: 'txn_1',
      },
    };
  }

  return {
    eventId: 'evt:refund_issued',
    type: 'refund_issued',
    userId: 'user-1',
    provider: 'stripe',
    productKey: 'pro_lifetime_v1',
    planType: 'one_time',
    occurredAt,
    receivedAt,
    providerEventId: 'evt_provider_3',
    providerTransactionId: 'txn_1',
    payload: {
      transactionId: 'txn_1',
      refundId: 'refund_1',
      amountCents: 1999,
      currency: 'USD',
    },
  };
}

describe('billing projector', () => {
  it('keeps none status on purchase_failed without prior entitlement', () => {
    const current = createEmptyBillingEntitlementProjection({
      userId: 'user-1',
      updatedAt: new Date('2026-02-21T08:00:00.000Z'),
    });

    const next = applyBillingEventToProjection({
      current,
      event: buildBaseEvent('purchase_failed'),
    });

    expect(next.status).toBe('none');
    expect(next.lastEventType).toBe('purchase_failed');
    expect(next.version).toBe(1);
  });

  it('moves active entitlement to revoked on refund_issued', () => {
    const active = applyBillingEventToProjection({
      current: createEmptyBillingEntitlementProjection({
        userId: 'user-1',
        updatedAt: new Date('2026-02-21T08:00:00.000Z'),
      }),
      event: buildBaseEvent('purchase_succeeded'),
    });

    const revoked = applyBillingEventToProjection({
      current: active,
      event: buildBaseEvent('refund_issued'),
    });

    expect(active.status).toBe('active');
    expect(revoked.status).toBe('revoked');
    expect(revoked.activeUntil?.toISOString()).toBe('2026-02-21T09:00:00.000Z');
    expect(revoked.lastEventType).toBe('refund_issued');
    expect(revoked.version).toBe(2);
  });

  it('revokes on chargeback_lost and restores on chargeback_won', () => {
    const active = applyBillingEventToProjection({
      current: createEmptyBillingEntitlementProjection({
        userId: 'user-1',
        updatedAt: new Date('2026-02-21T08:00:00.000Z'),
      }),
      event: buildBaseEvent('purchase_succeeded'),
    });

    const revoked = applyBillingEventToProjection({
      current: active,
      event: buildBaseEvent('chargeback_lost'),
    });

    const restored = applyBillingEventToProjection({
      current: revoked,
      event: buildBaseEvent('chargeback_won'),
    });

    expect(revoked.status).toBe('revoked');
    expect(revoked.lastEventType).toBe('chargeback_lost');
    expect(restored.status).toBe('active');
    expect(restored.activeUntil).toBeNull();
    expect(restored.lastEventType).toBe('chargeback_won');
  });

  it('keeps active entitlement active on chargeback_opened', () => {
    const active = applyBillingEventToProjection({
      current: createEmptyBillingEntitlementProjection({
        userId: 'user-1',
        updatedAt: new Date('2026-02-21T08:00:00.000Z'),
      }),
      event: buildBaseEvent('purchase_succeeded'),
    });

    const pendingDispute = applyBillingEventToProjection({
      current: active,
      event: buildBaseEvent('chargeback_opened'),
    });

    expect(pendingDispute.status).toBe('active');
    expect(pendingDispute.lastEventType).toBe('chargeback_opened');
    expect(pendingDispute.activeUntil).toBeNull();
  });
});
