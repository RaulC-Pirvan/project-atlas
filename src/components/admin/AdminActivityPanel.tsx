'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Notice } from '../ui/Notice';

type AdminLogEntry = {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  requestId?: string;
  method?: string;
  path?: string;
  route?: string;
  status?: number;
  durationMs?: number;
  errorCode?: string;
};

type ActivityResponse = {
  ok: boolean;
  data: {
    entries: AdminLogEntry[];
  };
};

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US');
}

function getEventLabel(message: string): string {
  if (message === 'api.request') return 'API request';
  if (message === 'api.error') return 'API error';
  return message;
}

function formatRequestSummary(entry: AdminLogEntry): string {
  const parts: string[] = [];
  if (entry.method) parts.push(entry.method);
  if (entry.route ?? entry.path) parts.push(entry.route ?? entry.path ?? '');
  if (entry.status !== undefined) parts.push(String(entry.status));
  if (entry.durationMs !== undefined) parts.push(`${entry.durationMs}ms`);
  return parts.filter((part) => part.length > 0).join(' | ');
}

export function AdminActivityPanel() {
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<AdminLogEntry[]>([]);

  const loadActivity = useCallback(async () => {
    setState('loading');
    setError(null);

    try {
      const response = await fetch('/api/admin/activity?limit=50', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Unable to load activity feed.');
      }
      const body = (await response.json()) as ActivityResponse;
      if (!body.ok) {
        throw new Error('Unable to load activity feed.');
      }
      setEntries(body.data.entries);
      setState('ready');
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Unable to load activity.';
      setError(message);
      setState('error');
    }
  }, []);

  useEffect(() => {
    void loadActivity();
  }, [loadActivity]);

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Latest events</p>
          <p className="text-xs text-black/50 dark:text-white/50">Last 50 log entries.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={loadActivity}>
          Refresh feed
        </Button>
      </div>

      {state === 'loading' ? <Notice>Loading activity...</Notice> : null}
      {state === 'error' ? <Notice tone="error">{error}</Notice> : null}

      {state === 'ready' && entries.length === 0 ? (
        <Notice>No log entries captured yet.</Notice>
      ) : null}

      {entries.length > 0 ? (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-2xl border border-black/10 px-4 py-3 text-sm dark:border-white/10"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
                  {getEventLabel(entry.message)}
                </div>
                <div className="text-xs text-black/50 dark:text-white/50">
                  {formatTimestamp(entry.timestamp)}
                </div>
              </div>
              <p className="mt-2 text-sm font-semibold">
                {formatRequestSummary(entry) || entry.message}
              </p>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-black/60 dark:text-white/60">
                {entry.level ? <span>Level: {entry.level}</span> : null}
                {entry.status !== undefined ? <span>Status: {entry.status}</span> : null}
                {entry.durationMs !== undefined ? (
                  <span>Duration: {entry.durationMs}ms</span>
                ) : null}
                {entry.errorCode ? <span>Code: {entry.errorCode}</span> : null}
                {entry.requestId ? <span>Request: {entry.requestId}</span> : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
