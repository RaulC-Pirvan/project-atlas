import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createStripeBillingPortalSession } from '../portal';

describe('createStripeBillingPortalSession', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'bps_test_1',
          url: 'https://billing.stripe.test/session/bps_test_1',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a portal session with customer and return url', async () => {
    await createStripeBillingPortalSession({
      secretKey: 'sk_test_123',
      customerId: 'cus_123',
      returnUrl: 'https://atlas.example.com/account',
      configurationId: 'bpc_123',
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    expect(fetchCall?.[0]).toBe('https://api.stripe.com/v1/billing_portal/sessions');

    const requestInit = fetchCall?.[1];
    expect(requestInit?.method).toBe('POST');
    expect(requestInit?.headers).toEqual(
      expect.objectContaining({
        Authorization: 'Bearer sk_test_123',
        'Content-Type': 'application/x-www-form-urlencoded',
      }),
    );

    const body = new URLSearchParams(String(requestInit?.body ?? ''));
    expect(body.get('customer')).toBe('cus_123');
    expect(body.get('return_url')).toBe('https://atlas.example.com/account');
    expect(body.get('configuration')).toBe('bpc_123');
  });

  it('throws sanitized error when Stripe portal session creation fails', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'Bad request' } }), { status: 400 }),
    );

    await expect(
      createStripeBillingPortalSession({
        secretKey: 'sk_test_123',
        customerId: 'cus_123',
        returnUrl: 'https://atlas.example.com/account',
      }),
    ).rejects.toThrow('Stripe billing portal session creation failed.');
  });
});
