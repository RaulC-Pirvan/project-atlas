'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Notice } from '../ui/Notice';

type AdminHabitSummary = {
  title: string;
  description: string | null;
  archivedAt: string | null;
  createdAt: string;
  scheduleSummary: string;
  weekdays: number[];
  user: {
    email: string;
    displayName: string;
  };
};

type AdminHabitCounts = {
  total: number;
  active: number;
  archived: number;
};

type AdminHabitResponse = {
  ok: boolean;
  data: {
    habits: AdminHabitSummary[];
    counts: AdminHabitCounts;
    nextCursor: string | null;
  };
};

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

type HabitStatus = 'active' | 'archived' | 'all';

function formatDate(value: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-US');
}

export function AdminHabitsPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [status, setStatus] = useState<HabitStatus>('active');
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [habits, setHabits] = useState<AdminHabitSummary[]>([]);
  const [counts, setCounts] = useState<AdminHabitCounts>({ total: 0, active: 0, archived: 0 });
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadHabits = useCallback(
    async (options: {
      search: string;
      statusValue: HabitStatus;
      cursor?: string | null;
      append?: boolean;
    }) => {
      const { search, statusValue, cursor, append } = options;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setState('loading');
        setError(null);
      }

      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (cursor) params.set('cursor', cursor);
        params.set('status', statusValue);

        const response = await fetch(`/api/admin/habits?${params.toString()}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Unable to load habits.');
        }

        const body = (await response.json()) as AdminHabitResponse;
        if (!body.ok) {
          throw new Error('Unable to load habits.');
        }

        setCounts(body.data.counts);
        setNextCursor(body.data.nextCursor);
        setHabits((prev) => (append ? [...prev, ...body.data.habits] : body.data.habits));
        setState('ready');
        setError(null);
      } catch (fetchError) {
        const message = fetchError instanceof Error ? fetchError.message : 'Unable to load habits.';
        if (!append) {
          setState('error');
        }
        setError(message);
      } finally {
        if (append) setIsLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadHabits({ search: appliedSearch, statusValue: status, append: false });
  }, [appliedSearch, loadHabits, status]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = searchTerm.trim();
    setAppliedSearch(normalized);
  };

  const handleStatusChange = (nextStatus: HabitStatus) => {
    setStatus(nextStatus);
  };

  const handleLoadMore = () => {
    if (!nextCursor || isLoadingMore) return;
    void loadHabits({
      search: appliedSearch,
      statusValue: status,
      cursor: nextCursor,
      append: true,
    });
  };

  return (
    <Card className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Habit inventory</p>
          <p className="text-xs text-black/50 dark:text-white/50">
            {counts.total} total / {counts.active} active / {counts.archived} archived
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex w-full gap-2 sm:w-auto">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search habits or owner"
            aria-label="Search habits"
            className="h-9 w-full sm:w-64"
          />
          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['active', 'archived', 'all'] as HabitStatus[]).map((option) => (
          <Button
            key={option}
            type="button"
            variant={status === option ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleStatusChange(option)}
          >
            {option}
          </Button>
        ))}
      </div>

      {state === 'loading' ? <Notice>Loading habits...</Notice> : null}
      {state === 'error' ? <Notice tone="error">{error}</Notice> : null}

      {state === 'ready' && habits.length === 0 ? (
        <Notice>No habits match this filter.</Notice>
      ) : null}

      {habits.length > 0 ? (
        <div className="space-y-4">
          {habits.map((habit) => (
            <div
              key={`${habit.title}-${habit.createdAt}`}
              className="rounded-2xl border border-black/10 px-4 py-3 text-sm dark:border-white/10"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {habit.title}
                    {habit.archivedAt ? (
                      <span className="ml-2 text-xs uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
                        Archived
                      </span>
                    ) : null}
                  </p>
                  {habit.description ? (
                    <p className="text-xs text-black/60 dark:text-white/60">{habit.description}</p>
                  ) : null}
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
                  {habit.scheduleSummary}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-black/60 dark:text-white/60">
                <span>
                  Owner: {habit.user.displayName} ({habit.user.email})
                </span>
                <span>Created: {formatDate(habit.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {nextCursor ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
