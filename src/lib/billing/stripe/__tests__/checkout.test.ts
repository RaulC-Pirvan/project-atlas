import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createStripeCheckoutSession } from '../checkout';

describe('createStripeCheckoutSession', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'cs_test_1',
          url: 'https://checkout.stripe.test/session/cs_test_1',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends canonical metadata and default success/cancel paths', async () => {
    await createStripeCheckoutSession({
      secretKey: 'sk_test_123',
      priceId: 'price_123',
      appUrl: 'https://atlas.example.com',
      userId: 'user-1',
      productKey: 'pro_lifetime_v1',
      idempotencyKey: 'checkout:user-1:req-1',
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    expect(fetchCall?.[0]).toBe('https://api.stripe.com/v1/checkout/sessions');

    const requestInit = fetchCall?.[1];
    expect(requestInit).toBeDefined();
    expect(requestInit?.method).toBe('POST');
    expect(requestInit?.headers).toEqual(
      expect.objectContaining({
        Authorization: 'Bearer sk_test_123',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': 'checkout:user-1:req-1',
      }),
    );

    const body = new URLSearchParams(String(requestInit?.body ?? ''));
    expect(body.get('line_items[0][price]')).toBe('price_123');
    expect(body.get('line_items[0][quantity]')).toBe('1');
    expect(body.get('success_url')).toBe(
      'https://atlas.example.com/account?checkout=success&checkout_session_id={CHECKOUT_SESSION_ID}',
    );
    expect(body.get('cancel_url')).toBe('https://atlas.example.com/account?checkout=cancel');
    expect(body.get('client_reference_id')).toBe('user-1');
    expect(body.get('metadata[userId]')).toBe('user-1');
    expect(body.get('metadata[productKey]')).toBe('pro_lifetime_v1');
    expect(body.get('metadata[planType]')).toBe('one_time');
  });

  it('supports explicit success and cancel paths', async () => {
    await createStripeCheckoutSession({
      secretKey: 'sk_test_123',
      priceId: 'price_123',
      appUrl: 'https://atlas.example.com',
      userId: 'user-1',
      productKey: 'pro_lifetime_v1',
      idempotencyKey: 'checkout:user-1:req-2',
      successPath: '/custom-success',
      cancelPath: '/custom-cancel',
    });

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const requestInit = fetchCall?.[1];
    const body = new URLSearchParams(String(requestInit?.body ?? ''));
    expect(body.get('success_url')).toBe('https://atlas.example.com/custom-success');
    expect(body.get('cancel_url')).toBe('https://atlas.example.com/custom-cancel');
  });

  it('throws sanitized error when Stripe session creation fails', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'Bad request' } }), { status: 400 }),
    );

    await expect(
      createStripeCheckoutSession({
        secretKey: 'sk_test_123',
        priceId: 'price_123',
        appUrl: 'https://atlas.example.com',
        userId: 'user-1',
        productKey: 'pro_lifetime_v1',
        idempotencyKey: 'checkout:user-1:req-3',
      }),
    ).rejects.toThrow('Stripe checkout session creation failed.');
  });
});
