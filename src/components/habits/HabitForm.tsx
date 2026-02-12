'use client';

import { useRef, useState } from 'react';

import { MAX_REMINDERS_PER_HABIT } from '../../lib/reminders/constants';
import { minutesToTimeString, timeStringToMinutes } from '../../lib/reminders/time';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { type ToastItem, ToastStack } from '../ui/Toast';
import { normalizeWeekdays, type WeekStart } from './weekdays';
import { WeekdaySelector } from './WeekdaySelector';

export type HabitFormValues = {
  title: string;
  description?: string;
  weekdays: number[];
  reminderTimes: number[];
};

type HabitFormProps = {
  mode: 'create' | 'edit';
  weekStart: WeekStart;
  initialValues?: HabitFormValues;
  onSubmit: (payload: HabitFormValues) => Promise<void>;
  onCancel?: () => void;
  resetOnSubmit?: boolean;
  timezoneLabel?: string;
};

const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];
const DEFAULT_REMINDER_TIME = '09:00';

export function HabitForm({
  mode,
  weekStart,
  initialValues,
  onSubmit,
  onCancel,
  resetOnSubmit = false,
  timezoneLabel,
}: HabitFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [weekdays, setWeekdays] = useState(
    initialValues?.weekdays ? normalizeWeekdays(initialValues.weekdays) : DEFAULT_WEEKDAYS,
  );
  const [reminderTimes, setReminderTimes] = useState<string[]>(
    initialValues?.reminderTimes?.length
      ? initialValues.reminderTimes.map((time) => minutesToTimeString(time))
      : [],
  );
  const [submitting, setSubmitting] = useState(false);
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedTitle = title.trim();
    const normalizedWeekdays = normalizeWeekdays(weekdays);

    if (!normalizedTitle) {
      pushToast('Title is required.', 'error');
      return;
    }

    if (normalizedWeekdays.length === 0) {
      pushToast('Select at least one weekday.', 'error');
      return;
    }

    const parsedReminderTimes: number[] = [];
    const seenTimes = new Set<number>();
    for (const timeValue of reminderTimes) {
      const minutes = timeStringToMinutes(timeValue);
      if (minutes === null) {
        pushToast('Reminder time must be in HH:MM format.', 'error');
        return;
      }
      if (seenTimes.has(minutes)) {
        pushToast('Reminder times must be unique.', 'error');
        return;
      }
      seenTimes.add(minutes);
      parsedReminderTimes.push(minutes);
    }

    if (parsedReminderTimes.length > MAX_REMINDERS_PER_HABIT) {
      pushToast(`Up to ${MAX_REMINDERS_PER_HABIT} reminders per habit.`, 'error');
      return;
    }

    parsedReminderTimes.sort((a, b) => a - b);

    const normalizedDescription = description.trim();
    const payload: HabitFormValues = {
      title: normalizedTitle,
      description: normalizedDescription ? normalizedDescription : undefined,
      weekdays: normalizedWeekdays,
      reminderTimes: parsedReminderTimes,
    };

    setSubmitting(true);

    try {
      await onSubmit(payload);
      if (resetOnSubmit) {
        setTitle('');
        setDescription('');
        setWeekdays(DEFAULT_WEEKDAYS);
        setReminderTimes([]);
      }
    } catch {
      pushToast('Something went wrong. Try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/80 dark:text-white/80">
          {mode === 'create' ? 'Create habit' : 'Edit habit'}
        </p>
        <p className="text-sm text-black/60 dark:text-white/60">
          {mode === 'create'
            ? 'Build a new habit with a weekly schedule.'
            : 'Update the habit details and schedule.'}
        </p>
      </div>

      <FormField id={`${mode}-habit-title`} label="Title" error={null}>
        <Input
          id={`${mode}-habit-title`}
          name="title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </FormField>

      <FormField id={`${mode}-habit-description`} label="Description" hint="Optional." error={null}>
        <Input
          id={`${mode}-habit-description`}
          name="description"
          type="text"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </FormField>

      <FormField id={`${mode}-habit-weekdays`} label="Active weekdays" error={null}>
        <WeekdaySelector value={weekdays} weekStart={weekStart} onChange={setWeekdays} />
      </FormField>

      <FormField
        id={`${mode}-habit-reminders`}
        label="Reminder times"
        hint={`Use 24-hour time (HH:MM). Optional. Up to ${MAX_REMINDERS_PER_HABIT}.${
          timezoneLabel ? ` Times use ${timezoneLabel}.` : ''
        }`}
        error={null}
      >
        <div className="space-y-3">
          {reminderTimes.length === 0 ? (
            <p className="text-sm text-black/60 dark:text-white/60">No reminder times set yet.</p>
          ) : null}
          {reminderTimes.map((timeValue, index) => (
            <div key={`${mode}-reminder-${index}`} className="flex items-center gap-2">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-2][0-9]:[0-5][0-9]"
                placeholder="HH:MM"
                value={timeValue}
                onChange={(event) => {
                  const next = [...reminderTimes];
                  next[index] = event.target.value;
                  setReminderTimes(next);
                }}
                className="max-w-[160px]"
                aria-label={`Reminder time ${index + 1}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReminderTimes((prev) => prev.filter((_, i) => i !== index));
                }}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (reminderTimes.length >= MAX_REMINDERS_PER_HABIT) {
                pushToast(`Up to ${MAX_REMINDERS_PER_HABIT} reminders per habit.`, 'error');
                return;
              }
              setReminderTimes((prev) => [...prev, DEFAULT_REMINDER_TIME]);
            }}
            disabled={reminderTimes.length >= MAX_REMINDERS_PER_HABIT}
          >
            Add time
          </Button>
        </div>
      </FormField>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="submit"
          variant="primary"
          className="flex-1 min-h-[48px] sm:min-h-0"
          disabled={submitting}
        >
          {submitting
            ? mode === 'create'
              ? 'Creating...'
              : 'Saving...'
            : mode === 'create'
              ? 'Create habit'
              : 'Save changes'}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            className="flex-1 min-h-[48px] sm:min-h-0"
            onClick={onCancel}
          >
            Cancel
          </Button>
        ) : null}
      </div>

      <ToastStack toasts={toasts} />
    </form>
  );
}
