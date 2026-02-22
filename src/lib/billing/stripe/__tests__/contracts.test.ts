import { describe, expect, it } from 'vitest';

import {
  isStripeSupportedWebhookEventType,
  parseStripeCheckoutQueryStatus,
  STRIPE_CHECKOUT_CANCEL_PATH,
  STRIPE_CHECKOUT_HTTP_METHOD,
  STRIPE_CHECKOUT_QUERY_STATUSES,
  STRIPE_CHECKOUT_REDIRECT_STATUS,
  STRIPE_CHECKOUT_ROUTE,
  STRIPE_CHECKOUT_SUCCESS_PATH,
  STRIPE_WEBHOOK_CANONICAL_EVENT_MAP,
  STRIPE_WEBHOOK_EVENT_ALLOWLIST,
} from '../contracts';

describe('stripe phase 15.2 contract layer', () => {
  it('defines checkout route and redirect contract', () => {
    expect(STRIPE_CHECKOUT_ROUTE).toBe('/api/billing/stripe/checkout');
    expect(STRIPE_CHECKOUT_HTTP_METHOD).toBe('GET');
    expect(STRIPE_CHECKOUT_REDIRECT_STATUS).toBe(303);
    expect(STRIPE_CHECKOUT_SUCCESS_PATH).toBe(
      '/pro?checkout=success&checkout_session_id={CHECKOUT_SESSION_ID}',
    );
    expect(STRIPE_CHECKOUT_CANCEL_PATH).toBe('/pro?checkout=cancel');
  });

  it('guards checkout query status parsing', () => {
    expect(STRIPE_CHECKOUT_QUERY_STATUSES).toEqual(['success', 'cancel']);
    expect(parseStripeCheckoutQueryStatus('success')).toBe('success');
    expect(parseStripeCheckoutQueryStatus('cancel')).toBe('cancel');
    expect(parseStripeCheckoutQueryStatus('unknown')).toBeNull();
    expect(parseStripeCheckoutQueryStatus(null)).toBeNull();
  });

  it('defines supported webhook allowlist and canonical mapping', () => {
    expect(STRIPE_WEBHOOK_EVENT_ALLOWLIST).toEqual([
      'checkout.session.completed',
      'checkout.session.expired',
      'checkout.session.async_payment_failed',
      'charge.refunded',
    ]);

    expect(STRIPE_WEBHOOK_CANONICAL_EVENT_MAP).toEqual({
      'checkout.session.completed': 'purchase_succeeded',
      'checkout.session.expired': 'purchase_failed',
      'checkout.session.async_payment_failed': 'purchase_failed',
      'charge.refunded': 'refund_issued',
    });

    expect(isStripeSupportedWebhookEventType('checkout.session.completed')).toBe(true);
    expect(isStripeSupportedWebhookEventType('charge.refunded')).toBe(true);
    expect(isStripeSupportedWebhookEventType('customer.created')).toBe(false);
  });
});
