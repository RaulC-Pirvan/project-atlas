import type { StripeCheckoutQueryStatus } from '../billing/stripe/contracts';
import { logInfo } from '../observability/logger';

export const PRO_CONVERSION_SCHEMA_VERSION = 1 as const;

export const PRO_CONVERSION_EVENTS = [
  'pro_page_view',
  'pro_cta_click',
  'pro_checkout_initiated',
  'pro_checkout_return',
  'pro_entitlement_active',
] as const;

export type ProConversionEvent = (typeof PRO_CONVERSION_EVENTS)[number];

export const PRO_CTA_SOURCES = ['direct', 'hero', 'comparison', 'faq'] as const;

export type ProCtaSource = (typeof PRO_CTA_SOURCES)[number];

export const DEFAULT_PRO_CTA_SOURCE: ProCtaSource = 'direct';

export type ProConversionSurface =
  | '/pro'
  | '/pro/upgrade'
  | '/api/billing/stripe/checkout'
  | '/account'
  | '/api/billing/stripe/webhook';

function isTrackingEnabled(): boolean {
  const analyticsEnabled = process.env.ANALYTICS_ENABLED !== 'false';
  const billingTrackingEnabled = process.env.BILLING_CONVERSION_TRACKING_ENABLED !== 'false';
  return analyticsEnabled && billingTrackingEnabled;
}

export function parseProCtaSource(value: string | null | undefined): ProCtaSource {
  if (!value) return DEFAULT_PRO_CTA_SOURCE;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return DEFAULT_PRO_CTA_SOURCE;
  return PRO_CTA_SOURCES.includes(normalized as ProCtaSource)
    ? (normalized as ProCtaSource)
    : DEFAULT_PRO_CTA_SOURCE;
}

export function buildProUpgradeHref(source: ProCtaSource): string {
  return `/pro/upgrade?source=${source}`;
}

export function buildProIntentPath(source: ProCtaSource): string {
  return `/pro?intent=upgrade&source=${source}`;
}

type ProConversionLogArgs = {
  event: ProConversionEvent;
  surface: ProConversionSurface;
  authenticated: boolean;
  userId?: string | null;
  source?: ProCtaSource;
  checkoutStatus?: StripeCheckoutQueryStatus;
  checkoutSessionId?: string | null;
  provider?: 'stripe';
  isPro?: boolean;
  dedupeReason?: 'event_id' | 'provider_event_id' | 'idempotency_key' | null;
};

export function logProConversionEvent(args: ProConversionLogArgs): void {
  if (!isTrackingEnabled()) return;

  logInfo('analytics.pro_conversion', {
    schemaVersion: PRO_CONVERSION_SCHEMA_VERSION,
    event: args.event,
    surface: args.surface,
    authenticated: args.authenticated,
    userId: args.userId ?? undefined,
    source: args.source ?? undefined,
    checkoutStatus: args.checkoutStatus ?? undefined,
    checkoutSessionId: args.checkoutSessionId ?? undefined,
    provider: args.provider ?? undefined,
    isPro: args.isPro ?? undefined,
    dedupeReason: args.dedupeReason ?? undefined,
  });
}
