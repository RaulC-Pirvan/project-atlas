type HabitLike = {
  id: string;
};

export function orderHabitsByCompletion<T extends HabitLike>(
  habits: T[],
  completedIds: Set<string>,
  keepCompletedAtBottom: boolean,
): T[] {
  if (!keepCompletedAtBottom) return habits;

  const pending: T[] = [];
  const completed: T[] = [];

  for (const habit of habits) {
    if (completedIds.has(habit.id)) {
      completed.push(habit);
    } else {
      pending.push(habit);
    }
  }

  return [...pending, ...completed];
}