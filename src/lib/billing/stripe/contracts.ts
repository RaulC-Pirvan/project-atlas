import type { BillingEventType } from '../events';

export const STRIPE_CHECKOUT_ROUTE = '/api/billing/stripe/checkout' as const;
export const STRIPE_CHECKOUT_HTTP_METHOD = 'GET' as const;
export const STRIPE_CHECKOUT_REDIRECT_STATUS = 303 as const;

export const STRIPE_CHECKOUT_SUCCESS_PATH =
  '/pro?checkout=success&checkout_session_id={CHECKOUT_SESSION_ID}' as const;
export const STRIPE_CHECKOUT_CANCEL_PATH = '/pro?checkout=cancel' as const;

export const STRIPE_CHECKOUT_QUERY_STATUSES = ['success', 'cancel'] as const;

export type StripeCheckoutQueryStatus = (typeof STRIPE_CHECKOUT_QUERY_STATUSES)[number];

export type StripeCheckoutRequestContract = {
  method: typeof STRIPE_CHECKOUT_HTTP_METHOD;
  requiresAuthenticatedUser: true;
  requestBody: null;
};

export type StripeCheckoutRedirectResponseContract = {
  status: typeof STRIPE_CHECKOUT_REDIRECT_STATUS;
  location: string;
};

export const STRIPE_REQUIRED_CHECKOUT_ENV_KEYS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PRICE_PRO_LIFETIME',
] as const;
export const STRIPE_REQUIRED_WEBHOOK_ENV_KEYS = ['STRIPE_WEBHOOK_SECRET'] as const;
export const STRIPE_OPTIONAL_ENV_KEYS = [
  'APP_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXTAUTH_URL',
  'BILLING_WEBHOOK_TOLERANCE_SECONDS',
  'STRIPE_BILLING_PORTAL_CONFIGURATION_ID',
] as const;

export const STRIPE_WEBHOOK_EVENT_ALLOWLIST = [
  'checkout.session.completed',
  'checkout.session.expired',
  'checkout.session.async_payment_failed',
  'charge.refunded',
  'charge.dispute.created',
  'charge.dispute.closed',
] as const;

export type StripeSupportedWebhookEventType = (typeof STRIPE_WEBHOOK_EVENT_ALLOWLIST)[number];

export type StripeWebhookCanonicalType = Extract<
  BillingEventType,
  | 'purchase_succeeded'
  | 'purchase_failed'
  | 'refund_issued'
  | 'chargeback_opened'
  | 'chargeback_won'
  | 'chargeback_lost'
>;

export const STRIPE_WEBHOOK_CANONICAL_EVENT_MAP: Record<
  StripeSupportedWebhookEventType,
  StripeWebhookCanonicalType
> = {
  'checkout.session.completed': 'purchase_succeeded',
  'checkout.session.expired': 'purchase_failed',
  'checkout.session.async_payment_failed': 'purchase_failed',
  'charge.refunded': 'refund_issued',
  'charge.dispute.created': 'chargeback_opened',
  'charge.dispute.closed': 'chargeback_lost',
};

export function parseStripeCheckoutQueryStatus(
  value: string | null | undefined,
): StripeCheckoutQueryStatus | null {
  if (!value) return null;
  return STRIPE_CHECKOUT_QUERY_STATUSES.includes(value as StripeCheckoutQueryStatus)
    ? (value as StripeCheckoutQueryStatus)
    : null;
}

export function isStripeSupportedWebhookEventType(
  value: string,
): value is StripeSupportedWebhookEventType {
  return STRIPE_WEBHOOK_EVENT_ALLOWLIST.includes(value as StripeSupportedWebhookEventType);
}
