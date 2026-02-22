import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { findLatestStripeCompletedCheckout } from '../restore';

describe('findLatestStripeCompletedCheckout', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          object: 'search_result',
          data: [
            {
              id: 'cs_live_1',
              created: 1766361600,
              status: 'complete',
              payment_status: 'paid',
              client_reference_id: 'user-1',
              payment_intent: 'pi_1',
              customer: 'cus_1',
              amount_total: 1999,
              currency: 'usd',
              metadata: {
                userId: 'user-1',
                productKey: 'pro_lifetime_v1',
              },
            },
          ],
          has_more: false,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('finds latest completed checkout from Stripe search endpoint', async () => {
    const result = await findLatestStripeCompletedCheckout({
      secretKey: 'sk_test_123',
      userId: 'user-1',
      productKey: 'pro_lifetime_v1',
    });

    expect(result).toEqual({
      checkoutSessionId: 'cs_live_1',
      paymentIntentId: 'pi_1',
      customerId: 'cus_1',
      amountTotal: 1999,
      currency: 'USD',
      createdAt: new Date('2025-12-22T00:00:00.000Z'),
    });

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    expect(String(fetchCall?.[0])).toContain('/v1/checkout/sessions/search?');
  });

  it('falls back to list endpoint when search endpoint is unavailable', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'Search not available' } }), { status: 404 }),
    );
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          object: 'list',
          has_more: false,
          data: [
            {
              id: 'cs_live_2',
              created: 1766361600,
              status: 'complete',
              payment_status: 'paid',
              client_reference_id: 'user-1',
              payment_intent: { id: 'pi_2' },
              customer: { id: 'cus_2' },
              metadata: {
                userId: 'user-1',
                productKey: 'pro_lifetime_v1',
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const result = await findLatestStripeCompletedCheckout({
      secretKey: 'sk_test_123',
      userId: 'user-1',
      productKey: 'pro_lifetime_v1',
    });

    expect(result?.checkoutSessionId).toBe('cs_live_2');
    expect(result?.paymentIntentId).toBe('pi_2');
    expect(result?.customerId).toBe('cus_2');
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(2);
    expect(String(vi.mocked(global.fetch).mock.calls[1]?.[0])).toContain(
      '/v1/checkout/sessions?limit=100',
    );
  });
});
