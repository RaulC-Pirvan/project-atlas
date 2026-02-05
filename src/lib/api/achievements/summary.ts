import { buildAchievementsSummary } from '../../achievements/summary';
import type {
  AchievementCompletion,
  AchievementHabit,
  AchievementsSummary,
} from '../../achievements/types';
import { normalizeToUtcDate } from '../../habits/dates';

type HabitRecord = AchievementHabit;

type CompletionRecord = AchievementCompletion;

type AchievementsClient = {
  habit: {
    findMany: (args: {
      where: { userId: string };
      select: {
        id: true;
        title: true;
        archivedAt: true;
        createdAt: true;
        schedule: { select: { weekday: true } };
      };
    }) => Promise<HabitRecord[]>;
  };
  habitCompletion: {
    findMany: (args: {
      where: { date?: { lte: Date }; habit: { userId: string } };
      select: { habitId: true; date: true };
    }) => Promise<CompletionRecord[]>;
  };
  achievementUnlock: {
    findMany: (args: {
      where: { userId: string };
      select: { achievementId: true };
    }) => Promise<{ achievementId: string }[]>;
    createMany: (args: {
      data: { userId: string; achievementId: string; unlockedAt: Date }[];
      skipDuplicates: boolean;
    }) => Promise<{ count: number }>;
  };
  habitMilestoneUnlock: {
    findMany: (args: {
      where: { userId: string };
      select: { habitId: true; milestoneId: true };
    }) => Promise<{ habitId: string; milestoneId: string }[]>;
    createMany: (args: {
      data: { userId: string; habitId: string; milestoneId: string; unlockedAt: Date }[];
      skipDuplicates: boolean;
    }) => Promise<{ count: number }>;
  };
};

type GetAchievementsSummaryArgs = {
  prisma: AchievementsClient;
  userId: string;
  timeZone: string;
  now?: Date;
};

export async function getAchievementsSummary({
  prisma,
  userId,
  timeZone,
  now = new Date(),
}: GetAchievementsSummaryArgs): Promise<AchievementsSummary> {
  const today = normalizeToUtcDate(now, timeZone);

  const [habits, completions, achievementUnlocks, milestoneUnlocks] = await Promise.all([
    prisma.habit.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        archivedAt: true,
        createdAt: true,
        schedule: { select: { weekday: true } },
      },
    }),
    prisma.habitCompletion.findMany({
      where: { date: { lte: today }, habit: { userId } },
      select: { habitId: true, date: true },
    }),
    prisma.achievementUnlock.findMany({
      where: { userId },
      select: { achievementId: true },
    }),
    prisma.habitMilestoneUnlock.findMany({
      where: { userId },
      select: { habitId: true, milestoneId: true },
    }),
  ]);

  const rawSummary = buildAchievementsSummary({ habits, completions, timeZone, now });

  const storedAchievementIds = new Set(achievementUnlocks.map((unlock) => unlock.achievementId));
  const storedMilestoneIds = new Set(
    milestoneUnlocks.map((unlock) => `${unlock.habitId}:${unlock.milestoneId}`),
  );

  const computedAchievementIds = rawSummary.achievements
    .filter((achievement) => achievement.unlocked)
    .map((achievement) => achievement.id);
  const computedMilestoneIds = rawSummary.milestones.flatMap((timeline) =>
    timeline.milestones
      .filter((milestone) => milestone.unlocked)
      .map((milestone) => `${timeline.habitId}:${milestone.id}`),
  );

  const nowStamp = new Date();
  const newAchievementUnlocks = computedAchievementIds.filter(
    (id) => !storedAchievementIds.has(id),
  );
  const newMilestoneUnlocks = computedMilestoneIds.filter((key) => !storedMilestoneIds.has(key));

  if (newAchievementUnlocks.length > 0) {
    await prisma.achievementUnlock.createMany({
      data: newAchievementUnlocks.map((achievementId) => ({
        userId,
        achievementId,
        unlockedAt: nowStamp,
      })),
      skipDuplicates: true,
    });
    newAchievementUnlocks.forEach((id) => storedAchievementIds.add(id));
  }

  if (newMilestoneUnlocks.length > 0) {
    await prisma.habitMilestoneUnlock.createMany({
      data: newMilestoneUnlocks.map((key) => {
        const [habitId, milestoneId] = key.split(':');
        return { userId, habitId, milestoneId, unlockedAt: nowStamp };
      }),
      skipDuplicates: true,
    });
    newMilestoneUnlocks.forEach((key) => storedMilestoneIds.add(key));
  }

  return {
    ...rawSummary,
    achievements: rawSummary.achievements.map((achievement) => {
      const isUnlocked = achievement.unlocked || storedAchievementIds.has(achievement.id);
      const target = achievement.progress.target;
      const current = isUnlocked ? target : achievement.progress.current;
      const ratio = isUnlocked ? 1 : achievement.progress.ratio;
      return {
        ...achievement,
        unlocked: isUnlocked,
        progress: { ...achievement.progress, current, ratio },
      };
    }),
    milestones: rawSummary.milestones.map((timeline) => ({
      ...timeline,
      milestones: timeline.milestones.map((milestone) => {
        const key = `${timeline.habitId}:${milestone.id}`;
        const isUnlocked = milestone.unlocked || storedMilestoneIds.has(key);
        const target = milestone.target;
        const current = isUnlocked ? target : milestone.current;
        return {
          ...milestone,
          unlocked: isUnlocked,
          current,
        };
      }),
    })),
  };
}
