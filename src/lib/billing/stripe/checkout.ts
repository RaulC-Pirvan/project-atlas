import { STRIPE_CHECKOUT_CANCEL_PATH, STRIPE_CHECKOUT_SUCCESS_PATH } from './contracts';

export type StripeCheckoutSession = {
  id: string;
  url: string;
};

type CreateStripeCheckoutSessionArgs = {
  secretKey: string;
  priceId: string;
  appUrl: string;
  userId: string;
  productKey: string;
  idempotencyKey: string;
  successPath?: string;
  cancelPath?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export async function createStripeCheckoutSession(
  args: CreateStripeCheckoutSessionArgs,
): Promise<StripeCheckoutSession> {
  const successPath = args.successPath ?? STRIPE_CHECKOUT_SUCCESS_PATH;
  const cancelPath = args.cancelPath ?? STRIPE_CHECKOUT_CANCEL_PATH;
  const successUrl = `${args.appUrl}${successPath}`;
  const cancelUrl = `${args.appUrl}${cancelPath}`;

  const body = new URLSearchParams();
  body.set('mode', 'payment');
  body.set('line_items[0][price]', args.priceId);
  body.set('line_items[0][quantity]', '1');
  body.set('success_url', successUrl);
  body.set('cancel_url', cancelUrl);
  body.set('client_reference_id', args.userId);
  body.set('metadata[userId]', args.userId);
  body.set('metadata[productKey]', args.productKey);
  body.set('metadata[planType]', 'one_time');

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': args.idempotencyKey,
    },
    body: body.toString(),
  });

  const payload = (await response.json().catch(() => ({}))) as unknown;
  if (!response.ok) {
    throw new Error('Stripe checkout session creation failed.');
  }

  if (!isRecord(payload)) {
    throw new Error('Stripe checkout session response is invalid.');
  }

  const id = asString(payload.id);
  const url = asString(payload.url);
  if (!id || !url) {
    throw new Error('Stripe checkout session response is missing id or url.');
  }

  return { id, url };
}
