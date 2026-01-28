'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { getApiErrorMessage, parseJson } from '../../lib/api/client';
import { type ToastItem, ToastStack } from '../ui/Toast';

type HabitSummary = {
  id: string;
  title: string;
  description: string | null;
};

type CompletionResult = {
  status: 'created' | 'deleted' | 'noop';
  habitId: string;
  date: string;
};

type CompletionResponse = {
  result: CompletionResult;
};

type DailyCompletionPanelProps = {
  selectedDateKey: string | null;
  selectedLabel: string | null;
  clearHref: string;
  habits: HabitSummary[];
  initialCompletedHabitIds: string[];
  isFuture: boolean;
};

export function DailyCompletionPanel({
  selectedDateKey,
  selectedLabel,
  clearHref,
  habits,
  initialCompletedHabitIds,
  isFuture,
}: DailyCompletionPanelProps) {
  const [completedIds, setCompletedIds] = useState<string[]>(initialCompletedHabitIds);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef(0);
  const completionSignature = initialCompletedHabitIds.join('|');

  useEffect(() => {
    setCompletedIds(initialCompletedHabitIds);
    setPendingIds([]);
  }, [selectedDateKey, completionSignature]);

  const pushToast = (message: string, tone: ToastItem['tone'] = 'neutral') => {
    const id = toastIdRef.current + 1;
    toastIdRef.current = id;
    setToasts((prev) => [...prev, { id, tone, message, state: 'entering' }]);

    window.requestAnimationFrame(() => {
      setToasts((prev) =>
        prev.map((toast) => (toast.id === id ? { ...toast, state: 'open' } : toast)),
      );
    });

    window.setTimeout(() => {
      setToasts((prev) =>
        prev.map((toast) => (toast.id === id ? { ...toast, state: 'closing' } : toast)),
      );
    }, 4500);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4800);
  };

  const handleToggle = async (habitId: string) => {
    if (!selectedDateKey) return;
    if (isFuture) {
      pushToast('Future dates cannot be completed yet.', 'error');
      return;
    }

    const alreadyCompleted = completedIds.includes(habitId);
    setPendingIds((prev) => [...prev, habitId]);

    try {
      const response = await fetch('/api/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habitId,
          date: selectedDateKey,
          completed: !alreadyCompleted,
        }),
      });
      const body = await parseJson<CompletionResponse>(response);

      if (!response.ok || !body?.ok) {
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }

      const result = body.data.result;
      if (result.status === 'created') {
        setCompletedIds((prev) => (prev.includes(habitId) ? prev : [...prev, habitId]));
      } else if (result.status === 'deleted') {
        setCompletedIds((prev) => prev.filter((id) => id !== habitId));
      }
    } catch {
      pushToast('Unable to update completion.', 'error');
    } finally {
      setPendingIds((prev) => prev.filter((id) => id !== habitId));
    }
  };

  const renderContent = () => {
    if (!selectedDateKey) {
      return <p>Select a day to see scheduled habits.</p>;
    }

    if (habits.length === 0) {
      return <p>No habits scheduled for this day.</p>;
    }

    return (
      <ul className="space-y-3">
        {habits.map((habit) => {
          const isCompleted = completedIds.includes(habit.id);
          const isPending = pendingIds.includes(habit.id);
          const isDisabled = isFuture || isPending;

          return (
            <li key={habit.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={isCompleted}
                disabled={isDisabled}
                onClick={() => handleToggle(habit.id)}
                className={`flex w-full items-start justify-between gap-4 rounded-xl border px-4 py-3 text-left transition ${
                  isCompleted ? 'border-black bg-black text-white' : 'border-black/10 text-black'
                } ${isDisabled ? 'opacity-60' : 'hover:bg-black/5'} `.trim()}
              >
                <div>
                  <p
                    className={`text-sm font-semibold ${isCompleted ? 'text-white' : 'text-black'}`}
                  >
                    {habit.title}
                  </p>
                  {habit.description ? (
                    <p className={`text-xs ${isCompleted ? 'text-white/80' : 'text-black/60'}`}>
                      {habit.description}
                    </p>
                  ) : null}
                </div>
                <span
                  aria-hidden="true"
                  className={`mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                    isCompleted ? 'border-white bg-white text-black' : 'border-black/20'
                  }`}
                >
                  {isCompleted ? <span className="h-2 w-2 rounded-full bg-black" /> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="rounded-2xl border border-black/10 px-6 py-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60">
            Selected day
          </p>
          <h3 className="text-lg font-semibold">{selectedLabel ?? 'Pick a day'}</h3>
        </div>
        {selectedDateKey ? (
          <Link
            href={clearHref}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60"
          >
            Clear
          </Link>
        ) : null}
      </div>

      <div className="mt-5 space-y-3 text-sm text-black/70">
        {isFuture && selectedDateKey ? (
          <p className="text-xs uppercase tracking-[0.25em] text-black/50">
            Future dates cannot be completed yet.
          </p>
        ) : null}
        {renderContent()}
      </div>

      <ToastStack toasts={toasts} />
    </div>
  );
}
