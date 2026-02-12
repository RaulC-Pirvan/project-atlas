import { MAX_TIME_MINUTES, MIN_TIME_MINUTES } from './constants';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTimeMinutes(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_TIME_MINUTES && value <= MAX_TIME_MINUTES;
}

export function minutesToTimeString(minutes: number): string {
  if (!isValidTimeMinutes(minutes)) {
    throw new RangeError('Time minutes must be between 0 and 1439.');
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function timeStringToMinutes(value: string): number | null {
  const match = TIME_REGEX.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  const total = hours * 60 + minutes;
  return isValidTimeMinutes(total) ? total : null;
}
