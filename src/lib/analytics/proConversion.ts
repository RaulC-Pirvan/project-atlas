import type { StripeCheckoutQueryStatus } from '../billing/stripe/contracts';
import { logInfo, logWarn } from '../observability/logger';

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

export type ProCtaSourceParseReason = 'accepted' | 'missing' | 'invalid';

export type ParsedProCtaSource = {
  source: ProCtaSource;
  reason: ProCtaSourceParseReason;
  raw: string | null;
};

type ProConversionGuardrailReason = 'invalid_source_fallback' | 'duplicate_event_suppressed';

type ProConversionGuardrailLogArgs = {
  reason: ProConversionGuardrailReason;
  surface: ProConversionSurface;
  authenticated?: boolean;
  userId?: string | null;
  source?: ProCtaSource;
  rawSource?: string | null;
  event?: ProConversionEvent;
  requestId?: string;
};

const guardrailDedupeByEvent = new Map<string, number>();
const DEDUPE_WINDOW_MS_BY_EVENT: Partial<Record<ProConversionEvent, number>> = {
  pro_page_view: 10_000,
  pro_cta_click: 3_000,
  pro_checkout_return: 3_000,
};

function isTrackingEnabled(): boolean {
  const analyticsEnabled = process.env.ANALYTICS_ENABLED !== 'false';
  const billingTrackingEnabled = process.env.BILLING_CONVERSION_TRACKING_ENABLED !== 'false';
  return analyticsEnabled && billingTrackingEnabled;
}

export function parseProCtaSourceWithReason(value: string | null | undefined): ParsedProCtaSource {
  if (!value) {
    return { source: DEFAULT_PRO_CTA_SOURCE, reason: 'missing', raw: null };
  }
  const raw = value.trim();
  if (!raw) {
    return { source: DEFAULT_PRO_CTA_SOURCE, reason: 'missing', raw: null };
  }
  const normalized = raw.toLowerCase();
  if (!PRO_CTA_SOURCES.includes(normalized as ProCtaSource)) {
    return { source: DEFAULT_PRO_CTA_SOURCE, reason: 'invalid', raw };
  }
  return { source: normalized as ProCtaSource, reason: 'accepted', raw };
}

export function parseProCtaSource(value: string | null | undefined): ProCtaSource {
  return parseProCtaSourceWithReason(value).source;
}

function shouldSuppressEvent(args: {
  event: ProConversionEvent;
  surface: ProConversionSurface;
  authenticated: boolean;
  userId?: string | null;
  source?: ProCtaSource;
  checkoutStatus?: StripeCheckoutQueryStatus;
  checkoutSessionId?: string | null;
}): boolean {
  const dedupeWindowMs = DEDUPE_WINDOW_MS_BY_EVENT[args.event];
  if (!dedupeWindowMs) return false;

  const now = Date.now();
  const fingerprint = [
    args.event,
    args.surface,
    args.userId ?? (args.authenticated ? 'auth' : 'anon'),
    args.source ?? DEFAULT_PRO_CTA_SOURCE,
    args.checkoutStatus ?? 'none',
    args.checkoutSessionId ?? 'none',
  ].join('|');

  const lastSeenAt = guardrailDedupeByEvent.get(fingerprint);
  guardrailDedupeByEvent.set(fingerprint, now);

  // Lightweight in-memory cleanup to avoid unbounded growth.
  if (guardrailDedupeByEvent.size > 2000) {
    for (const [key, value] of guardrailDedupeByEvent.entries()) {
      if (now - value > 60_000) {
        guardrailDedupeByEvent.delete(key);
      }
    }
  }

  if (lastSeenAt === undefined) return false;
  return now - lastSeenAt < dedupeWindowMs;
}

export function resetProConversionGuardrailsForTests() {
  guardrailDedupeByEvent.clear();
}

export function logProConversionGuardrail(args: ProConversionGuardrailLogArgs): void {
  if (!isTrackingEnabled()) return;

  logWarn('analytics.pro_conversion.guardrail', {
    schemaVersion: PRO_CONVERSION_SCHEMA_VERSION,
    reason: args.reason,
    surface: args.surface,
    authenticated: args.authenticated ?? undefined,
    userId: args.userId ?? undefined,
    source: args.source ?? undefined,
    rawSource: args.rawSource ?? undefined,
    event: args.event ?? undefined,
    requestId: args.requestId ?? undefined,
  });
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
  requestId?: string;
};

export function logProConversionEvent(args: ProConversionLogArgs): void {
  if (!isTrackingEnabled()) return;

  if (shouldSuppressEvent(args)) {
    logProConversionGuardrail({
      reason: 'duplicate_event_suppressed',
      event: args.event,
      surface: args.surface,
      authenticated: args.authenticated,
      userId: args.userId,
      source: args.source,
      requestId: args.requestId,
    });
    return;
  }

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
    requestId: args.requestId ?? undefined,
  });
}
