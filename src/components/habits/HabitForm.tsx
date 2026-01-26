'use client';

import { useState } from 'react';

import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { Notice } from '../ui/Notice';
import { normalizeWeekdays, type WeekStart } from './weekdays';
import { WeekdaySelector } from './WeekdaySelector';

export type HabitFormValues = {
  title: string;
  description?: string;
  weekdays: number[];
};

type HabitFormProps = {
  mode: 'create' | 'edit';
  weekStart: WeekStart;
  initialValues?: HabitFormValues;
  onSubmit: (payload: HabitFormValues) => Promise<void>;
  onCancel?: () => void;
  resetOnSubmit?: boolean;
};

const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

export function HabitForm({
  mode,
  weekStart,
  initialValues,
  onSubmit,
  onCancel,
  resetOnSubmit = false,
}: HabitFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [weekdays, setWeekdays] = useState(
    initialValues?.weekdays ? normalizeWeekdays(initialValues.weekdays) : DEFAULT_WEEKDAYS,
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const normalizedTitle = title.trim();
    const normalizedWeekdays = normalizeWeekdays(weekdays);

    if (!normalizedTitle) {
      setError('Title is required.');
      return;
    }

    if (normalizedWeekdays.length === 0) {
      setError('Select at least one weekday.');
      return;
    }

    const normalizedDescription = description.trim();
    const payload: HabitFormValues = {
      title: normalizedTitle,
      description: normalizedDescription ? normalizedDescription : undefined,
      weekdays: normalizedWeekdays,
    };

    setSubmitting(true);

    try {
      await onSubmit(payload);
      if (resetOnSubmit) {
        setTitle('');
        setDescription('');
        setWeekdays(DEFAULT_WEEKDAYS);
      }
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/80">
          {mode === 'create' ? 'Create habit' : 'Edit habit'}
        </p>
        <p className="text-sm text-black/60">
          {mode === 'create'
            ? 'Build a new habit with a weekly schedule.'
            : 'Update the habit details and schedule.'}
        </p>
      </div>

      {error ? <Notice tone="error">{error}</Notice> : null}

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

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" variant="primary" className="flex-1" disabled={submitting}>
          {submitting
            ? mode === 'create'
              ? 'Creating...'
              : 'Saving...'
            : mode === 'create'
              ? 'Create habit'
              : 'Save changes'}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
