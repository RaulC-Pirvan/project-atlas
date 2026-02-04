import { addUtcDays, normalizeToUtcDate } from '../../habits/dates';
import { buildInsightsSummary } from '../../insights/summary';
import type { InsightCompletion, InsightHabit, InsightsSummary } from '../../insights/types';

type HabitRecord = InsightHabit;
type CompletionRecord = InsightCompletion;

type InsightsClient = {
  habit: {
    findMany: (args: {
      where: { userId: string };
      select: { id: true; archivedAt: true; createdAt: true; schedule: { select: { weekday: true } } };
    }) => Promise<HabitRecord[]>;
  };
  habitCompletion: {
    findMany: (args: {
      where: { date: { gte: Date; lte: Date }; habit: { userId: string } };
      select: { habitId: true; date: true };
    }) => Promise<CompletionRecord[]>;
  };
};

type GetInsightsSummaryArgs = {
  prisma: InsightsClient;
  userId: string;
  timeZone: string;
  now?: Date;
};

export async function getInsightsSummary({
  prisma,
  userId,
  timeZone,
  now = new Date(),
}: GetInsightsSummaryArgs): Promise<InsightsSummary> {
  const today = normalizeToUtcDate(now, timeZone);
  const start = addUtcDays(today, -89);

  const [habits, completions] = await Promise.all([
    prisma.habit.findMany({
      where: { userId },
      select: { id: true, archivedAt: true, createdAt: true, schedule: { select: { weekday: true } } },
    }),
    prisma.habitCompletion.findMany({
      where: { date: { gte: start, lte: today }, habit: { userId } },
      select: { habitId: true, date: true },
    }),
  ]);

  return buildInsightsSummary({ habits, completions, timeZone, now });
}
