import { logInfo, logWarn } from '../observability/logger';

export const FUNNEL_SCHEMA_VERSION = 1 as const;

export const FUNNEL_EVENTS = [
  'landing_page_view',
  'landing_auth_cta_click',
  'auth_sign_up_completed',
  'auth_sign_in_completed',
  'habit_first_created',
  'habit_first_completion_recorded',
] as const;

export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];

export type FunnelSurface =
  | '/landing'
  | '/landing/auth/track'
  | '/api/auth/signup'
  | '/api/auth/sign-in'
  | '/api/auth/sign-in/2fa/verify'
  | '/api/auth/[...nextauth]'
  | '/api/habits'
  | '/api/completions';

export const LANDING_AUTH_CTA_SOURCES = [
  'header_sign_in',
  'hero_primary',
  'hero_secondary',
  'final_primary',
] as const;

export type LandingAuthCtaSource = (typeof LANDING_AUTH_CTA_SOURCES)[number];

export const DEFAULT_LANDING_AUTH_CTA_SOURCE: LandingAuthCtaSource = 'hero_primary';

export const LANDING_AUTH_CTA_TARGETS = ['/sign-up', '/sign-in'] as const;

export type LandingAuthCtaTarget = (typeof LANDING_AUTH_CTA_TARGETS)[number];

export const DEFAULT_LANDING_AUTH_CTA_TARGET: LandingAuthCtaTarget = '/sign-up';

export type FunnelAuthProvider = 'credentials' | 'google';

export type LandingAuthCtaSourceParseReason = 'accepted' | 'missing' | 'invalid';
export type LandingAuthCtaTargetParseReason = 'accepted' | 'missing' | 'invalid';

type ParsedLandingAuthCtaSource = {
  source: LandingAuthCtaSource;
  reason: LandingAuthCtaSourceParseReason;
  raw: string | null;
};

type ParsedLandingAuthCtaTarget = {
  target: LandingAuthCtaTarget;
  reason: LandingAuthCtaTargetParseReason;
  raw: string | null;
};

type FunnelGuardrailReason =
  | 'invalid_source_fallback'
  | 'invalid_target_fallback'
  | 'duplicate_event_suppressed'
  | 'invalid_payload_dropped'
  | 'milestone_probe_failed';

type FunnelGuardrailLogArgs = {
  reason: FunnelGuardrailReason;
  surface: FunnelSurface;
  event?: FunnelEvent;
  authenticated?: boolean;
  userId?: string | null;
  source?: LandingAuthCtaSource;
  target?: LandingAuthCtaTarget;
  provider?: FunnelAuthProvider;
  requestId?: string;
  rawSource?: string | null;
  rawTarget?: string | null;
  details?: string;
};

type FunnelValidationResult =
  | { ok: true }
  | {
      ok: false;
      reason: string;
    };

type FunnelLogArgs = {
  event: FunnelEvent;
  surface: FunnelSurface;
  authenticated: boolean;
  userId?: string | null;
  source?: LandingAuthCtaSource;
  target?: LandingAuthCtaTarget;
  provider?: FunnelAuthProvider;
  requestId?: string;
};

const guardrailDedupeByEvent = new Map<string, number>();
const DEDUPE_WINDOW_MS_BY_EVENT: Partial<Record<FunnelEvent, number>> = {
  auth_sign_in_completed: 3_000,
};

function isTrackingEnabled(): boolean {
  const analyticsEnabled = process.env.ANALYTICS_ENABLED !== 'false';
  const funnelEnabled = process.env.ANALYTICS_FUNNEL_ENABLED !== 'false';
  return analyticsEnabled && funnelEnabled;
}

function trimInput(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function validateLogArgs(args: FunnelLogArgs): FunnelValidationResult {
  if (!FUNNEL_EVENTS.includes(args.event)) {
    return { ok: false, reason: 'invalid_event' };
  }

  if (args.userId && args.userId.length > 128) {
    return { ok: false, reason: 'user_id_too_long' };
  }

  if (args.requestId && args.requestId.length > 128) {
    return { ok: false, reason: 'request_id_too_long' };
  }

  if (args.event === 'landing_auth_cta_click') {
    if (!args.source) {
      return { ok: false, reason: 'missing_source' };
    }
    if (!args.target) {
      return { ok: false, reason: 'missing_target' };
    }
  }

  if (args.source && !LANDING_AUTH_CTA_SOURCES.includes(args.source)) {
    return { ok: false, reason: 'invalid_source' };
  }

  if (args.target && !LANDING_AUTH_CTA_TARGETS.includes(args.target)) {
    return { ok: false, reason: 'invalid_target' };
  }

  if (args.provider && args.provider !== 'credentials' && args.provider !== 'google') {
    return { ok: false, reason: 'invalid_provider' };
  }

  return { ok: true };
}

function shouldSuppressEvent(args: FunnelLogArgs): boolean {
  const dedupeWindowMs = DEDUPE_WINDOW_MS_BY_EVENT[args.event];
  if (!dedupeWindowMs) return false;

  const now = Date.now();
  const fingerprint = [
    args.event,
    args.surface,
    args.userId ?? args.requestId ?? (args.authenticated ? 'auth' : 'anon'),
    args.source ?? 'none',
    args.target ?? 'none',
    args.provider ?? 'none',
  ].join('|');

  const lastSeenAt = guardrailDedupeByEvent.get(fingerprint);
  guardrailDedupeByEvent.set(fingerprint, now);

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

export function resetFunnelGuardrailsForTests() {
  guardrailDedupeByEvent.clear();
}

export function logFunnelGuardrail(args: FunnelGuardrailLogArgs): void {
  if (!isTrackingEnabled()) return;

  logWarn('analytics.funnel.guardrail', {
    schemaVersion: FUNNEL_SCHEMA_VERSION,
    reason: args.reason,
    surface: args.surface,
    event: args.event ?? undefined,
    authenticated: args.authenticated ?? undefined,
    userId: args.userId ?? undefined,
    source: args.source ?? undefined,
    target: args.target ?? undefined,
    provider: args.provider ?? undefined,
    requestId: args.requestId ?? undefined,
    rawSource: args.rawSource ?? undefined,
    rawTarget: args.rawTarget ?? undefined,
    details: args.details ?? undefined,
  });
}

export function parseLandingAuthCtaSourceWithReason(
  value: string | null | undefined,
): ParsedLandingAuthCtaSource {
  const raw = trimInput(value);
  if (!raw) {
    return {
      source: DEFAULT_LANDING_AUTH_CTA_SOURCE,
      reason: 'missing',
      raw: null,
    };
  }

  if (!LANDING_AUTH_CTA_SOURCES.includes(raw as LandingAuthCtaSource)) {
    return {
      source: DEFAULT_LANDING_AUTH_CTA_SOURCE,
      reason: 'invalid',
      raw,
    };
  }

  return {
    source: raw as LandingAuthCtaSource,
    reason: 'accepted',
    raw,
  };
}

export function parseLandingAuthCtaTargetWithReason(
  value: string | null | undefined,
): ParsedLandingAuthCtaTarget {
  const raw = trimInput(value);
  if (!raw) {
    return {
      target: DEFAULT_LANDING_AUTH_CTA_TARGET,
      reason: 'missing',
      raw: null,
    };
  }

  if (!LANDING_AUTH_CTA_TARGETS.includes(raw as LandingAuthCtaTarget)) {
    return {
      target: DEFAULT_LANDING_AUTH_CTA_TARGET,
      reason: 'invalid',
      raw,
    };
  }

  return {
    target: raw as LandingAuthCtaTarget,
    reason: 'accepted',
    raw,
  };
}

export function buildLandingAuthTrackHref(args: {
  target: LandingAuthCtaTarget;
  source: LandingAuthCtaSource;
}): string {
  const params = new URLSearchParams();
  params.set('target', args.target);
  params.set('source', args.source);
  return `/landing/auth/track?${params.toString()}`;
}

export function logFunnelEvent(args: FunnelLogArgs): void {
  if (!isTrackingEnabled()) return;

  const validation = validateLogArgs(args);
  if (!validation.ok) {
    logFunnelGuardrail({
      reason: 'invalid_payload_dropped',
      event: args.event,
      surface: args.surface,
      authenticated: args.authenticated,
      userId: args.userId,
      source: args.source,
      target: args.target,
      provider: args.provider,
      requestId: args.requestId,
      details: validation.reason,
    });
    return;
  }

  if (shouldSuppressEvent(args)) {
    logFunnelGuardrail({
      reason: 'duplicate_event_suppressed',
      event: args.event,
      surface: args.surface,
      authenticated: args.authenticated,
      userId: args.userId,
      source: args.source,
      target: args.target,
      provider: args.provider,
      requestId: args.requestId,
    });
    return;
  }

  logInfo('analytics.funnel', {
    schemaVersion: FUNNEL_SCHEMA_VERSION,
    event: args.event,
    surface: args.surface,
    authenticated: args.authenticated,
    userId: args.userId ?? undefined,
    source: args.source ?? undefined,
    target: args.target ?? undefined,
    provider: args.provider ?? undefined,
    requestId: args.requestId ?? undefined,
  });
}
