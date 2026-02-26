'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Notice } from '../ui/Notice';

type HealthSnapshot = {
  status: string;
  timestamp: string;
  uptimeSeconds: number;
};

type HealthState =
  | { status: 'idle'; data: null; error: null }
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: HealthSnapshot; error: null }
  | { status: 'error'; data: null; error: string };

function formatUptime(seconds: number): string {
  if (!Number.isFinite(seconds)) return 'Unknown';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export function AdminHealthPanel() {
  const [state, setState] = useState<HealthState>({ status: 'idle', data: null, error: null });

  const loadHealth = useCallback(async () => {
    setState({ status: 'loading', data: null, error: null });
    try {
      const response = await fetch('/api/admin/health', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Unable to load health status.');
      }
      const body = (await response.json()) as { ok: boolean; data: HealthSnapshot };
      if (!body.ok) {
        throw new Error('Health check failed.');
      }
      setState({ status: 'ready', data: body.data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load health status.';
      setState({ status: 'error', data: null, error: message });
    }
  }, []);

  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

  const badgeLabel =
    state.status === 'loading'
      ? 'Loading'
      : state.status === 'ready'
        ? state.data.status
        : state.status === 'error'
          ? 'Error'
          : 'Pending';

  const showSkeleton = state.status === 'idle' || state.status === 'loading';

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">Current status</p>
        <span className="rounded-full border border-black/15 px-3 py-1 text-xs uppercase tracking-[0.3em] text-black/60 dark:border-white/20 dark:text-white/60">
          {badgeLabel}
        </span>
      </div>
      {showSkeleton ? (
        <div className="grid gap-4 sm:grid-cols-3" role="status" aria-label="Loading health status">
          <div className="space-y-2">
            <div className="h-3 w-16 rounded-full bg-black/10 motion-safe:animate-pulse motion-reduce:animate-none dark:bg-white/10" />
            <div className="h-7 w-24 rounded-full bg-black/10 motion-safe:animate-pulse motion-reduce:animate-none dark:bg-white/10" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-20 rounded-full bg-black/10 motion-safe:animate-pulse motion-reduce:animate-none dark:bg-white/10" />
            <div className="h-5 w-40 rounded-full bg-black/10 motion-safe:animate-pulse motion-reduce:animate-none dark:bg-white/10" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-14 rounded-full bg-black/10 motion-safe:animate-pulse motion-reduce:animate-none dark:bg-white/10" />
            <div className="h-5 w-32 rounded-full bg-black/10 motion-safe:animate-pulse motion-reduce:animate-none dark:bg-white/10" />
          </div>
        </div>
      ) : null}
      {state.status === 'ready' ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-black/40 dark:text-white/40">
              Uptime
            </p>
            <p className="text-lg font-semibold">{formatUptime(state.data.uptimeSeconds)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-black/40 dark:text-white/40">
              Last check
            </p>
            <p className="text-sm text-black/70 dark:text-white/70">
              {new Date(state.data.timestamp).toLocaleString('en-US')}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-black/40 dark:text-white/40">
              Source
            </p>
            <p className="text-sm text-black/70 dark:text-white/70">/api/admin/health</p>
          </div>
        </div>
      ) : null}
      {state.status === 'error' ? <Notice tone="error">{state.error}</Notice> : null}
      <div>
        <Button type="button" variant="outline" size="sm" onClick={loadHealth}>
          Refresh health
        </Button>
      </div>
    </Card>
  );
}
