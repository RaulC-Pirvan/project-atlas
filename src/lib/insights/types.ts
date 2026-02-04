export type InsightHabit = {
  id: string;
  archivedAt?: Date | null;
  createdAt: Date;
  schedule: { weekday: number }[];
};

export type InsightCompletion = {
  habitId: string;
  date: Date;
};

export type ConsistencyScore = {
  windowDays: number;
  scheduled: number;
  completed: number;
  rate: number;
};

export type WeekdayStat = {
  weekday: number;
  label: string;
  scheduled: number;
  completed: number;
  rate: number;
};

export type TrendDirection = 'up' | 'down' | 'flat';

export type TrendSummary = {
  windowDays: number;
  currentRate: number;
  previousRate: number;
  delta: number;
  direction: TrendDirection;
};

export type HeatmapGrid = {
  weeks: number;
  weekdays: number;
  values: number[][];
};

export type InsightsSummary = {
  generatedAt: Date;
  consistency: ConsistencyScore[];
  weekdayStats: {
    best: WeekdayStat | null;
    worst: WeekdayStat | null;
    stats: WeekdayStat[];
  };
  trend: TrendSummary;
  heatmap: HeatmapGrid;
};
