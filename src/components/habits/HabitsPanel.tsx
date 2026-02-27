'use client';

import { useRef, useState } from 'react';

import { getApiErrorMessage, parseJson } from '../../lib/api/client';
import { minutesToTimeString } from '../../lib/reminders/time';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { type ToastItem, ToastStack } from '../ui/Toast';
import { HabitForm, type HabitFormValues } from './HabitForm';
import { formatWeekdayLabels, normalizeWeekdays, type WeekStart } from './weekdays';

type HabitSummary = {
  id: string;
  title: string;
  description: string | null;
  archivedAt: string | Date | null;
  weekdays: number[];
  reminderTimes: number[];
};

type HabitsResponse = {
  habits: HabitSummary[];
};

type HabitResponse = {
  habit: HabitSummary;
};

type ReorderResponse = {
  habitIds: string[];
};

type HabitsPanelProps = {
  initialHabits: HabitSummary[];
  weekStart: WeekStart;
  timezoneLabel?: string;
};

export function HabitsPanel({ initialHabits, weekStart, timezoneLabel }: HabitsPanelProps) {
  const [habits, setHabits] = useState<HabitSummary[]>(initialHabits);
  const [loading, setLoading] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HabitSummary | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef(0);

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

  const refreshHabits = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/habits');
      const body = await parseJson<HabitsResponse>(response);
      if (!response.ok || !body?.ok) {
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }
      setHabits(body.data.habits);
    } catch {
      pushToast('Unable to load habits.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (payload: HabitFormValues) => {
    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          weekdays: payload.weekdays,
          reminderTimes: payload.reminderTimes,
        }),
      });
      const body = await parseJson<HabitResponse>(response);
      if (!response.ok || !body?.ok) {
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }
      setHabits((prev) => [...prev, body.data.habit]);
      pushToast('Habit created.', 'success');
    } catch {
      pushToast('Unable to create habit.', 'error');
    }
  };

  const handleUpdate = async (habitId: string, payload: HabitFormValues) => {
    try {
      const response = await fetch(`/api/habits/${habitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          weekdays: payload.weekdays,
          reminderTimes: payload.reminderTimes,
        }),
      });
      const body = await parseJson<HabitResponse>(response);
      if (!response.ok || !body?.ok) {
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }
      setHabits((prev) => prev.map((habit) => (habit.id === habitId ? body.data.habit : habit)));
      setEditingId(null);
      pushToast('Habit updated.', 'success');
    } catch {
      pushToast('Unable to update habit.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const response = await fetch(`/api/habits/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const body = await parseJson<{ habitId: string }>(response);
      if (!response.ok || !body?.ok) {
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }
      setHabits((prev) => prev.filter((habit) => habit.id !== deleteTarget.id));
      setDeleteTarget(null);
      pushToast('Habit deleted.', 'success');
    } catch {
      pushToast('Unable to delete habit.', 'error');
    }
  };

  const persistOrder = async (nextHabits: HabitSummary[], previousHabits: HabitSummary[]) => {
    setHabits(nextHabits);
    setReordering(true);
    try {
      const response = await fetch('/api/habits/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitIds: nextHabits.map((habit) => habit.id) }),
      });
      const body = await parseJson<ReorderResponse>(response);
      if (!response.ok || !body?.ok) {
        setHabits(previousHabits);
        pushToast(getApiErrorMessage(response, body), 'error');
      }
    } catch {
      setHabits(previousHabits);
      pushToast('Unable to update habit order.', 'error');
    } finally {
      setReordering(false);
    }
  };

  const moveHabit = (habitId: string, direction: number) => {
    const index = habits.findIndex((habit) => habit.id === habitId);
    if (index === -1) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= habits.length) return;
    const nextHabits = [...habits];
    const [removed] = nextHabits.splice(index, 1);
    nextHabits.splice(nextIndex, 0, removed);
    void persistOrder(nextHabits, habits);
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      <HabitForm
        mode="create"
        weekStart={weekStart}
        timezoneLabel={timezoneLabel}
        onSubmit={handleCreate}
        resetOnSubmit
      />

      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/80 dark:text-white/80">
              Habits
            </p>
            <p className="text-sm text-black/60 dark:text-white/60">
              {loading ? 'Loading habits...' : `${habits.length} active habit(s).`}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={refreshHabits}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>

        {habits.length === 0 && !loading ? (
          <div className="border-y border-black/10 py-6 text-sm text-black/60 dark:border-white/10 dark:text-white/60 sm:rounded-2xl sm:border sm:px-6 sm:py-8">
            No habits yet. Create your first habit above.
          </div>
        ) : null}

        <div className="space-y-2 sm:space-y-4">
          {habits.map((habit, index) => (
            <div
              key={habit.id}
              className="border-y border-black/10 px-0 py-4 dark:border-white/10 sm:rounded-2xl sm:border sm:px-6 sm:py-6"
              data-habit-id={habit.id}
              data-habit-title={habit.title}
            >
              {editingId === habit.id ? (
                <HabitForm
                  mode="edit"
                  weekStart={weekStart}
                  initialValues={{
                    title: habit.title,
                    description: habit.description ?? '',
                    weekdays: normalizeWeekdays(habit.weekdays),
                    reminderTimes: habit.reminderTimes ?? [],
                  }}
                  timezoneLabel={timezoneLabel}
                  onSubmit={(payload) => handleUpdate(habit.id, payload)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-lg font-semibold">{habit.title}</p>
                      {habit.description ? (
                        <p className="text-sm text-black/60 dark:text-white/60">
                          {habit.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                      {habits.length > 1 ? (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={() => moveHabit(habit.id, -1)}
                            disabled={reordering || loading || index === 0}
                            aria-label={`Move ${habit.title} up`}
                          >
                            Up
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={() => moveHabit(habit.id, 1)}
                            disabled={reordering || loading || index === habits.length - 1}
                            aria-label={`Move ${habit.title} down`}
                          >
                            Down
                          </Button>
                        </>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => setEditingId(habit.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => setDeleteTarget(habit)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formatWeekdayLabels(habit.weekdays, weekStart).map((label) => (
                      <span
                        key={label}
                        className="rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs font-medium text-black/70 dark:border-white/10 dark:bg-white/10 dark:text-white/70"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  {habit.reminderTimes?.length ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40 dark:text-white/40">
                        Reminders
                      </span>
                      {habit.reminderTimes.map((time) => (
                        <span
                          key={`${habit.id}-${time}`}
                          className="rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs font-medium text-black/70 dark:border-white/10 dark:bg-white/10 dark:text-white/70"
                        >
                          {minutesToTimeString(time)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={!!deleteTarget}
        title="Delete habit"
        eyebrow="Habits"
        footer={
          <>
            <Button type="button" variant="outline" size="lg" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" size="lg" onClick={handleDelete}>
              Delete habit
            </Button>
          </>
        }
      >
        <p>
          {deleteTarget
            ? `Delete "${deleteTarget.title}"? This removes the habit but keeps historical completions.`
            : 'Delete this habit?'}
        </p>
      </Modal>

      <ToastStack toasts={toasts} />
    </div>
  );
}
