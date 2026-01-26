export type HabitScheduleEntry = {
  weekday: number;
};

export type HabitForDay = {
  id: string;
  archivedAt?: Date | null;
  schedule: HabitScheduleEntry[];
};

export type HabitCompletion = {
  habitId: string;
  date: Date;
  completedAt?: Date;
};
