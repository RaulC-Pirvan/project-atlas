export type AchievementTier = 'free' | 'pro';

export type AchievementMetric =
  | 'totalCompletions'
  | 'scheduledDays'
  | 'perfectWeeks'
  | 'distinctHabits'
  | 'longestStreak'
  | 'maxHabitCompletions';

export type AchievementDefinition = {
  id: string;
  title: string;
  description: string;
  tier: AchievementTier;
  metric: AchievementMetric;
  target: number;
};

export type AchievementProgress = {
  current: number;
  target: number;
  ratio: number;
};

export type AchievementStatus = AchievementDefinition & {
  unlocked: boolean;
  progress: AchievementProgress;
};

export type HabitMilestoneType = 'completions' | 'perfectWeeks';

export type MilestoneDefinition = {
  id: string;
  label: string;
  type: HabitMilestoneType;
  target: number;
  tier: AchievementTier;
};

export type HabitMilestone = MilestoneDefinition & {
  current: number;
  unlocked: boolean;
};

export type HabitMilestoneTimeline = {
  habitId: string;
  title: string;
  completionCount: number;
  milestones: HabitMilestone[];
};

export type AchievementHabit = {
  id: string;
  title: string;
  archivedAt?: Date | null;
  createdAt: Date;
  schedule: { weekday: number }[];
};

export type AchievementCompletion = {
  habitId: string;
  date: Date;
};

export type AchievementsSummary = {
  generatedAt: Date;
  achievements: AchievementStatus[];
  milestones: HabitMilestoneTimeline[];
  stats: {
    totalCompletions: number;
    scheduledDays: number;
    distinctHabits: number;
    perfectWeeks: number;
    longestStreak: number;
    maxHabitCompletions: number;
  };
};
