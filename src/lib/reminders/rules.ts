import { MAX_SNOOZE_DAILY_MINUTES, MAX_SNOOZE_MINUTES } from './constants';
import { isValidTimeMinutes } from './time';

export function isQuietHoursRangeValid(startMinutes: number, endMinutes: number): boolean {
  return (
    isValidTimeMinutes(startMinutes) &&
    isValidTimeMinutes(endMinutes) &&
    startMinutes !== endMinutes
  );
}

export function isTimeWithinQuietHours(
  timeMinutes: number,
  startMinutes: number,
  endMinutes: number,
): boolean {
  if (!isValidTimeMinutes(timeMinutes)) return false;
  if (!isValidTimeMinutes(startMinutes) || !isValidTimeMinutes(endMinutes)) return false;
  if (startMinutes === endMinutes) return false;

  if (startMinutes < endMinutes) {
    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
  }

  return timeMinutes >= startMinutes || timeMinutes < endMinutes;
}

export function getAllowedSnoozeMinutes(
  requestedMinutes: number,
  totalSnoozedMinutes: number,
): number {
  if (!Number.isFinite(requestedMinutes) || !Number.isFinite(totalSnoozedMinutes)) {
    return 0;
  }

  if (requestedMinutes <= 0) return 0;

  const boundedRequest = Math.min(requestedMinutes, MAX_SNOOZE_MINUTES);
  const remaining = Math.max(MAX_SNOOZE_DAILY_MINUTES - Math.max(totalSnoozedMinutes, 0), 0);

  return Math.min(boundedRequest, remaining);
}
