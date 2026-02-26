import { describe, expect, it } from 'vitest';

import { buildConversionSummary, parseConversionSummaryRange } from '../conversion';

function analyticsLog(args: {
  id: string;
  timestamp: string;
  message: 'analytics.funnel' | 'analytics.pro_conversion';
  event: string;
  userId?: string;
  requestId?: string;
}): {
  id: string;
  timestamp: string;
  level: 'info';
  message: string;
  requestId?: string;
  metadata: Record<string, string>;
} {
  return {
    id: args.id,
    timestamp: args.timestamp,
    level: 'info',
    message: args.message,
    requestId: args.requestId,
    metadata: {
      event: args.event,
      ...(args.userId ? { userId: args.userId } : {}),
    },
  };
}

describe('conversion summary helpers', () => {
  it('defaults to trailing 7 UTC days when no range is supplied', () => {
    const { rangeStart, rangeEnd } = parseConversionSummaryRange({
      start: null,
      end: null,
      now: new Date('2026-02-26T20:15:00.000Z'),
    });

    expect(rangeStart.toISOString()).toBe('2026-02-20T00:00:00.000Z');
    expect(rangeEnd.toISOString()).toBe('2026-02-26T00:00:00.000Z');
  });

  it('rejects invalid partial range input', () => {
    expect(() =>
      parseConversionSummaryRange({
        start: '2026-02-20',
        end: null,
      }),
    ).toThrow('Both start and end are required');
  });

  it('builds north-star KPIs with baseline comparison', () => {
    const entries = [
      analyticsLog({
        id: 'e1',
        timestamp: '2026-02-20T08:00:00.000Z',
        message: 'analytics.funnel',
        event: 'landing_page_view',
        requestId: 'r1',
      }),
      analyticsLog({
        id: 'e2',
        timestamp: '2026-02-20T09:00:00.000Z',
        message: 'analytics.funnel',
        event: 'habit_first_completion_recorded',
        userId: 'u1',
      }),
      analyticsLog({
        id: 'e3',
        timestamp: '2026-02-20T10:00:00.000Z',
        message: 'analytics.pro_conversion',
        event: 'pro_page_view',
        userId: 'u1',
      }),
      analyticsLog({
        id: 'e4',
        timestamp: '2026-02-20T11:00:00.000Z',
        message: 'analytics.pro_conversion',
        event: 'pro_checkout_initiated',
        userId: 'u1',
      }),
      analyticsLog({
        id: 'e5',
        timestamp: '2026-02-20T12:00:00.000Z',
        message: 'analytics.pro_conversion',
        event: 'pro_entitlement_active',
        userId: 'u1',
      }),
      analyticsLog({
        id: 'b1',
        timestamp: '2026-02-13T08:00:00.000Z',
        message: 'analytics.funnel',
        event: 'landing_page_view',
        requestId: 'rb1',
      }),
      analyticsLog({
        id: 'b2',
        timestamp: '2026-02-13T10:00:00.000Z',
        message: 'analytics.pro_conversion',
        event: 'pro_page_view',
        userId: 'u2',
      }),
    ];

    const summary = buildConversionSummary({
      entries,
      rangeStart: new Date('2026-02-20T00:00:00.000Z'),
      rangeEnd: new Date('2026-02-20T00:00:00.000Z'),
      compareWithBaseline: true,
    });

    expect(summary.kpis).toHaveLength(3);
    expect(summary.kpis[0]?.id).toBe('landing_to_first_completion');
    expect(summary.kpis[0]?.rate).toBe(1);
    expect(summary.kpis[1]?.id).toBe('pro_page_to_checkout_start');
    expect(summary.kpis[1]?.rate).toBe(1);
    expect(summary.kpis[2]?.id).toBe('checkout_to_entitlement_active');
    expect(summary.kpis[2]?.rate).toBe(1);
    expect(summary.events.find((event) => event.event === 'pro_checkout_initiated')?.users).toBe(1);
    expect(summary.coverage.partial).toBe(false);
  });

  it('flags partial coverage when selected range has no analytics events', () => {
    const summary = buildConversionSummary({
      entries: [],
      rangeStart: new Date('2026-02-20T00:00:00.000Z'),
      rangeEnd: new Date('2026-02-21T00:00:00.000Z'),
      compareWithBaseline: false,
    });

    expect(summary.coverage.partial).toBe(true);
    expect(summary.coverage.reasons[0]).toContain('No analytics events');
    expect(summary.kpis.some((kpi) => kpi.status === 'insufficient_data')).toBe(true);
  });
});
