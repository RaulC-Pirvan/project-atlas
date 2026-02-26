import { FUNNEL_EVENTS, type FunnelEvent } from '../analytics/funnel';
import { PRO_CONVERSION_EVENTS, type ProConversionEvent } from '../analytics/proConversion';
import { addUtcDays, parseUtcDateKey, toUtcDateKey } from '../habits/dates';
import type { AdminLogEntry } from '../observability/adminLogStore';

export type ConversionEventName = FunnelEvent | ProConversionEvent;

export type ConversionKpiStatus = 'ok' | 'insufficient_data' | 'partial';

export type ConversionKpi = {
  id:
    | 'landing_to_first_completion'
    | 'pro_page_to_checkout_start'
    | 'checkout_to_entitlement_active';
  label: string;
  formula: string;
  sourceOfTruth: string;
  numeratorEvent: ConversionEventName;
  denominatorEvent: ConversionEventName;
  numeratorUsers: number;
  denominatorUsers: number;
  rate: number | null;
  baselineRate: number | null;
  deltaRate: number | null;
  status: ConversionKpiStatus;
};

export type ConversionEventSummary = {
  event: ConversionEventName;
  users: number;
  events: number;
  baselineUsers: number | null;
  baselineEvents: number | null;
};

export type ConversionRange = {
  startDate: string;
  endDate: string;
  dayCount: number;
};

export type ConversionCoverage = {
  partial: boolean;
  reasons: string[];
};

export type ConversionSummary = {
  generatedAt: Date;
  range: ConversionRange;
  baselineRange: ConversionRange | null;
  compareWithBaseline: boolean;
  kpis: ConversionKpi[];
  events: ConversionEventSummary[];
  coverage: ConversionCoverage;
};

type EventAggregate = {
  events: number;
  users: Set<string>;
};

type RangeStats = {
  byEvent: Map<ConversionEventName, EventAggregate>;
  analyticsEventCount: number;
};

type ParseSummaryRangeArgs = {
  start: string | null;
  end: string | null;
  now?: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 90;

const KPI_DEFINITIONS = [
  {
    id: 'landing_to_first_completion' as const,
    label: 'Landing -> First Completion Rate',
    numeratorEvent: 'habit_first_completion_recorded' as const,
    denominatorEvent: 'landing_page_view' as const,
    formula: 'unique_users(habit_first_completion_recorded) / unique_users(landing_page_view)',
    sourceOfTruth: 'analytics.funnel (server + client contract)',
  },
  {
    id: 'pro_page_to_checkout_start' as const,
    label: 'Pro Page -> Checkout Start Rate',
    numeratorEvent: 'pro_checkout_initiated' as const,
    denominatorEvent: 'pro_page_view' as const,
    formula: 'unique_users(pro_checkout_initiated) / unique_users(pro_page_view)',
    sourceOfTruth: 'analytics.pro_conversion (server truth for checkout start)',
  },
  {
    id: 'checkout_to_entitlement_active' as const,
    label: 'Checkout Start -> Entitlement Active Rate',
    numeratorEvent: 'pro_entitlement_active' as const,
    denominatorEvent: 'pro_checkout_initiated' as const,
    formula: 'unique_users(pro_entitlement_active) / unique_users(pro_checkout_initiated)',
    sourceOfTruth: 'analytics.pro_conversion + billing webhook projection',
  },
] as const;

const SUMMARY_EVENTS: ConversionEventName[] = [
  'landing_page_view',
  'auth_sign_up_completed',
  'auth_sign_in_completed',
  'habit_first_created',
  'habit_first_completion_recorded',
  'pro_page_view',
  'pro_checkout_initiated',
  'pro_checkout_return',
  'pro_entitlement_active',
];

const FUNNEL_EVENT_SET = new Set(FUNNEL_EVENTS);
const PRO_EVENT_SET = new Set(PRO_CONVERSION_EVENTS);

function clampUtcDate(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getUtcDayCountInclusive(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
}

function getMetadataString(entry: AdminLogEntry, key: string): string | null {
  const value = entry.metadata?.[key];
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function getEventName(entry: AdminLogEntry): ConversionEventName | null {
  const event = getMetadataString(entry, 'event');
  if (!event) return null;

  if (entry.message === 'analytics.funnel' && FUNNEL_EVENT_SET.has(event as FunnelEvent)) {
    return event as FunnelEvent;
  }

  if (
    entry.message === 'analytics.pro_conversion' &&
    PRO_EVENT_SET.has(event as ProConversionEvent)
  ) {
    return event as ProConversionEvent;
  }

  return null;
}

function toActorId(entry: AdminLogEntry): string {
  const userId = getMetadataString(entry, 'userId');
  if (userId) return `user:${userId}`;
  if (entry.requestId) return `request:${entry.requestId}`;
  return `entry:${entry.id}`;
}

function buildRangeStats(entries: AdminLogEntry[], start: Date, end: Date): RangeStats {
  const startMs = start.getTime();
  const endExclusiveMs = addUtcDays(end, 1).getTime();

  const byEvent = new Map<ConversionEventName, EventAggregate>();
  let analyticsEventCount = 0;

  for (const entry of entries) {
    const timestampMs = new Date(entry.timestamp).getTime();
    if (!Number.isFinite(timestampMs) || timestampMs < startMs || timestampMs >= endExclusiveMs) {
      continue;
    }

    const event = getEventName(entry);
    if (!event) continue;

    analyticsEventCount += 1;
    const aggregate = byEvent.get(event) ?? { events: 0, users: new Set<string>() };
    aggregate.events += 1;
    aggregate.users.add(toActorId(entry));
    byEvent.set(event, aggregate);
  }

  return { byEvent, analyticsEventCount };
}

function getAggregateCount(
  map: Map<ConversionEventName, EventAggregate>,
  event: ConversionEventName,
): { users: number; events: number } {
  const aggregate = map.get(event);
  if (!aggregate) return { users: 0, events: 0 };
  return { users: aggregate.users.size, events: aggregate.events };
}

function computeRate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return numerator / denominator;
}

export function parseConversionSummaryRange(args: ParseSummaryRangeArgs): {
  rangeStart: Date;
  rangeEnd: Date;
} {
  const now = args.now ?? new Date();
  const todayUtc = clampUtcDate(now);

  if (!args.start && !args.end) {
    return {
      rangeStart: addUtcDays(todayUtc, -6),
      rangeEnd: todayUtc,
    };
  }

  if (!args.start || !args.end) {
    throw new Error('Both start and end are required when either is provided.');
  }

  const startDate = parseUtcDateKey(args.start);
  const endDate = parseUtcDateKey(args.end);

  if (!startDate || !endDate) {
    throw new Error('Invalid date range.');
  }

  if (startDate.getTime() > endDate.getTime()) {
    throw new Error('Start date must be before or equal to end date.');
  }

  const dayCount = getUtcDayCountInclusive(startDate, endDate);
  if (dayCount > MAX_RANGE_DAYS) {
    throw new Error(`Date range cannot exceed ${MAX_RANGE_DAYS} days.`);
  }

  return {
    rangeStart: startDate,
    rangeEnd: endDate,
  };
}

function toRange(start: Date, end: Date): ConversionRange {
  return {
    startDate: toUtcDateKey(start),
    endDate: toUtcDateKey(end),
    dayCount: getUtcDayCountInclusive(start, end),
  };
}

function findOldestAnalyticsTimestamp(entries: AdminLogEntry[]): number | null {
  let oldest: number | null = null;

  for (const entry of entries) {
    const event = getEventName(entry);
    if (!event) continue;
    const timestamp = new Date(entry.timestamp).getTime();
    if (!Number.isFinite(timestamp)) continue;
    if (oldest === null || timestamp < oldest) {
      oldest = timestamp;
    }
  }

  return oldest;
}

export function buildConversionSummary(args: {
  entries: AdminLogEntry[];
  rangeStart: Date;
  rangeEnd: Date;
  compareWithBaseline: boolean;
  now?: Date;
}): ConversionSummary {
  const generatedAt = args.now ?? new Date();
  const rangeStats = buildRangeStats(args.entries, args.rangeStart, args.rangeEnd);

  const baselineRangeStart = addUtcDays(
    args.rangeStart,
    -getUtcDayCountInclusive(args.rangeStart, args.rangeEnd),
  );
  const baselineRangeEnd = addUtcDays(args.rangeStart, -1);
  const baselineStats = args.compareWithBaseline
    ? buildRangeStats(args.entries, baselineRangeStart, baselineRangeEnd)
    : null;

  const kpis: ConversionKpi[] = KPI_DEFINITIONS.map((definition) => {
    const numerator = getAggregateCount(rangeStats.byEvent, definition.numeratorEvent);
    const denominator = getAggregateCount(rangeStats.byEvent, definition.denominatorEvent);
    const rate = computeRate(numerator.users, denominator.users);

    const baselineNumerator = baselineStats
      ? getAggregateCount(baselineStats.byEvent, definition.numeratorEvent)
      : null;
    const baselineDenominator = baselineStats
      ? getAggregateCount(baselineStats.byEvent, definition.denominatorEvent)
      : null;
    const baselineRate =
      baselineNumerator && baselineDenominator
        ? computeRate(baselineNumerator.users, baselineDenominator.users)
        : null;

    const status: ConversionKpiStatus =
      denominator.users === 0
        ? 'insufficient_data'
        : rangeStats.analyticsEventCount === 0
          ? 'partial'
          : 'ok';

    return {
      id: definition.id,
      label: definition.label,
      formula: definition.formula,
      sourceOfTruth: definition.sourceOfTruth,
      numeratorEvent: definition.numeratorEvent,
      denominatorEvent: definition.denominatorEvent,
      numeratorUsers: numerator.users,
      denominatorUsers: denominator.users,
      rate,
      baselineRate,
      deltaRate: rate !== null && baselineRate !== null ? rate - baselineRate : null,
      status,
    };
  });

  const events: ConversionEventSummary[] = SUMMARY_EVENTS.map((event) => {
    const active = getAggregateCount(rangeStats.byEvent, event);
    const baseline = baselineStats ? getAggregateCount(baselineStats.byEvent, event) : null;

    return {
      event,
      users: active.users,
      events: active.events,
      baselineUsers: baseline ? baseline.users : null,
      baselineEvents: baseline ? baseline.events : null,
    };
  });

  const coverageReasons: string[] = [];
  if (rangeStats.analyticsEventCount === 0) {
    coverageReasons.push('No analytics events were captured in this date range.');
  }

  const oldestAnalyticsTimestamp = findOldestAnalyticsTimestamp(args.entries);
  if (oldestAnalyticsTimestamp !== null && oldestAnalyticsTimestamp > args.rangeStart.getTime()) {
    coverageReasons.push(
      'Log coverage starts after the selected range start (in-memory feed may be truncated).',
    );
  }

  if (kpis.some((kpi) => kpi.status === 'insufficient_data')) {
    coverageReasons.push(
      'Some KPI denominators are zero, so rates are unavailable for those cards.',
    );
  }

  return {
    generatedAt,
    range: toRange(args.rangeStart, args.rangeEnd),
    baselineRange: args.compareWithBaseline ? toRange(baselineRangeStart, baselineRangeEnd) : null,
    compareWithBaseline: args.compareWithBaseline,
    kpis,
    events,
    coverage: {
      partial: coverageReasons.length > 0,
      reasons: coverageReasons,
    },
  };
}
