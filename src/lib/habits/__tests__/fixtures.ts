export function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

export function completionDates(...dates: Date[]): Date[] {
  return dates;
}

export function schedule(...weekdays: number[]): { weekday: number }[] {
  return weekdays.map((weekday) => ({ weekday }));
}
