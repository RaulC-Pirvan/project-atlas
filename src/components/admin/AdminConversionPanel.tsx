'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Notice } from '../ui/Notice';

type ConversionKpiStatus = 'ok' | 'insufficient_data' | 'partial';

type ConversionKpi = {
  id:
    | 'landing_to_first_completion'
    | 'pro_page_to_checkout_start'
    | 'checkout_to_entitlement_active';
  label: string;
  formula: string;
  sourceOfTruth: string;
  numeratorEvent: string;
  denominatorEvent: string;
  numeratorUsers: number;
  denominatorUsers: number;
  rate: number | null;
  baselineRate: number | null;
  deltaRate: number | null;
  status: ConversionKpiStatus;
};

type ConversionEventSummary = {
  event: string;
  users: number;
  events: number;
  baselineUsers: number | null;
  baselineEvents: number | null;
};

type ConversionTransition = {
  id: string;
  label: string;
  fromEvent: string;
  toEvent: string;
  fromUsers: number;
  toUsers: number;
  transitionedUsers: number;
  rate: number | null;
  baselineTransitionedUsers: number | null;
  baselineRate: number | null;
};

type ConversionRange = {
  startDate: string;
  endDate: string;
  dayCount: number;
};

type ConversionSummary = {
  generatedAt: string;
  range: ConversionRange;
  baselineRange: ConversionRange | null;
  compareWithBaseline: boolean;
  kpis: ConversionKpi[];
  transitions: ConversionTransition[];
  events: ConversionEventSummary[];
  coverage: {
    partial: boolean;
    reasons: string[];
  };
};

type ConversionResponse = {
  ok: boolean;
  data: {
    summary: ConversionSummary;
  };
};

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

function formatRate(value: number | null): string {
  if (value === null) return '--';
  return `${(value * 100).toFixed(1)}%`;
}

function formatDelta(value: number | null): string {
  if (value === null) return '--';
  const pctPoints = value * 100;
  const sign = pctPoints > 0 ? '+' : '';
  return `${sign}${pctPoints.toFixed(1)} pp`;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US');
}

function statusLabel(status: ConversionKpiStatus): string {
  if (status === 'ok') return 'OK';
  if (status === 'partial') return 'Partial';
  return 'Insufficient data';
}

function buildExportSummary(summary: ConversionSummary): string {
  const lines: string[] = [];
  lines.push(`Generated At,${summary.generatedAt}`);
  lines.push(`Range Start,${summary.range.startDate}`);
  lines.push(`Range End,${summary.range.endDate}`);
  lines.push(`Range Days,${summary.range.dayCount}`);
  lines.push(`Compare Baseline,${summary.compareWithBaseline ? 'true' : 'false'}`);
  if (summary.baselineRange) {
    lines.push(`Baseline Start,${summary.baselineRange.startDate}`);
    lines.push(`Baseline End,${summary.baselineRange.endDate}`);
    lines.push(`Baseline Days,${summary.baselineRange.dayCount}`);
  }
  lines.push('');
  lines.push(
    'KPI,Rate,Baseline Rate,Delta,Status,Numerator Event,Numerator Users,Denominator Event,Denominator Users,Formula,Source',
  );

  for (const kpi of summary.kpis) {
    lines.push(
      [
        kpi.label,
        formatRate(kpi.rate),
        formatRate(kpi.baselineRate),
        formatDelta(kpi.deltaRate),
        statusLabel(kpi.status),
        kpi.numeratorEvent,
        String(kpi.numeratorUsers),
        kpi.denominatorEvent,
        String(kpi.denominatorUsers),
        kpi.formula,
        kpi.sourceOfTruth,
      ].join(','),
    );
  }

  lines.push('');
  lines.push('Transition,Rate,Transitioned Users,From Users,To Users,Baseline Rate');
  for (const transition of summary.transitions) {
    lines.push(
      [
        transition.label,
        formatRate(transition.rate),
        String(transition.transitionedUsers),
        String(transition.fromUsers),
        String(transition.toUsers),
        formatRate(transition.baselineRate),
      ].join(','),
    );
  }

  lines.push('');
  lines.push('Event,Users,Events,Baseline Users,Baseline Events');
  for (const event of summary.events) {
    lines.push(
      [
        event.event,
        String(event.users),
        String(event.events),
        event.baselineUsers === null ? '' : String(event.baselineUsers),
        event.baselineEvents === null ? '' : String(event.baselineEvents),
      ].join(','),
    );
  }

  return lines.join('\n');
}

export function AdminConversionPanel() {
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ConversionSummary | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [compareWithBaseline, setCompareWithBaseline] = useState(true);
  const [isSeedingSampleData, setIsSeedingSampleData] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  const canSeedSampleData = process.env.NODE_ENV !== 'production';

  const loadConversion = useCallback(
    async (opts?: { startDate?: string; endDate?: string; compare?: boolean }) => {
      setState('loading');
      setError(null);

      const nextStartDate = opts?.startDate ?? '';
      const nextEndDate = opts?.endDate ?? '';
      const nextCompare = opts?.compare ?? true;

      const params = new URLSearchParams();
      if (nextStartDate && nextEndDate) {
        params.set('start', nextStartDate);
        params.set('end', nextEndDate);
      }
      params.set('compare', nextCompare ? 'true' : 'false');

      const href = `/api/admin/conversion${params.toString().length > 0 ? `?${params.toString()}` : ''}`;

      try {
        const response = await fetch(href, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Unable to load conversion metrics.');
        }

        const body = (await response.json()) as ConversionResponse;
        if (!body.ok) {
          throw new Error('Unable to load conversion metrics.');
        }

        const nextSummary = body.data.summary;
        setSummary(nextSummary);
        setStartDate(nextSummary.range.startDate);
        setEndDate(nextSummary.range.endDate);
        setCompareWithBaseline(nextSummary.compareWithBaseline);
        setState('ready');
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : 'Unable to load conversion metrics.';
        setError(message);
        setState('error');
      }
    },
    [],
  );

  const handleRefresh = useCallback(() => {
    void loadConversion({
      startDate,
      endDate,
      compare: compareWithBaseline,
    });
  }, [compareWithBaseline, endDate, loadConversion, startDate]);

  const handleApply = useCallback(() => {
    void loadConversion({
      startDate,
      endDate,
      compare: compareWithBaseline,
    });
  }, [compareWithBaseline, endDate, loadConversion, startDate]);

  const handleReset = useCallback(() => {
    setStartDate('');
    setEndDate('');
    setCompareWithBaseline(true);
    setSeedMessage(null);
    setSeedError(null);
    void loadConversion({
      startDate: '',
      endDate: '',
      compare: true,
    });
  }, [loadConversion]);

  const handleSeedSampleData = useCallback(async () => {
    setIsSeedingSampleData(true);
    setSeedMessage(null);
    setSeedError(null);

    try {
      const response = await fetch('/api/admin/debug/conversion/seed', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Unable to seed conversion sample data.');
      }

      const body = (await response.json()) as {
        ok: boolean;
        data?: {
          seeded: { totalEvents: number };
        };
      };
      if (!body.ok || !body.data?.seeded) {
        throw new Error('Unable to seed conversion sample data.');
      }

      setSeedMessage(`Sample analytics seeded (${body.data.seeded.totalEvents} events).`);
      await loadConversion({
        startDate,
        endDate,
        compare: compareWithBaseline,
      });
    } catch (seedFetchError) {
      const message =
        seedFetchError instanceof Error
          ? seedFetchError.message
          : 'Unable to seed conversion sample data.';
      setSeedError(message);
    } finally {
      setIsSeedingSampleData(false);
    }
  }, [compareWithBaseline, endDate, loadConversion, startDate]);

  const exportSummary = useMemo(() => {
    if (!summary) return '';
    return buildExportSummary(summary);
  }, [summary]);

  useEffect(() => {
    void loadConversion({
      startDate: '',
      endDate: '',
      compare: true,
    });
  }, [loadConversion]);

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Conversion baseline</p>
          <p className="text-xs text-black/50 dark:text-white/50">
            Funnel KPI cards and event totals for admin review.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canSeedSampleData ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSeedSampleData}
              disabled={isSeedingSampleData}
            >
              {isSeedingSampleData ? 'Seeding...' : 'Seed sample data'}
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={handleRefresh}>
            Refresh metrics
          </Button>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-black/10 p-4 text-sm dark:border-white/10 md:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1">
          <span className="block text-xs uppercase tracking-[0.2em] text-black/50 dark:text-white/50">
            Start date
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="h-10 w-full rounded-xl border border-black/15 px-3 text-sm dark:border-white/20 dark:bg-black"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-xs uppercase tracking-[0.2em] text-black/50 dark:text-white/50">
            End date
          </span>
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="h-10 w-full rounded-xl border border-black/15 px-3 text-sm dark:border-white/20 dark:bg-black"
          />
        </label>
        <label className="flex h-10 items-center gap-2 self-end">
          <input
            type="checkbox"
            checked={compareWithBaseline}
            onChange={(event) => setCompareWithBaseline(event.target.checked)}
            className="h-4 w-4 rounded border-black/30"
          />
          <span className="text-xs uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
            Compare baseline period
          </span>
        </label>
        <div className="flex h-10 items-center gap-2 self-end">
          <Button type="button" variant="outline" size="sm" onClick={handleApply}>
            Apply
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>

      {state === 'idle' || state === 'loading' ? (
        <Notice>Loading conversion metrics...</Notice>
      ) : null}
      {state === 'error' ? <Notice tone="error">{error}</Notice> : null}
      {seedMessage ? <Notice>{seedMessage}</Notice> : null}
      {seedError ? <Notice tone="error">{seedError}</Notice> : null}

      {summary ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-black/10 px-4 py-3 text-xs text-black/60 dark:border-white/10 dark:text-white/60">
            <p>
              Range: {summary.range.startDate} {'->'} {summary.range.endDate} (
              {summary.range.dayCount} day{summary.range.dayCount === 1 ? '' : 's'})
            </p>
            {summary.baselineRange ? (
              <p>
                Baseline: {summary.baselineRange.startDate} {'->'} {summary.baselineRange.endDate} (
                {summary.baselineRange.dayCount} day
                {summary.baselineRange.dayCount === 1 ? '' : 's'})
              </p>
            ) : null}
            <p>Generated: {formatTimestamp(summary.generatedAt)}</p>
          </div>

          {summary.coverage.partial ? (
            <Notice>
              {summary.coverage.reasons.map((reason) => (
                <span key={reason} className="block">
                  - {reason}
                </span>
              ))}
            </Notice>
          ) : null}

          <div className="space-y-3">
            {summary.kpis.map((kpi) => (
              <div
                key={kpi.id}
                className="rounded-2xl border border-black/10 p-4 text-sm dark:border-white/10"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold leading-tight">{kpi.label}</p>
                  <span className="rounded-full border border-black/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-black/60 dark:border-white/20 dark:text-white/60">
                    {statusLabel(kpi.status)}
                  </span>
                </div>
                <p className="mt-3 text-2xl font-semibold">{formatRate(kpi.rate)}</p>
                <p className="mt-1 text-xs text-black/60 dark:text-white/60">
                  Baseline: {formatRate(kpi.baselineRate)} ({formatDelta(kpi.deltaRate)})
                </p>
                <p className="mt-3 text-xs text-black/60 dark:text-white/60">
                  {kpi.numeratorUsers} / {kpi.denominatorUsers} unique users
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
            <p className="text-sm font-semibold">Funnel transitions (read-only)</p>
            <p className="text-xs text-black/60 dark:text-white/60">
              Transition overlap uses shared actor ids between source and destination events.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10">
                    <th className="px-2 py-2">Transition</th>
                    <th className="px-2 py-2">Rate</th>
                    <th className="px-2 py-2">Transitioned users</th>
                    <th className="px-2 py-2">From users</th>
                    <th className="px-2 py-2">To users</th>
                    <th className="px-2 py-2">Baseline rate</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.transitions.map((transition) => (
                    <tr key={transition.id} className="border-b border-black/5 dark:border-white/5">
                      <td className="px-2 py-2">{transition.label}</td>
                      <td className="px-2 py-2">{formatRate(transition.rate)}</td>
                      <td className="px-2 py-2">{transition.transitionedUsers}</td>
                      <td className="px-2 py-2">{transition.fromUsers}</td>
                      <td className="px-2 py-2">{transition.toUsers}</td>
                      <td className="px-2 py-2">{formatRate(transition.baselineRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
            <p className="text-sm font-semibold">Event totals (read-only)</p>
            <p className="text-xs text-black/60 dark:text-white/60">
              Raw unique-user and event counts for range/baseline sanity checks.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10">
                    <th className="px-2 py-2">Event</th>
                    <th className="px-2 py-2">Users</th>
                    <th className="px-2 py-2">Events</th>
                    <th className="px-2 py-2">Baseline users</th>
                    <th className="px-2 py-2">Baseline events</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.events.map((event) => (
                    <tr key={event.event} className="border-b border-black/5 dark:border-white/5">
                      <td className="px-2 py-2 font-mono text-[11px]">{event.event}</td>
                      <td className="px-2 py-2">{event.users}</td>
                      <td className="px-2 py-2">{event.events}</td>
                      <td className="px-2 py-2">{event.baselineUsers ?? '--'}</td>
                      <td className="px-2 py-2">{event.baselineEvents ?? '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
            <p className="text-sm font-semibold">Export-friendly summary (read-only)</p>
            <p className="text-xs text-black/60 dark:text-white/60">
              Copy this CSV block for weekly reporting or external analysis.
            </p>
            <textarea
              readOnly
              value={exportSummary}
              rows={12}
              className="mt-3 w-full rounded-xl border border-black/15 bg-white p-3 text-xs text-black dark:border-white/20 dark:bg-black dark:text-white"
            />
          </div>
        </div>
      ) : null}
    </Card>
  );
}
