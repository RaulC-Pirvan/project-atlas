'use client';

import { useRouter } from 'next/navigation';
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
  habits: HabitSummary[];
  initialCompletedHabitIds: string[];
  isFuture: boolean;
};

export function DailyCompletionPanel({
  selectedDateKey,
  selectedLabel,
  habits,
  initialCompletedHabitIds,
  isFuture,
}: DailyCompletionPanelProps) {
  const router = useRouter();
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

  const playDing = (tone: 'habit' | 'day') => {
    if (typeof window === 'undefined') return;
    type WebkitWindow = typeof window & { webkitAudioContext?: typeof AudioContext };
    const AudioContextCtor = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
    if (!AudioContextCtor) return;

    const context = new AudioContextCtor();
    const now = context.currentTime;

    const createTone = (frequency: number, duration: number, gainPeak: number, start: number) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(gainPeak, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + duration);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    };

    if (tone === 'habit') {
      createTone(760, 0.12, 0.09, now);
    } else {
      createTone(520, 0.18, 0.1, now);
      createTone(780, 0.2, 0.09, now + 0.06);
    }

    window.setTimeout(() => {
      void context.close();
    }, 350);
  };

  const setCompletionState = (habitId: string, completed: boolean) => {
    setCompletedIds((prev) => {
      const hasHabit = prev.includes(habitId);
      if (completed) {
        return hasHabit ? prev : [...prev, habitId];
      }
      if (!hasHabit) {
        return prev;
      }
      return prev.filter((id) => id !== habitId);
    });
  };

  const handleToggle = async (habitId: string) => {
    if (!selectedDateKey) return;
    if (isFuture) {
      pushToast('Future dates cannot be completed yet.', 'error');
      return;
    }

    const alreadyCompleted = completedIds.includes(habitId);
    setPendingIds((prev) => [...prev, habitId]);
    setCompletionState(habitId, !alreadyCompleted);

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
        setCompletionState(habitId, alreadyCompleted);
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }

      const result = body.data.result;
      if (result.status === 'created') {
        setCompletionState(habitId, true);
        router.refresh();
        const nextCompletedIds = alreadyCompleted ? completedIds : [...completedIds, habitId];
        if (nextCompletedIds.length >= habits.length && habits.length > 0) {
          playDing('day');
        } else {
          playDing('habit');
        }
      } else if (result.status === 'deleted') {
        setCompletionState(habitId, false);
        router.refresh();
      }
    } catch {
      setCompletionState(habitId, alreadyCompleted);
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
      <ul className="space-y-3" aria-busy={pendingIds.length > 0}>
        {habits.map((habit) => {
          const isCompleted = completedIds.includes(habit.id);
          const isPending = pendingIds.includes(habit.id);
          const isDisabled = isFuture || isPending;
          const focusClasses = isCompleted
            ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black'
            : 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white';
          const hoverClasses = isCompleted
            ? 'hover:bg-black/90 active:bg-black/80 active:scale-[0.99]'
            : 'hover:bg-black/5 active:bg-black/10 active:scale-[0.99]';

          return (
            <li key={habit.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={isCompleted}
                disabled={isDisabled}
                onClick={() => handleToggle(habit.id)}
                className={`flex min-h-[44px] w-full items-start justify-between gap-4 rounded-xl border px-4 py-3 text-left touch-manipulation motion-safe:transition-all motion-safe:duration-150 motion-safe:ease-out motion-reduce:transition-none ${focusClasses} ${
                  isCompleted ? 'border-black bg-black text-white' : 'border-black/10 text-black'
                } ${isDisabled ? 'opacity-60' : hoverClasses} `.trim()}
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
                  {isPending ? (
                    <span
                      className={`h-3 w-3 rounded-full border motion-safe:animate-spin motion-reduce:animate-none ${
                        isCompleted
                          ? 'border-black/40 border-t-transparent'
                          : 'border-black/30 border-t-transparent'
                      }`}
                    />
                  ) : isCompleted ? (
                    <span className="h-2 w-2 rounded-full bg-black" />
                  ) : null}
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
