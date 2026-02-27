'use client';

import { useMemo, useState } from 'react';

import type {
  AchievementsSummary,
  AchievementStatus,
  HabitMilestone,
} from '../../lib/achievements/types';
import { Notice } from '../ui/Notice';

type AchievementsDashboardProps = {
  summary: AchievementsSummary;
  isPro: boolean;
};

type AchievementFilter = 'all' | 'unlocked' | 'in-progress' | 'pro';
type DashboardTab = 'achievements' | 'milestones';

function formatProgress({ current, target }: { current: number; target: number }) {
  return `${current} / ${target}`;
}

function AchievementCard({
  achievement,
  isPro,
}: {
  achievement: AchievementStatus;
  isPro: boolean;
}) {
  const isProLocked = achievement.tier === 'pro' && !isPro;
  const isUnlocked = achievement.unlocked && !isProLocked;
  const status = isProLocked ? 'pro-locked' : isUnlocked ? 'unlocked' : 'locked';
  const badgeLabel = isProLocked ? 'Pro' : isUnlocked ? 'Unlocked' : 'In progress';
  const ratio = achievement.progress.ratio;

  return (
    <div
      className="flex h-full min-h-[10.5rem] flex-col rounded-2xl border border-black/10 px-5 py-4 dark:border-white/10"
      data-testid={`achievement-${achievement.id}`}
      data-status={status}
    >
      <div className="min-h-[3.75rem] space-y-1">
        <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] items-start gap-3">
          <p className="text-sm font-semibold text-black dark:text-white">{achievement.title}</p>
          <span className="text-right text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
            {badgeLabel}
          </span>
        </div>
        <p className="line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-black/60 dark:text-white/60">
          {achievement.description}
        </p>
      </div>

      <div className="mt-auto space-y-2 pt-4">
        <div className="flex items-center justify-between text-xs text-black/50 dark:text-white/50">
          <span>{formatProgress(achievement.progress)}</span>
          <span>{Math.round(ratio * 100)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-black/10 dark:bg-white/10">
          <div
            className={`h-1.5 rounded-full ${
              isUnlocked ? 'bg-[var(--color-accent-solid)]' : 'bg-black/40 dark:bg-white/60'
            }`}
            style={{ width: `${Math.round(ratio * 100)}%` }}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}

function MilestoneCard({ milestone, isPro }: { milestone: HabitMilestone; isPro: boolean }) {
  const isProLocked = milestone.tier === 'pro' && !isPro;
  const isUnlocked = milestone.unlocked && !isProLocked;
  const status = isProLocked ? 'Pro' : isUnlocked ? 'Unlocked' : 'In progress';
  const ratio = milestone.target > 0 ? Math.min(1, milestone.current / milestone.target) : 0;

  return (
    <div
      className="rounded-xl border border-black/10 px-4 py-3 text-sm text-black/70 dark:border-white/10 dark:text-white/70"
      data-status={isUnlocked ? 'unlocked' : 'locked'}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
            {milestone.label}
          </p>
          <p className="text-xs text-black/50 dark:text-white/50">
            {formatProgress({ current: milestone.current, target: milestone.target })}
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
          {status}
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-black/10 dark:bg-white/10">
        <div
          className={`h-1.5 rounded-full ${
            isUnlocked ? 'bg-[var(--color-accent-solid)]' : 'bg-black/40 dark:bg-white/60'
          }`}
          style={{ width: `${Math.round(ratio * 100)}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export function AchievementsDashboard({ summary, isPro }: AchievementsDashboardProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<AchievementFilter>('all');
  const [tab, setTab] = useState<DashboardTab>('achievements');

  const normalizedQuery = query.trim().toLowerCase();

  const filteredAchievements = useMemo(() => {
    return summary.achievements.filter((achievement) => {
      if (filter === 'unlocked' && !achievement.unlocked) return false;
      if (filter === 'in-progress' && achievement.unlocked) return false;
      if (filter === 'pro' && achievement.tier !== 'pro') return false;
      if (!normalizedQuery) return true;
      const haystack = `${achievement.title} ${achievement.description}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [filter, normalizedQuery, summary.achievements]);

  const nextUp = useMemo(() => {
    const candidates = summary.achievements.filter((achievement) => {
      if (achievement.unlocked) return false;
      if (!isPro && achievement.tier === 'pro') return false;
      return true;
    });

    const ordered = [...candidates].sort((a, b) => {
      if (b.progress.ratio !== a.progress.ratio) {
        return b.progress.ratio - a.progress.ratio;
      }
      const remainingA = a.progress.target - a.progress.current;
      const remainingB = b.progress.target - b.progress.current;
      if (remainingA !== remainingB) return remainingA - remainingB;
      return a.progress.target - b.progress.target;
    });

    return ordered.slice(0, 3);
  }, [isPro, summary.achievements]);

  return (
    <div className="space-y-8" data-testid="achievements-dashboard">
      <div className="flex flex-col gap-2">
        {(['achievements', 'milestones'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setTab(option)}
            className={`w-full rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition ${
              tab === option
                ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                : 'border-black/15 text-black/60 hover:bg-black/5 dark:border-white/15 dark:text-white/60 dark:hover:bg-white/10'
            }`}
          >
            {option === 'achievements' ? 'Achievements' : 'Milestones'}
          </button>
        ))}
      </div>

      {tab === 'achievements' ? (
        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60 dark:text-white/60">
                Trophy Cabinet
              </p>
              <p className="text-sm text-black/60 dark:text-white/60">
                Unlock milestones as you complete scheduled days.
              </p>
            </div>
            <div className="text-xs text-black/50 dark:text-white/50">
              {summary.stats.totalCompletions} total completions
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <label className="sr-only" htmlFor="achievement-search">
                Search achievements
              </label>
              <input
                id="achievement-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search achievements"
                className="w-full rounded-full border border-black/15 bg-white px-4 py-2 text-sm text-black/80 placeholder:text-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:border-white/15 dark:bg-black dark:text-white/80 dark:placeholder:text-white/40 dark:focus-visible:ring-white/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'unlocked', label: 'Unlocked' },
                  { id: 'in-progress', label: 'In progress' },
                  { id: 'pro', label: 'Pro' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`w-full rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] transition sm:w-auto ${
                    filter === item.id
                      ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                      : 'border-black/15 text-black/50 hover:bg-black/5 dark:border-white/15 dark:text-white/50 dark:hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60 dark:text-white/60">
                Next Up
              </p>
              <p className="text-sm text-black/60 dark:text-white/60">
                Closest achievements to unlock.
              </p>
            </div>
            {nextUp.length === 0 ? (
              <p className="text-sm text-black/60 dark:text-white/60">
                You have unlocked everything in view.
              </p>
            ) : (
              <div className="grid items-stretch gap-3 md:grid-cols-3">
                {nextUp.map((achievement) => (
                  <AchievementCard
                    key={`next-${achievement.id}`}
                    achievement={achievement}
                    isPro={isPro}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60 dark:text-white/60">
                All Achievements
              </p>
              <p className="text-sm text-black/60 dark:text-white/60">
                Browse your full achievements catalogue.
              </p>
            </div>
            {filteredAchievements.length === 0 ? (
              <Notice>No achievements match this view.</Notice>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredAchievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} isPro={isPro} />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60 dark:text-white/60">
              Habit Milestones
            </p>
            <p className="text-sm text-black/60 dark:text-white/60">
              Track completions and perfect weeks for each active habit.
            </p>
          </div>
          {summary.milestones.length === 0 ? (
            <Notice>Create your first habit to start tracking milestones.</Notice>
          ) : (
            <div className="divide-y divide-black/10 dark:divide-white/10">
              {summary.milestones.map((timeline) => (
                <div key={timeline.habitId} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-black dark:text-white">
                      {timeline.title}
                    </p>
                    <p className="text-xs text-black/50 dark:text-white/50">
                      {timeline.completionCount} completions so far
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {timeline.milestones.map((milestone) => (
                      <MilestoneCard
                        key={`${timeline.habitId}-${milestone.id}`}
                        milestone={milestone}
                        isPro={isPro}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
