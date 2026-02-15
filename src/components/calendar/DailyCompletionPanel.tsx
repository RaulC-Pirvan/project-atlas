'use client';

import { useRouter } from 'next/navigation';
import type { KeyboardEvent } from 'react';
import {
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { getApiErrorMessage, parseJson } from '../../lib/api/client';
import {
  getOfflineCompletionQueue,
  type OfflineQueueValidation,
} from '../../lib/habits/offlineQueue';
import { useOfflineCompletionSnapshot } from '../../lib/habits/offlineQueueClient';
import {
  registerOfflineCompletionSync,
  requestOfflineCompletionSync,
} from '../../lib/habits/offlineSync';
import { orderHabitsByCompletion } from '../../lib/habits/ordering';
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

type CompletionWindowLockReason = 'future' | 'grace_expired' | 'history_blocked';

const GRACE_WINDOW_COPY = 'You can complete today and yesterday until 2:00 AM local time.';

function getCompletionWindowLockMessage(reason: CompletionWindowLockReason): string {
  switch (reason) {
    case 'future':
      return 'Future dates cannot be completed yet.';
    case 'grace_expired':
      return 'Yesterday can only be completed until 2:00 AM.';
    case 'history_blocked':
      return 'Past dates cannot be completed.';
    default:
      return 'Past dates cannot be completed.';
  }
}

function getOfflineValidationMessage(validation: OfflineQueueValidation): string {
  if (validation.ok) return '';
  switch (validation.reason) {
    case 'invalid_date':
      return 'Unable to queue this completion.';
    case 'future':
      return 'Future dates cannot be completed yet.';
    case 'grace_expired':
      return 'Yesterday can only be completed until 2:00 AM.';
    case 'history_blocked':
      return 'Past dates cannot be completed.';
    default:
      return 'Unable to queue this completion.';
  }
}

type DailyCompletionPanelProps = {
  selectedDateKey: string | null;
  selectedLabel: string | null;
  habits: HabitSummary[];
  initialCompletedHabitIds: string[];
  completionWindowLockReason: CompletionWindowLockReason | null;
  timeZone: string;
  contextLabel?: string;
  keepCompletedAtBottom?: boolean;
};

type HabitRowProps = {
  habit: HabitSummary;
  isCompleted: boolean;
  isPending: boolean;
  isSyncing: boolean;
  isLocked: boolean;
  listId: string;
  onToggle: (habitId: string, wasCompleted: boolean) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
};

const HabitRow = memo(function HabitRow({
  habit,
  isCompleted,
  isPending,
  isSyncing,
  isLocked,
  listId,
  onToggle,
  onKeyDown,
}: HabitRowProps) {
  const isDisabled = isLocked || isSyncing;
  const descriptionId = habit.description ? `${listId}-${habit.id}` : undefined;
  const focusClasses = isCompleted
    ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black dark:focus-visible:ring-black/40 dark:focus-visible:ring-offset-white'
    : 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-white/30 dark:focus-visible:ring-offset-black';
  const hoverClasses = isCompleted
    ? 'hover:bg-black/90 active:bg-black/80 sm:active:scale-[0.99] dark:hover:bg-white/90 dark:active:bg-white/80'
    : 'hover:bg-black/5 active:bg-black/10 sm:active:scale-[0.99] dark:hover:bg-white/10 dark:active:bg-white/20';

  return (
    <li data-habit-row data-habit-id={habit.id}>
      <button
        type="button"
        role="checkbox"
        aria-checked={isCompleted}
        aria-describedby={descriptionId}
        data-habit-id={habit.id}
        data-pending={isPending ? 'true' : undefined}
        data-syncing={isSyncing ? 'true' : undefined}
        disabled={isDisabled}
        onClick={() => onToggle(habit.id, isCompleted)}
        onKeyDown={onKeyDown}
        className={`flex min-h-[44px] w-full items-start justify-between gap-4 rounded-xl border px-4 py-3 text-left touch-manipulation motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-out motion-reduce:transition-none ${focusClasses} ${
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
          className={`inline-flex h-5 w-5 items-center justify-center self-center rounded-full border ${
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
        {isPending ? <span className="sr-only">Pending sync</span> : null}
      </button>
    </li>
  );
});

HabitRow.displayName = 'HabitRow';

export function DailyCompletionPanel({
  selectedDateKey,
  selectedLabel,
  habits,
  initialCompletedHabitIds,
  completionWindowLockReason,
  timeZone,
  contextLabel,
  keepCompletedAtBottom = true,
}: DailyCompletionPanelProps) {
  const router = useRouter();
  const [completedIds, setCompletedIds] = useState<string[]>(initialCompletedHabitIds);
  const [syncingIds, setSyncingIds] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });
  const offlineSnapshot = useOfflineCompletionSnapshot();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [achievementToasts, setAchievementToasts] = useState<AchievementToastItem[]>([]);
  const toastIdRef = useRef(0);
  const achievementToastIdRef = useRef(0);
  const achievementsSnapshotRef = useRef<AchievementsSnapshot | null>(null);
  const achievementsLoadingRef = useRef<Promise<AchievementsSnapshot | null> | null>(null);
  const completedCountRef = useRef(initialCompletedHabitIds.length);
  const habitsCountRef = useRef(habits.length);
  const listRef = useRef<HTMLUListElement | null>(null);
  const positionsRef = useRef<Map<string, DOMRect>>(new Map());
  const hasMountedRef = useRef(false);
  const completionSignature = initialCompletedHabitIds.join('|');
  const listId = useId();
  const resolvedContextLabel = contextLabel ?? 'Selected day';
  const isLocked = completionWindowLockReason !== null;
  const completionSet = useMemo(() => new Set(completedIds), [completedIds]);
  const syncingSet = useMemo(() => new Set(syncingIds), [syncingIds]);
  const offlinePendingSet = useMemo(() => {
    if (!selectedDateKey) return new Set<string>();
    return offlineSnapshot.pendingByDate.get(selectedDateKey) ?? new Set<string>();
  }, [offlineSnapshot.pendingByDate, selectedDateKey]);
  const pendingSet = useMemo(() => {
    const merged = new Set<string>(offlinePendingSet);
    for (const id of syncingSet) {
      merged.add(id);
    }
    return merged;
  }, [offlinePendingSet, syncingSet]);
  const orderedHabits = useMemo(
    () => orderHabitsByCompletion(habits, completionSet, keepCompletedAtBottom),
    [habits, completionSet, keepCompletedAtBottom],
  );

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (typeof window === 'undefined') return;

    const prefersReducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const items = Array.from(list.querySelectorAll<HTMLElement>('[data-habit-row]'));
    const prevPositions = positionsRef.current;
    const nextPositions = new Map<string, DOMRect>();

    for (const item of items) {
      const habitId = item.dataset.habitId;
      if (!habitId) continue;
      nextPositions.set(habitId, item.getBoundingClientRect());
    }

    positionsRef.current = nextPositions;

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (prefersReducedMotion) return;

    for (const item of items) {
      const habitId = item.dataset.habitId;
      if (!habitId) continue;
      const previous = prevPositions.get(habitId);
      const next = nextPositions.get(habitId);
      if (!previous || !next) continue;
      const deltaY = previous.top - next.top;
      if (Math.abs(deltaY) < 1) continue;
      item.animate([{ transform: `translateY(${deltaY}px)` }, { transform: 'translateY(0)' }], {
        duration: 180,
        easing: 'cubic-bezier(0.2, 0.6, 0.2, 1)',
      });
    }
  }, [orderedHabits]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  useEffect(() => {
    setCompletedIds(initialCompletedHabitIds);
    setSyncingIds([]);
  }, [selectedDateKey, completionSignature]);

  useEffect(() => {
    completedCountRef.current = completedIds.length;
  }, [completedIds]);

  useEffect(() => {
    habitsCountRef.current = habits.length;
  }, [habits.length]);

  const pushToast = useCallback(
    (message: string, tone: ToastItem['tone'] = 'neutral') => {
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
    },
    [setToasts],
  );

  useEffect(() => {
    const unsubscribe = registerOfflineCompletionSync({
      onDrop: (event) => {
        pushToast(event.message, 'error');
      },
    });
    return () => {
      unsubscribe();
    };
  }, [pushToast]);

  const pushAchievementToast = useCallback(
    (toast: Omit<AchievementToastItem, 'id' | 'state'>) => {
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
    },
    [setAchievementToasts],
  );

  const dismissAchievementToast = useCallback(
    (id: number) => {
      setAchievementToasts((prev) =>
        prev.map((toast) =>
          toast.id === id && toast.state !== 'closing' ? { ...toast, state: 'closing' } : toast,
        ),
      );

      window.setTimeout(() => {
        setAchievementToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 220);
    },
    [setAchievementToasts],
  );

  const buildAchievementsSnapshot = useCallback(
    (data: AchievementsResponse): AchievementsSnapshot => ({
      isPro: data.isPro,
      achievements: data.achievements,
      byId: new Map(data.achievements.map((achievement) => [achievement.id, achievement])),
    }),
    [],
  );

  const loadAchievementsSnapshot = useCallback(async (): Promise<AchievementsSnapshot | null> => {
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
  }, [buildAchievementsSnapshot]);

  const ensureAchievementsSnapshot = useCallback(async (): Promise<AchievementsSnapshot | null> => {
    if (achievementsSnapshotRef.current) return achievementsSnapshotRef.current;
    if (!achievementsLoadingRef.current) {
      achievementsLoadingRef.current = (async () => {
        const snapshot = await loadAchievementsSnapshot();
        achievementsLoadingRef.current = null;
        return snapshot;
      })();
    }
    return achievementsLoadingRef.current;
  }, [loadAchievementsSnapshot]);

  useEffect(() => {
    void ensureAchievementsSnapshot();
  }, [ensureAchievementsSnapshot]);

  const playDing = useCallback((tone: 'habit' | 'day') => {
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
  }, []);

  const playAchievementDing = useCallback(() => {
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
  }, []);

  const refreshAchievements = useCallback(
    async (emitToasts: boolean): Promise<boolean> => {
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
    },
    [loadAchievementsSnapshot, playAchievementDing, pushAchievementToast],
  );

  const setCompletionState = useCallback((habitId: string, completed: boolean) => {
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
  }, []);

  const handleToggle = useCallback(
    async (habitId: string, wasCompleted: boolean) => {
      if (!selectedDateKey) return;
      if (completionWindowLockReason) {
        pushToast(getCompletionWindowLockMessage(completionWindowLockReason), 'error');
        return;
      }

      const alreadyCompleted = wasCompleted;
      const nextCompleted = !alreadyCompleted;
      setCompletionState(habitId, nextCompleted);

      const queue = getOfflineCompletionQueue();
      const enqueueOffline = async () => {
        try {
          const result = await queue.enqueue(
            { habitId, dateKey: selectedDateKey, completed: nextCompleted },
            { timeZone },
          );
          if (!result.ok) {
            setCompletionState(habitId, alreadyCompleted);
            pushToast(getOfflineValidationMessage(result), 'error');
            return false;
          }
          pushToast('Saved offline. Will sync when back online.');
          requestOfflineCompletionSync();
          return true;
        } catch {
          setCompletionState(habitId, alreadyCompleted);
          pushToast('Unable to save offline.', 'error');
          return false;
        }
      };

      if (!isOnline) {
        await enqueueOffline();
        return;
      }

      setSyncingIds((prev) => [...prev, habitId]);

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
            const totalHabits = habitsCountRef.current;
            const currentCompletedCount = completedCountRef.current;
            const nextCompletedCount = Math.min(totalHabits, currentCompletedCount + 1);
            if (nextCompletedCount >= totalHabits && totalHabits > 0) {
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
        await enqueueOffline();
      } finally {
        setSyncingIds((prev) => prev.filter((id) => id !== habitId));
      }
    },
    [
      selectedDateKey,
      completionWindowLockReason,
      pushToast,
      ensureAchievementsSnapshot,
      setCompletionState,
      router,
      refreshAchievements,
      playDing,
      isOnline,
      timeZone,
    ],
  );

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
        aria-busy={syncingIds.length > 0}
        aria-label="Daily habits"
        data-habit-list
        id={listId}
        ref={listRef}
      >
        {orderedHabits.map((habit) => (
          <HabitRow
            key={habit.id}
            habit={habit}
            isCompleted={completionSet.has(habit.id)}
            isPending={pendingSet.has(habit.id)}
            isSyncing={syncingSet.has(habit.id)}
            isLocked={isLocked}
            listId={listId}
            onToggle={handleToggle}
            onKeyDown={handleHabitKeyDown}
          />
        ))}
      </ul>
    );
  };

  return (
    <div className="rounded-2xl border border-black/10 px-6 py-6 dark:border-white/10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60 dark:text-white/60">
            {resolvedContextLabel}
          </p>
          <h3 className="text-lg font-semibold">{selectedLabel ?? 'Pick a day'}</h3>
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm text-black/70 dark:text-white/70">
        {selectedDateKey ? (
          <p className="text-xs text-black/60 dark:text-white/60">{GRACE_WINDOW_COPY}</p>
        ) : null}
        {completionWindowLockReason && selectedDateKey ? (
          <p className="text-xs uppercase tracking-[0.25em] text-black/50 dark:text-white/50">
            {getCompletionWindowLockMessage(completionWindowLockReason)}
          </p>
        ) : null}
        {renderContent()}
      </div>

      <ToastStack toasts={toasts} />
      <AchievementToastStack toasts={achievementToasts} onDismiss={dismissAchievementToast} />
    </div>
  );
}
