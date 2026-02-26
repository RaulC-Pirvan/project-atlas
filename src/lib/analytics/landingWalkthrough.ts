import { logInfo, logWarn } from '../observability/logger';

export const LANDING_WALKTHROUGH_SCHEMA_VERSION = 1 as const;

export const LANDING_WALKTHROUGH_EVENTS = [
  'landing_walkthrough_view',
  'landing_walkthrough_cta_click',
] as const;

export type LandingWalkthroughEvent = (typeof LANDING_WALKTHROUGH_EVENTS)[number];

export const LANDING_WALKTHROUGH_CTA_SOURCES = [
  'walkthrough_primary',
  'walkthrough_secondary',
] as const;

export type LandingWalkthroughCtaSource = (typeof LANDING_WALKTHROUGH_CTA_SOURCES)[number];

export const DEFAULT_LANDING_WALKTHROUGH_SOURCE: LandingWalkthroughCtaSource =
  'walkthrough_primary';

export const LANDING_WALKTHROUGH_CTA_TARGETS = [
  '/sign-up',
  '/sign-in',
  '/today',
  '/calendar',
] as const;

export type LandingWalkthroughCtaTarget = (typeof LANDING_WALKTHROUGH_CTA_TARGETS)[number];

export const DEFAULT_LANDING_WALKTHROUGH_TARGET = {
  signedOut: '/sign-up',
  signedIn: '/today',
} as const;

export type LandingWalkthroughSurface = '/landing' | '/landing/walkthrough/track';

export type LandingWalkthroughSourceParseReason = 'accepted' | 'missing' | 'invalid';
export type LandingWalkthroughTargetParseReason = 'accepted' | 'missing' | 'invalid' | 'mismatch';

type LandingWalkthroughGuardrailReason =
  | 'invalid_source_fallback'
  | 'invalid_target_fallback'
  | 'duplicate_event_suppressed';

type LandingWalkthroughGuardrailLogArgs = {
  reason: LandingWalkthroughGuardrailReason;
  surface: LandingWalkthroughSurface;
  authenticated?: boolean;
  userId?: string | null;
  source?: LandingWalkthroughCtaSource;
  target?: LandingWalkthroughCtaTarget;
  rawSource?: string | null;
  rawTarget?: string | null;
  event?: LandingWalkthroughEvent;
  requestId?: string;
};

type ParsedLandingWalkthroughSource = {
  source: LandingWalkthroughCtaSource;
  reason: LandingWalkthroughSourceParseReason;
  raw: string | null;
};

type ParsedLandingWalkthroughTarget = {
  target: LandingWalkthroughCtaTarget;
  reason: LandingWalkthroughTargetParseReason;
  raw: string | null;
};

const guardrailDedupeByEvent = new Map<string, number>();
const DEDUPE_WINDOW_MS_BY_EVENT: Partial<Record<LandingWalkthroughEvent, number>> = {
  landing_walkthrough_view: 10_000,
  landing_walkthrough_cta_click: 3_000,
};

function isTrackingEnabled(): boolean {
  const analyticsEnabled = process.env.ANALYTICS_ENABLED !== 'false';
  const walkthroughEnabled = process.env.LANDING_WALKTHROUGH_ENABLED !== 'false';
  return analyticsEnabled && walkthroughEnabled;
}

function trimInput(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function parseLandingWalkthroughSourceWithReason(
  value: string | null | undefined,
): ParsedLandingWalkthroughSource {
  const raw = trimInput(value);
  if (!raw) {
    return {
      source: DEFAULT_LANDING_WALKTHROUGH_SOURCE,
      reason: 'missing',
      raw: null,
    };
  }

  if (!LANDING_WALKTHROUGH_CTA_SOURCES.includes(raw as LandingWalkthroughCtaSource)) {
    return {
      source: DEFAULT_LANDING_WALKTHROUGH_SOURCE,
      reason: 'invalid',
      raw,
    };
  }

  return {
    source: raw as LandingWalkthroughCtaSource,
    reason: 'accepted',
    raw,
  };
}

function defaultTargetForAuthState(authenticated: boolean): LandingWalkthroughCtaTarget {
  return authenticated
    ? DEFAULT_LANDING_WALKTHROUGH_TARGET.signedIn
    : DEFAULT_LANDING_WALKTHROUGH_TARGET.signedOut;
}

function isAllowedTargetForAuthState(
  target: LandingWalkthroughCtaTarget,
  authenticated: boolean,
): boolean {
  if (authenticated) {
    return target === '/today' || target === '/calendar';
  }

  return target === '/sign-up' || target === '/sign-in';
}

export function parseLandingWalkthroughTargetWithReason(args: {
  value: string | null | undefined;
  authenticated: boolean;
}): ParsedLandingWalkthroughTarget {
  const raw = trimInput(args.value);
  if (!raw) {
    return {
      target: defaultTargetForAuthState(args.authenticated),
      reason: 'missing',
      raw: null,
    };
  }

  if (!LANDING_WALKTHROUGH_CTA_TARGETS.includes(raw as LandingWalkthroughCtaTarget)) {
    return {
      target: defaultTargetForAuthState(args.authenticated),
      reason: 'invalid',
      raw,
    };
  }

  const target = raw as LandingWalkthroughCtaTarget;
  if (!isAllowedTargetForAuthState(target, args.authenticated)) {
    return {
      target: defaultTargetForAuthState(args.authenticated),
      reason: 'mismatch',
      raw,
    };
  }

  return {
    target,
    reason: 'accepted',
    raw,
  };
}

function shouldSuppressEvent(args: {
  event: LandingWalkthroughEvent;
  surface: LandingWalkthroughSurface;
  authenticated: boolean;
  userId?: string | null;
  source?: LandingWalkthroughCtaSource;
  target?: LandingWalkthroughCtaTarget;
}): boolean {
  const dedupeWindowMs = DEDUPE_WINDOW_MS_BY_EVENT[args.event];
  if (!dedupeWindowMs) return false;

  const now = Date.now();
  const fingerprint = [
    args.event,
    args.surface,
    args.userId ?? (args.authenticated ? 'auth' : 'anon'),
    args.source ?? DEFAULT_LANDING_WALKTHROUGH_SOURCE,
    args.target ?? 'none',
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

export function resetLandingWalkthroughGuardrailsForTests() {
  guardrailDedupeByEvent.clear();
}

export function logLandingWalkthroughGuardrail(args: LandingWalkthroughGuardrailLogArgs): void {
  if (!isTrackingEnabled()) return;

  logWarn('analytics.landing_walkthrough.guardrail', {
    schemaVersion: LANDING_WALKTHROUGH_SCHEMA_VERSION,
    reason: args.reason,
    surface: args.surface,
    authenticated: args.authenticated ?? undefined,
    userId: args.userId ?? undefined,
    source: args.source ?? undefined,
    target: args.target ?? undefined,
    rawSource: args.rawSource ?? undefined,
    rawTarget: args.rawTarget ?? undefined,
    event: args.event ?? undefined,
    requestId: args.requestId ?? undefined,
  });
}

export function buildLandingWalkthroughTrackHref(args: {
  target: LandingWalkthroughCtaTarget;
  source: LandingWalkthroughCtaSource;
}): string {
  const params = new URLSearchParams();
  params.set('target', args.target);
  params.set('source', args.source);
  return `/landing/walkthrough/track?${params.toString()}`;
}

type LandingWalkthroughLogArgs = {
  event: LandingWalkthroughEvent;
  surface: LandingWalkthroughSurface;
  authenticated: boolean;
  userId?: string | null;
  source?: LandingWalkthroughCtaSource;
  target?: LandingWalkthroughCtaTarget;
  requestId?: string;
};

export function logLandingWalkthroughEvent(args: LandingWalkthroughLogArgs): void {
  if (!isTrackingEnabled()) return;

  if (shouldSuppressEvent(args)) {
    if (args.event === 'landing_walkthrough_view') {
      return;
    }

    logLandingWalkthroughGuardrail({
      reason: 'duplicate_event_suppressed',
      event: args.event,
      surface: args.surface,
      authenticated: args.authenticated,
      userId: args.userId,
      source: args.source,
      target: args.target,
      requestId: args.requestId,
    });
    return;
  }

  logInfo('analytics.landing_walkthrough', {
    schemaVersion: LANDING_WALKTHROUGH_SCHEMA_VERSION,
    event: args.event,
    surface: args.surface,
    authenticated: args.authenticated,
    userId: args.userId ?? undefined,
    source: args.source ?? undefined,
    target: args.target ?? undefined,
    requestId: args.requestId ?? undefined,
  });
}
