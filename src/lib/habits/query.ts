import { isHabitActiveOnDate } from './schedule';
import type { HabitForDay } from './types';

export function habitsForDate(habits: HabitForDay[], date: Date, timeZone: string): HabitForDay[] {
  return habits.filter((habit) => {
    if (habit.archivedAt) return false;
    return isHabitActiveOnDate(habit.schedule, date, timeZone);
  });
}
