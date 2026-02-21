import { describe, expect, it } from 'vitest';

import {
  BILLING_EVENT_TYPES,
  BILLING_PROVIDERS,
  buildBillingCommandDedupeKey,
  buildBillingWebhookDedupeKey,
  createEmptyBillingEntitlementProjection,
  getBillingEventPayloadError,
  getBillingProjectionInvariantErrors,
  isBillingEntitlementActive,
  isValidBillingIdempotencyKey,
} from '..';

describe('billing contracts', () => {
  it('defines the locked providers for sprint 15.1', () => {
    expect(BILLING_PROVIDERS).toEqual(['manual', 'stripe', 'ios_iap', 'android_iap']);
  });

  it('defines the canonical billing event taxonomy', () => {
    expect(BILLING_EVENT_TYPES).toEqual([
      'purchase_initiated',
      'purchase_succeeded',
      'purchase_failed',
      'refund_issued',
      'chargeback_opened',
      'chargeback_won',
      'chargeback_lost',
      'entitlement_granted',
      'entitlement_revoked',
      'restore_requested',
      'restore_succeeded',
      'restore_failed',
    ]);
  });

  it('validates required payload fields for canonical events', () => {
    expect(
      getBillingEventPayloadError('purchase_succeeded', {
        transactionId: 'txn_123',
        amountCents: 1999,
        currency: 'USD',
      }),
    ).toBeNull();

    expect(
      getBillingEventPayloadError('purchase_succeeded', {
        transactionId: '',
        amountCents: 1999,
        currency: 'USD',
      }),
    ).toBe('purchase_succeeded requires transactionId.');
  });

  it('enforces idempotency key normalization and validation', () => {
    expect(isValidBillingIdempotencyKey('Checkout:User-123:Attempt-1')).toBe(true);
    expect(buildBillingCommandDedupeKey('  Checkout:User-123:Attempt-1  ')).toBe(
      'checkout:user-123:attempt-1',
    );
    expect(isValidBillingIdempotencyKey('bad key with spaces')).toBe(false);
  });

  it('builds webhook dedupe key from provider and provider event id', () => {
    expect(
      buildBillingWebhookDedupeKey({
        provider: 'stripe',
        providerEventId: ' evt_123 ',
      }),
    ).toBe('stripe:evt_123');
  });

  it('creates launch-default projection shape for one-time pro', () => {
    const projection = createEmptyBillingEntitlementProjection({
      userId: 'user-1',
    });

    expect(projection.productKey).toBe('pro_lifetime_v1');
    expect(projection.planType).toBe('one_time');
    expect(projection.status).toBe('none');
    expect(isBillingEntitlementActive(projection)).toBe(false);
    expect(getBillingProjectionInvariantErrors(projection)).toEqual([]);
  });

  it('flags projection invariant violations', () => {
    const projection = {
      ...createEmptyBillingEntitlementProjection({ userId: 'user-1' }),
      status: 'active' as const,
    };

    expect(getBillingProjectionInvariantErrors(projection)).toContain(
      'status active/revoked requires provider.',
    );
    expect(getBillingProjectionInvariantErrors(projection)).toContain(
      'status=active requires activeFrom.',
    );
  });

  it('rejects subscription projection with invalid period ordering', () => {
    const projection = {
      ...createEmptyBillingEntitlementProjection({ userId: 'user-1' }),
      planType: 'subscription' as const,
      autoRenew: true,
      status: 'active' as const,
      provider: 'stripe' as const,
      activeFrom: new Date('2026-02-20T00:00:00.000Z'),
      periodStart: new Date('2026-03-01T00:00:00.000Z'),
      periodEnd: new Date('2026-02-28T00:00:00.000Z'),
    };

    expect(getBillingProjectionInvariantErrors(projection)).toContain(
      'subscription periodEnd must be >= periodStart.',
    );
  });
});
