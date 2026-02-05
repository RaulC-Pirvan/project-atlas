'use client';

import { useRouter } from 'next/navigation';
import type { KeyboardEvent } from 'react';
import { useEffect, useId, useRef, useState } from 'react';

import { getApiErrorMessage, parseJson } from '../../lib/api/client';
import { type AchievementToastItem, AchievementToastStack } from '../achievements/AchievementToast';
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

type AchievementProgress = {
  current: number;
  target: number;
  ratio: number;
};

type AchievementSnapshotItem = {
  id: string;
  title: string;
  description: string;
  tier: 'free' | 'pro';
  unlocked: boolean;
  progress: AchievementProgress;
};

type AchievementsResponse = {
  isPro: boolean;
  achievements: AchievementSnapshotItem[];
};

type AchievementsSnapshot = {
  isPro: boolean;
  achievements: AchievementSnapshotItem[];
  byId: Map<string, AchievementSnapshotItem>;
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
  const [achievementToasts, setAchievementToasts] = useState<AchievementToastItem[]>([]);
  const toastIdRef = useRef(0);
  const achievementToastIdRef = useRef(0);
  const achievementsSnapshotRef = useRef<AchievementsSnapshot | null>(null);
  const achievementsLoadingRef = useRef<Promise<AchievementsSnapshot | null> | null>(null);
  const completionSignature = initialCompletedHabitIds.join('|');
  const listId = useId();

  useEffect(() => {
    setCompletedIds(initialCompletedHabitIds);
    setPendingIds([]);
  }, [selectedDateKey, completionSignature]);

  useEffect(() => {
    void ensureAchievementsSnapshot();
  }, []);

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

  const pushAchievementToast = (toast: Omit<AchievementToastItem, 'id' | 'state'>) => {
    const id = achievementToastIdRef.current + 1;
    achievementToastIdRef.current = id;
    setAchievementToasts((prev) => [...prev, { ...toast, id, state: 'entering' }]);

    window.requestAnimationFrame(() => {
      setAchievementToasts((prev) =>
        prev.map((item) => (item.id === id ? { ...item, state: 'open' } : item)),
      );
    });

    window.setTimeout(() => {
      setAchievementToasts((prev) =>
        prev.map((item) => (item.id === id ? { ...item, state: 'closing' } : item)),
      );
    }, 4500);

    window.setTimeout(() => {
      setAchievementToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4800);
  };

  const buildAchievementsSnapshot = (data: AchievementsResponse): AchievementsSnapshot => ({
    isPro: data.isPro,
    achievements: data.achievements,
    byId: new Map(data.achievements.map((achievement) => [achievement.id, achievement])),
  });

  const loadAchievementsSnapshot = async (): Promise<AchievementsSnapshot | null> => {
    try {
      const response = await fetch('/api/achievements');
      const body = await parseJson<AchievementsResponse>(response);
      if (!response.ok || !body?.ok) {
        return null;
      }
      const snapshot = buildAchievementsSnapshot(body.data);
      achievementsSnapshotRef.current = snapshot;
      return snapshot;
    } catch {
      return null;
    }
  };

  const ensureAchievementsSnapshot = async (): Promise<AchievementsSnapshot | null> => {
    if (achievementsSnapshotRef.current) return achievementsSnapshotRef.current;
    if (!achievementsLoadingRef.current) {
      achievementsLoadingRef.current = (async () => {
        const snapshot = await loadAchievementsSnapshot();
        achievementsLoadingRef.current = null;
        return snapshot;
      })();
    }
    return achievementsLoadingRef.current;
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

  const playAchievementDing = () => {
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

    createTone(820, 0.14, 0.09, now);
    createTone(1060, 0.2, 0.07, now + 0.04);

    window.setTimeout(() => {
      void context.close();
    }, 350);
  };

  const refreshAchievements = async (emitToasts: boolean): Promise<boolean> => {
    const previous = achievementsSnapshotRef.current;
    const next = await loadAchievementsSnapshot();
    if (!next) return false;

    if (!emitToasts || !previous) return false;

    const shouldPlayDing = next.achievements.some((achievement) => {
      const prev = previous.byId.get(achievement.id);
      if (!prev) return false;
      if (!next.isPro && achievement.tier === 'pro') return false;
      return !prev.unlocked && achievement.unlocked;
    });

    const progressCandidates: Array<{
      achievement: AchievementSnapshotItem;
      prev: AchievementSnapshotItem;
    }> = [];

    for (const achievement of next.achievements) {
      const prev = previous.byId.get(achievement.id);
      if (!prev) continue;
      if (!next.isPro && achievement.tier === 'pro') continue;

      if (!prev.unlocked && achievement.unlocked) {
        pushAchievementToast({
          kind: 'unlock',
          title: achievement.title,
          description: achievement.description,
          current: achievement.progress.current,
          target: achievement.progress.target,
          ratio: achievement.progress.ratio,
          tier: achievement.tier,
        });
        continue;
      }

      if (achievement.progress.current > prev.progress.current && !achievement.unlocked) {
        progressCandidates.push({ achievement, prev });
      }
    }

    if (progressCandidates.length > 0) {
      const selected = [...progressCandidates].sort((a, b) => {
        const ratioA = a.achievement.progress.ratio;
        const ratioB = b.achievement.progress.ratio;
        if (ratioB !== ratioA) return ratioB - ratioA;
        const remainingA = a.achievement.progress.target - a.achievement.progress.current;
        const remainingB = b.achievement.progress.target - b.achievement.progress.current;
        if (remainingA !== remainingB) return remainingA - remainingB;
        return a.achievement.progress.target - b.achievement.progress.target;
      })[0];

      if (selected) {
        const fromCurrent = selected.prev.progress.current;
        const fromRatio =
          selected.achievement.progress.target > 0
            ? Math.min(1, fromCurrent / selected.achievement.progress.target)
            : 0;

        pushAchievementToast({
          kind: 'progress',
          title: selected.achievement.title,
          description: selected.achievement.description,
          current: selected.achievement.progress.current,
          target: selected.achievement.progress.target,
          ratio: selected.achievement.progress.ratio,
          tier: selected.achievement.tier,
          fromCurrent,
          fromRatio,
        });
      }
    }

    if (shouldPlayDing) {
      playAchievementDing();
    }

    return shouldPlayDing;
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
      await ensureAchievementsSnapshot();
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
        const unlocked = await refreshAchievements(true);
        if (!unlocked) {
          const nextCompletedIds = alreadyCompleted ? completedIds : [...completedIds, habitId];
          if (nextCompletedIds.length >= habits.length && habits.length > 0) {
            playDing('day');
          } else {
            playDing('habit');
          }
        }
      } else if (result.status === 'deleted') {
        setCompletionState(habitId, false);
        router.refresh();
        await refreshAchievements(false);
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

    const handleHabitKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      const { key } = event;
      if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) return;

      const list = event.currentTarget.closest<HTMLElement>('[data-habit-list]');
      if (!list) return;

      const buttons = Array.from(
        list.querySelectorAll<HTMLButtonElement>('button[data-habit-id]'),
      ).filter((button) => !button.disabled);
      if (buttons.length === 0) return;

      const currentIndex = buttons.findIndex((button) => button === event.currentTarget);
      if (currentIndex === -1) return;

      event.preventDefault();

      if (key === 'Home') {
        buttons[0]?.focus();
        return;
      }
      if (key === 'End') {
        buttons[buttons.length - 1]?.focus();
        return;
      }

      const nextIndex =
        key === 'ArrowUp'
          ? Math.max(0, currentIndex - 1)
          : Math.min(buttons.length - 1, currentIndex + 1);

      buttons[nextIndex]?.focus();
    };

    return (
      <ul
        className="space-y-3"
        aria-busy={pendingIds.length > 0}
        aria-label="Daily habits"
        data-habit-list
        id={listId}
      >
        {habits.map((habit) => {
          const isCompleted = completedIds.includes(habit.id);
          const isPending = pendingIds.includes(habit.id);
          const isDisabled = isFuture || isPending;
          const descriptionId = habit.description ? `${listId}-${habit.id}` : undefined;
          const focusClasses = isCompleted
            ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black dark:focus-visible:ring-black/40 dark:focus-visible:ring-offset-white'
            : 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-white/30 dark:focus-visible:ring-offset-black';
          const hoverClasses = isCompleted
            ? 'hover:bg-black/90 active:bg-black/80 active:scale-[0.99] dark:hover:bg-white/90 dark:active:bg-white/80'
            : 'hover:bg-black/5 active:bg-black/10 active:scale-[0.99] dark:hover:bg-white/10 dark:active:bg-white/20';

          return (
            <li key={habit.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={isCompleted}
                aria-describedby={descriptionId}
                data-habit-id={habit.id}
                disabled={isDisabled}
                onClick={() => handleToggle(habit.id)}
                onKeyDown={handleHabitKeyDown}
                className={`flex min-h-[44px] w-full items-start justify-between gap-4 rounded-xl border px-4 py-3 text-left touch-manipulation motion-safe:transition-all motion-safe:duration-150 motion-safe:ease-out motion-reduce:transition-none ${focusClasses} ${
                  isCompleted
                    ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                    : 'border-black/10 text-black dark:border-white/10 dark:text-white'
                } ${isDisabled ? 'opacity-60' : hoverClasses} `.trim()}
              >
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      isCompleted ? 'text-white dark:text-black' : 'text-black dark:text-white'
                    }`}
                  >
                    {habit.title}
                  </p>
                  {habit.description ? (
                    <p
                      id={descriptionId}
                      className={`text-xs ${
                        isCompleted
                          ? 'text-white/80 dark:text-black/70'
                          : 'text-black/60 dark:text-white/60'
                      }`}
                    >
                      {habit.description}
                    </p>
                  ) : null}
                </div>
                <span
                  aria-hidden="true"
                  className={`mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                    isCompleted
                      ? 'border-white bg-white text-black dark:border-black/30 dark:bg-black/10 dark:text-black'
                      : 'border-black/20 dark:border-white/20'
                  }`}
                >
                  {isPending ? (
                    <span
                      className={`h-3 w-3 rounded-full border motion-safe:animate-spin motion-reduce:animate-none ${
                        isCompleted
                          ? 'border-black/40 border-t-transparent dark:border-black/50'
                          : 'border-black/30 border-t-transparent dark:border-white/40'
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
    <div className="rounded-2xl border border-black/10 px-6 py-6 dark:border-white/10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60 dark:text-white/60">
            Selected day
          </p>
          <h3 className="text-lg font-semibold">{selectedLabel ?? 'Pick a day'}</h3>
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm text-black/70 dark:text-white/70">
        {isFuture && selectedDateKey ? (
          <p className="text-xs uppercase tracking-[0.25em] text-black/50 dark:text-white/50">
            Future dates cannot be completed yet.
          </p>
        ) : null}
        {renderContent()}
      </div>

      <ToastStack toasts={toasts} />
      <AchievementToastStack toasts={achievementToasts} />
    </div>
  );
}
