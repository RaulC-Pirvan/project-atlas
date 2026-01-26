import { isSameUtcDate } from './dates';

export type CompletionDecision = {
  action: 'create' | 'delete' | 'noop';
  date: Date;
};

export function hasCompletion(existingDates: Date[], targetDate: Date): boolean {
  return existingDates.some((date) => isSameUtcDate(date, targetDate));
}

export function planCompletionChange(
  existingDates: Date[],
  targetDate: Date,
  desiredCompleted: boolean,
): CompletionDecision {
  const exists = hasCompletion(existingDates, targetDate);

  if (desiredCompleted) {
    return { action: exists ? 'noop' : 'create', date: targetDate };
  }

  return { action: exists ? 'delete' : 'noop', date: targetDate };
}
