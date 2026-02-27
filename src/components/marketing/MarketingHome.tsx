import Link from 'next/link';
import type { ReactNode } from 'react';

import { buildLandingAuthTrackHref } from '../../lib/analytics/funnel';
import { buildLandingWalkthroughTrackHref } from '../../lib/analytics/landingWalkthrough';
import { LegalSupportLinks } from '../legal/LegalSupportLinks';
import { ThemeControls } from '../ui/ThemeControls';

const corePillars = [
  {
    title: 'Schedule-based by design',
    description: 'Define the weekdays once. Atlas surfaces every eligible day across the calendar.',
  },
  {
    title: 'Clear daily boundaries',
    description:
      'Check off habits for the right day and keep future dates closed until they arrive.',
  },
  {
    title: 'Streaks you can trust',
    description:
      'See your current streak and your best streak so progress feels real and motivating.',
  },
];

type WalkthroughStep = {
  id: 'create' | 'remind' | 'complete' | 'review';
  title: string;
  description: string;
  what: string;
  outcome: string;
  dailyWhy: string;
};

const walkthroughSteps: WalkthroughStep[] = [
  {
    id: 'create',
    title: 'Create your routine once',
    description: 'Add habits and weekdays one time, then let Atlas place them on the right days.',
    what: 'Use Habits to set titles, weekdays, and optional notes.',
    outcome: 'Atlas builds your due list automatically for matching calendar days.',
    dailyWhy: 'You spend less time planning and more time actually doing the habit.',
  },
  {
    id: 'remind',
    title: 'Set reminders that fit your day',
    description: 'Choose reminder times and quiet-hours behavior that match your real routine.',
    what: 'Set reminder times and daily reminder preferences from Account and Habits.',
    outcome: 'Atlas can prompt you at useful times without noisy interruptions.',
    dailyWhy: 'Helpful nudges arrive when they are useful, not when they are distracting.',
  },
  {
    id: 'complete',
    title: 'Complete habits in seconds',
    description: 'Open Today, check off what is due, and keep momentum with a clear daily list.',
    what: 'Use Today to mark habits complete for the current day.',
    outcome: 'Completions, streak context, and progress update immediately.',
    dailyWhy: 'A fast daily loop keeps consistency realistic even on busy days.',
  },
  {
    id: 'review',
    title: 'Review progress with context',
    description: 'Use Calendar to see what happened over time and inspect any specific day.',
    what: 'Open Calendar for month-level progress and per-day completion details.',
    outcome: 'Patterns are visible, including stronger days and missed rhythm.',
    dailyWhy: 'Review helps you adjust early instead of repeating unhelpful patterns.',
  },
];

const platformAreas = [
  {
    title: 'Today + Calendar workflow',
    description:
      'Switch between fast daily entry and month-level context without breaking consistency.',
  },
  {
    title: 'Insights (analytics)',
    description:
      'Review completion trends, consistency windows, and weekday performance with clear summaries.',
  },
  {
    title: 'Achievements + milestones',
    description:
      'Track streak milestones and unlocks that celebrate momentum without turning habits into noise.',
  },
  {
    title: 'Reminders',
    description: 'Set reminder times for each habit, plus quiet hours and snooze options.',
  },
  {
    title: 'Works even when your signal drops',
    description:
      'Keep checking off habits without internet, then Atlas updates everything when you are back online.',
  },
  {
    title: 'Late-night grace window (until 02:00)',
    description:
      'If you finish after midnight, you can still mark yesterday until 02:00 local time.',
  },
];

const freeVsProRows = [
  {
    feature: 'Core habit tracking (create, edit, archive, schedules)',
    free: 'Full',
    pro: 'Full',
  },
  {
    feature: 'Daily check-ins + monthly view',
    free: 'Full',
    pro: 'Full',
  },
  {
    feature: 'Streaks + late-night grace window',
    free: 'Full',
    pro: 'Full',
  },
  {
    feature: 'Works offline',
    free: 'Full',
    pro: 'Full',
  },
  {
    feature: 'Advanced insights',
    free: 'Preview',
    pro: 'Full',
  },
  {
    feature: 'Achievements + milestones',
    free: 'Baseline',
    pro: 'Expanded',
  },
  {
    feature: 'Smart reminders',
    free: 'Preview',
    pro: 'Full',
  },
];

const proCallouts = [
  {
    title: 'Advanced insights depth',
    description:
      'Go beyond snapshots with richer trends, consistency windows, and pattern-level guidance.',
  },
  {
    title: 'Expanded achievements catalogue',
    description:
      'Keep the baseline milestone loop in Free, then unlock a broader catalogue when you want more challenge.',
  },
  {
    title: 'Smarter reminder intelligence',
    description:
      'Build on reminder basics with more advanced scheduling and push-ready delivery workflows.',
  },
];

const cadenceDays = [
  { label: 'Mon', active: true },
  { label: 'Tue', active: false },
  { label: 'Wed', active: true },
  { label: 'Thu', active: false },
  { label: 'Fri', active: true },
  { label: 'Sat', active: false },
  { label: 'Sun', active: false },
];

const sampleHabits = [
  { title: 'Read 20 minutes', cadence: 'Mon / Wed / Fri' },
  { title: 'Strength training', cadence: 'Tue / Thu' },
  { title: 'Evening review', cadence: 'Sun' },
];

const focusRingClasses =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-white/40 dark:focus-visible:ring-offset-black';

function WalkthroughPreviewFrame({
  stepId,
  title,
  subtitle,
  children,
}: {
  stepId: WalkthroughStep['id'];
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <figure
      data-testid={`landing-walkthrough-preview-${stepId}`}
      className="overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-black sm:rounded-2xl"
    >
      <div
        role="img"
        aria-label={`Live ${stepId} walkthrough preview`}
        className="space-y-3 sm:space-y-4"
      >
        <div className="flex h-10 items-center border-b border-black/10 px-3 dark:border-white/10 sm:h-11 sm:px-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-black/60 dark:text-white/60 sm:text-xs sm:tracking-[0.32em]">
            Project Atlas
          </span>
        </div>

        <div className="space-y-3 px-3 pb-3 sm:space-y-4 sm:px-5 sm:pb-5">
          <div className="space-y-1">
            <p className="text-base font-semibold tracking-tight sm:text-2xl">{title}</p>
            <p className="text-xs text-black/60 dark:text-white/60 sm:text-sm">{subtitle}</p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-3 shadow-[0_8px_18px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-black/70 dark:shadow-[0_12px_28px_rgba(0,0,0,0.42)] sm:rounded-3xl sm:p-6 sm:shadow-[0_12px_30px_rgba(0,0,0,0.08)] sm:dark:shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
            {children}
          </div>
        </div>
      </div>
      <figcaption className="border-t border-black/10 px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.1em] text-black/50 dark:border-white/10 dark:text-white/50 sm:py-2 sm:text-[10px] sm:tracking-[0.12em]">
        Live component preview
      </figcaption>
    </figure>
  );
}

function WalkthroughCreatePreview() {
  const weekdayPills = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/80 dark:text-white/80">
          Create habit
        </p>
        <p className="text-xs text-black/60 dark:text-white/60 sm:text-sm">
          Build a new habit with a weekly schedule.
        </p>
      </div>
      <div className="space-y-2 sm:space-y-3">
        <p className="block text-xs font-semibold uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
          Title
        </p>
        <div className="flex h-10 w-full items-center rounded-full border border-black/15 bg-white px-3 text-xs text-black dark:border-white/15 dark:bg-black dark:text-white sm:h-11 sm:px-4 sm:text-sm">
          Read 20 minutes
        </div>
      </div>
      <div className="space-y-2 sm:space-y-3">
        <p className="block text-xs font-semibold uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
          Description
        </p>
        <div className="flex h-10 w-full items-center rounded-full border border-black/15 bg-white px-3 text-xs text-black dark:border-white/15 dark:bg-black dark:text-white sm:h-11 sm:px-4 sm:text-sm">
          Build consistency before the workday starts.
        </div>
      </div>
      <div className="space-y-2 sm:space-y-3">
        <p className="block text-xs font-semibold uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
          Active weekdays
        </p>
        <div className="flex flex-wrap gap-2">
          {weekdayPills.map((day, index) => {
            const isActive = index < 5;
            return (
              <span
                key={day}
                className={`inline-flex min-w-[52px] items-center justify-center rounded-full border px-3 text-xs font-medium sm:min-w-[60px] sm:px-4 sm:text-sm ${
                  isActive
                    ? 'h-8 border-black bg-black text-white dark:border-white dark:bg-white dark:text-black sm:h-9'
                    : 'h-8 border-black/20 bg-white text-black dark:border-white/20 dark:bg-black dark:text-white sm:h-9'
                }`}
              >
                {day}
              </span>
            );
          })}
        </div>
      </div>
      <div className="space-y-2 sm:space-y-3">
        <p className="block text-xs font-semibold uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
          Reminder times
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex h-8 items-center justify-center rounded-full border border-black/20 bg-white px-3 text-xs font-medium text-black dark:border-white/20 dark:bg-black dark:text-white sm:h-9 sm:px-4 sm:text-sm">
            07:30
          </span>
          <span className="inline-flex h-8 items-center justify-center rounded-full border border-black/20 bg-white px-3 text-xs font-medium text-black dark:border-white/20 dark:bg-black dark:text-white sm:h-9 sm:px-4 sm:text-sm">
            20:30
          </span>
        </div>
      </div>
    </div>
  );
}

function WalkthroughRemindPreview() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/80 dark:text-white/80">
          Reminders
        </p>
        <p className="text-xs text-black/60 dark:text-white/60 sm:text-sm">
          Times use your timezone (America/New_York). Reminders skip completed habits.
        </p>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <p className="block text-xs font-semibold uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
          Daily digest
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex h-8 items-center justify-center rounded-full border border-black bg-black px-3 text-xs font-medium text-white dark:border-white dark:bg-white dark:text-black sm:h-9 sm:px-4 sm:text-sm">
            On
          </span>
          <span className="inline-flex h-8 items-center justify-center rounded-full border border-black/20 bg-white px-3 text-xs font-medium text-black dark:border-white/20 dark:bg-black dark:text-white sm:h-9 sm:px-4 sm:text-sm">
            Off
          </span>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <p className="block text-xs font-semibold uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
          Digest time
        </p>
        <div className="flex h-10 max-w-[160px] items-center rounded-full border border-black/15 bg-white px-3 text-xs text-black dark:border-white/15 dark:bg-black dark:text-white sm:h-11 sm:max-w-[180px] sm:px-4 sm:text-sm">
          20:00
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <p className="block text-xs font-semibold uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
          Quiet hours
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex h-8 items-center justify-center rounded-full border border-black bg-black px-3 text-xs font-medium text-white dark:border-white dark:bg-white dark:text-black sm:h-9 sm:px-4 sm:text-sm">
            On
          </span>
          <span className="inline-flex h-8 items-center justify-center rounded-full border border-black/20 bg-white px-3 text-xs font-medium text-black dark:border-white/20 dark:bg-black dark:text-white sm:h-9 sm:px-4 sm:text-sm">
            Off
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <div className="space-y-2 sm:space-y-3">
          <p className="block text-xs font-semibold uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
            Quiet hours start
          </p>
          <div className="flex h-10 items-center rounded-full border border-black/15 bg-white px-3 text-xs text-black dark:border-white/15 dark:bg-black dark:text-white sm:h-11 sm:px-4 sm:text-sm">
            22:00
          </div>
        </div>
        <div className="space-y-2 sm:space-y-3">
          <p className="block text-xs font-semibold uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
            Quiet hours end
          </p>
          <div className="flex h-10 items-center rounded-full border border-black/15 bg-white px-3 text-xs text-black dark:border-white/15 dark:bg-black dark:text-white sm:h-11 sm:px-4 sm:text-sm">
            07:00
          </div>
        </div>
      </div>
    </div>
  );
}

function WalkthroughCompletePreview() {
  const rows = [
    { title: 'Read 20 minutes', description: 'Keep attention steady before work.', done: true },
    { title: 'Strength training', description: '30 minutes full-body session.', done: false },
    { title: 'Evening review', description: 'Write one win and one adjustment.', done: true },
  ];

  return (
    <div className="rounded-xl border border-black/10 px-3 py-3 dark:border-white/10 sm:rounded-2xl sm:px-6 sm:py-6">
      <div className="space-y-1.5 text-sm text-black/70 dark:text-white/70 sm:space-y-2.5">
        <h4 className="text-base font-semibold sm:text-lg">February 25, 2026</h4>
        <p className="text-[11px] leading-relaxed text-black/60 dark:text-white/60 sm:text-xs">
          You can complete today and yesterday until 2:00 AM local time.
        </p>
      </div>
      <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
        {rows.map((row) => (
          <li
            key={row.title}
            className={`flex min-h-[40px] items-start justify-between gap-3 rounded-xl border px-3 py-2.5 text-left sm:min-h-[44px] sm:gap-4 sm:px-4 sm:py-3 ${
              row.done
                ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                : 'border-black/10 text-black dark:border-white/10 dark:text-white'
            }`}
          >
            <div className="space-y-1">
              <p
                className={`text-xs leading-tight font-semibold sm:text-sm ${
                  row.done ? 'text-white dark:text-black' : 'text-black dark:text-white'
                }`}
              >
                {row.title}
              </p>
              <p
                className={`text-[11px] leading-relaxed sm:text-xs ${
                  row.done ? 'text-white/80 dark:text-black/70' : 'text-black/60 dark:text-white/60'
                }`}
              >
                {row.description}
              </p>
            </div>
            <div className="inline-flex items-center self-center">
              <span
                className={`inline-flex h-4 w-4 items-center justify-center rounded-full border sm:h-5 sm:w-5 ${
                  row.done
                    ? 'border-white bg-white text-black dark:border-black/30 dark:bg-black/10 dark:text-black'
                    : 'border-black/25 dark:border-white/25'
                }`}
                aria-hidden
              >
                {row.done ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-black sm:h-2 sm:w-2" />
                ) : null}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WalkthroughReviewPreview() {
  const weekdayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div>
          <h4 className="text-lg font-semibold tracking-tight sm:text-2xl">February 2026</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center rounded-full border border-black/20 px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-black/70 dark:border-white/20 dark:text-white/70 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.2em]">
            Prev
          </span>
          <span className="inline-flex items-center justify-center rounded-full border border-black/20 px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-black/70 dark:border-white/20 dark:text-white/70 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.2em]">
            Next
          </span>
        </div>
      </div>

      <div className="overflow-hidden border border-black/10 dark:border-white/10">
        <div className="grid grid-cols-7 gap-px bg-black/10 dark:bg-white/10">
          {weekdayHeaders.map((weekday) => (
            <div
              key={weekday}
              className="flex items-center justify-center bg-white px-1 py-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-black/60 sm:px-3 sm:py-2 sm:text-xs sm:tracking-[0.2em] dark:bg-black dark:text-white/60"
            >
              {weekday}
            </div>
          ))}

          {Array.from({ length: 35 }, (_, index) => {
            const day = index + 1;
            const isActive = [2, 3, 5, 8, 12, 16, 20, 25, 27, 30, 34].includes(day);
            const isToday = day === 25;
            const isOutsideMonth = day === 1 || day === 33 || day === 34 || day === 35;
            const isComplete = [3, 8, 12, 16, 20, 27].includes(day);
            return (
              <span
                key={day}
                className={`group flex min-h-[42px] flex-col justify-between px-1 py-1 text-left text-[9px] sm:min-h-[86px] sm:px-3 sm:py-2 sm:text-sm ${
                  isOutsideMonth ? 'text-black/30 dark:text-white/30' : 'text-black dark:text-white'
                } ${
                  isComplete
                    ? 'bg-[var(--color-accent-solid)] text-[color:var(--color-text-on-accent)]'
                    : 'bg-white dark:bg-black'
                } ${isToday ? 'ring-1 ring-black ring-inset dark:ring-white/60' : ''}`}
              >
                <span className="text-[11px] font-semibold sm:text-lg">
                  {isOutsideMonth ? '' : day}
                </span>
                <span className="space-y-1 sm:space-y-2">
                  <span
                    className={`relative block h-0.5 w-full rounded-full sm:h-1 ${
                      isComplete ? 'bg-black/20 dark:bg-white/20' : 'bg-black/10 dark:bg-white/10'
                    }`}
                  >
                    <span
                      className={`block h-full rounded-full ${
                        isComplete
                          ? 'w-full bg-black'
                          : isActive
                            ? 'w-1/2 bg-black dark:bg-white'
                            : 'w-0'
                      }`}
                    />
                  </span>
                  <span className="flex items-center gap-1 sm:gap-2">
                    {isActive ? (
                      <span
                        className={`h-1 w-1 rounded-full sm:h-1.5 sm:w-1.5 ${
                          isComplete ? 'bg-black' : 'bg-black dark:bg-white'
                        }`}
                      />
                    ) : (
                      <span className="h-1 w-1 sm:h-1.5 sm:w-1.5" />
                    )}
                  </span>
                </span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-[0.08em] text-black/50 dark:text-white/50 sm:gap-4 sm:text-xs sm:tracking-[0.2em]">
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-black dark:bg-white" aria-hidden="true" />
          Active habit day
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 border border-black dark:border-white" aria-hidden="true" />
          Today
        </span>
      </div>
    </div>
  );
}

function WalkthroughLivePreview({ stepId }: { stepId: WalkthroughStep['id'] }) {
  switch (stepId) {
    case 'create':
      return (
        <WalkthroughPreviewFrame
          stepId={stepId}
          title="Habits"
          subtitle="Build routines that stay with you."
        >
          <WalkthroughCreatePreview />
        </WalkthroughPreviewFrame>
      );
    case 'remind':
      return (
        <WalkthroughPreviewFrame
          stepId={stepId}
          title="Account"
          subtitle="Manage your profile and reminders."
        >
          <WalkthroughRemindPreview />
        </WalkthroughPreviewFrame>
      );
    case 'complete':
      return (
        <WalkthroughPreviewFrame
          stepId={stepId}
          title="Today"
          subtitle="Stay focused on the habits due right now."
        >
          <WalkthroughCompletePreview />
        </WalkthroughPreviewFrame>
      );
    case 'review':
      return (
        <WalkthroughPreviewFrame
          stepId={stepId}
          title="Calendar"
          subtitle="Track your habits day by day."
        >
          <WalkthroughReviewPreview />
        </WalkthroughPreviewFrame>
      );
    default:
      return null;
  }
}

type MarketingHomeProps = {
  isAuthenticated?: boolean;
};

export function MarketingHome({ isAuthenticated = false }: MarketingHomeProps) {
  const atlasProLink = '/pro?source=hero';
  const landingAuthHeaderSignInHref = buildLandingAuthTrackHref({
    source: 'header_sign_in',
    target: '/sign-in',
  });
  const landingAuthHeroPrimaryHref = buildLandingAuthTrackHref({
    source: 'hero_primary',
    target: '/sign-up',
  });
  const landingAuthHeroSecondaryHref = buildLandingAuthTrackHref({
    source: 'hero_secondary',
    target: '/sign-in',
  });
  const landingAuthFinalPrimaryHref = buildLandingAuthTrackHref({
    source: 'final_primary',
    target: '/sign-up',
  });
  const walkthroughPrimaryHref = buildLandingWalkthroughTrackHref({
    source: 'walkthrough_primary',
    target: isAuthenticated ? '/today' : '/sign-up',
  });
  const walkthroughSecondaryHref = buildLandingWalkthroughTrackHref({
    source: 'walkthrough_secondary',
    target: isAuthenticated ? '/calendar' : '/sign-in',
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-40"
      >
        <div className="h-full w-full bg-[linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:64px_64px] dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-12 sm:py-16 lg:px-12">
        <header className="flex items-center justify-between text-sm opacity-0 translate-y-3 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-safe:animate-[rise-in_0.6s_ease-out_forwards]">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.32em] text-black/60 dark:text-white/60">
              Project Atlas
            </span>
            <span className="hidden h-px w-10 bg-black/20 dark:bg-white/20 sm:inline-block" />
            <span className="hidden text-xs uppercase tracking-[0.2em] text-black/60 dark:text-white/60 sm:inline">
              Habit system
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  href="/support"
                  className={`text-xs font-medium uppercase tracking-[0.25em] text-black/70 transition hover:text-black dark:text-white/70 dark:hover:text-white ${focusRingClasses}`}
                >
                  Support
                </Link>
                <Link
                  href="/today"
                  className={`text-xs font-medium uppercase tracking-[0.25em] text-black/70 transition hover:text-black dark:text-white/70 dark:hover:text-white ${focusRingClasses}`}
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/support"
                  className={`text-xs font-medium uppercase tracking-[0.25em] text-black/70 transition hover:text-black dark:text-white/70 dark:hover:text-white ${focusRingClasses}`}
                >
                  Support
                </Link>
                <Link
                  href={landingAuthHeaderSignInHref}
                  className={`text-xs font-medium uppercase tracking-[0.25em] text-black/70 transition hover:text-black dark:text-white/70 dark:hover:text-white ${focusRingClasses}`}
                >
                  Sign in
                </Link>
              </>
            )}
            <ThemeControls compact />
          </div>
        </header>

        <section className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
          <div className="space-y-6 opacity-0 translate-y-3 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-safe:animate-[rise-in_0.6s_ease-out_forwards] motion-safe:[animation-delay:120ms]">
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-black/60 dark:text-white/60">
              Built for clarity
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Habits that follow your week, not the calendar.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-black/70 dark:text-white/70">
              Atlas brings daily check-ins, monthly progress, insights, milestones, and reminders
              into one simple habit app built for real routines.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/today"
                    className={`inline-flex h-12 items-center justify-center rounded-full border border-black bg-black px-6 text-sm font-medium text-white transition hover:bg-black/90 dark:border-white dark:bg-white dark:text-black dark:hover:bg-white/90 ${focusRingClasses}`}
                  >
                    Go to dashboard
                  </Link>
                  <Link
                    href="/calendar"
                    className={`inline-flex h-12 items-center justify-center rounded-full border border-black/20 bg-white px-6 text-sm font-medium text-black transition hover:bg-black/5 dark:border-white/20 dark:bg-black dark:text-white dark:hover:bg-white/10 ${focusRingClasses}`}
                  >
                    Open calendar
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href={landingAuthHeroPrimaryHref}
                    className={`inline-flex h-12 items-center justify-center rounded-full border border-black bg-black px-6 text-sm font-medium text-white transition hover:bg-black/90 dark:border-white dark:bg-white dark:text-black dark:hover:bg-white/90 ${focusRingClasses}`}
                  >
                    Create your account
                  </Link>
                  <Link
                    href={landingAuthHeroSecondaryHref}
                    className={`inline-flex h-12 items-center justify-center rounded-full border border-black/20 bg-white px-6 text-sm font-medium text-black transition hover:bg-black/5 dark:border-white/20 dark:bg-black dark:text-white dark:hover:bg-white/10 ${focusRingClasses}`}
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
            <p className="text-xs uppercase tracking-[0.28em] text-black/60 dark:text-white/60">
              Built for focused tracking and long-term consistency.
            </p>
          </div>

          <div className="space-y-6 opacity-0 translate-y-3 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-safe:animate-[rise-in_0.6s_ease-out_forwards] motion-safe:[animation-delay:240ms]">
            <div className="rounded-3xl border border-black/10 bg-white/90 p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-black/70 dark:shadow-[0_18px_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.28em] text-black/50 dark:text-white/50">
                  Example cadence
                </p>
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
                  Weekly
                </span>
              </div>
              <div className="mt-4 grid grid-cols-7 gap-2" role="list">
                {cadenceDays.map((day) => (
                  <div
                    key={day.label}
                    className={`flex h-9 items-center justify-center rounded-full border text-xs font-medium ${
                      day.active
                        ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                        : 'border-black/10 bg-white text-black/60 dark:border-white/15 dark:bg-black dark:text-white/60'
                    }`}
                  >
                    {day.label}
                  </div>
                ))}
              </div>
              <ul className="mt-6 space-y-3">
                {sampleHabits.map((habit) => (
                  <li
                    key={habit.title}
                    className="flex items-center justify-between text-sm text-black/80 dark:text-white/80"
                  >
                    <span className="font-medium">{habit.title}</span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
                      {habit.cadence}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white/80 p-5 text-sm text-black/80 dark:border-white/10 dark:bg-black/70 dark:text-white/80">
              <div className="flex items-center justify-between">
                <span className="font-medium">Sample day</span>
                <span className="text-xs uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
                  2 of 2 completed
                </span>
              </div>
              <ul className="mt-4 space-y-3">
                <li className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-black dark:bg-white" aria-hidden />
                  <span>Read 20 minutes</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-black dark:bg-white" aria-hidden />
                  <span>Evening review</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-8 border-t border-black/10 pt-12 opacity-0 translate-y-3 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-safe:animate-[rise-in_0.6s_ease-out_forwards] motion-safe:[animation-delay:360ms] dark:border-white/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              A foundation that stays consistent.
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-black/60 dark:text-white/60">
              Atlas keeps habits independent of dates so the calendar stays accurate, the daily view
              stays grounded, and progress stays measurable.
            </p>
          </div>

          <ul className="grid gap-6 md:grid-cols-3" role="list">
            {corePillars.map((benefit) => (
              <li
                key={benefit.title}
                className="rounded-2xl border border-black/10 bg-white/70 p-6 text-sm text-black/70 shadow-[0_10px_24px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-black/60 dark:text-white/70 dark:shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
              >
                <h3 className="text-base font-semibold text-black dark:text-white">
                  {benefit.title}
                </h3>
                <p className="mt-3 leading-relaxed">{benefit.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="landing-walkthrough-heading"
          data-testid="landing-walkthrough-section"
          className="space-y-8 border-t border-black/10 pt-12 opacity-0 translate-y-3 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-safe:animate-[rise-in_0.6s_ease-out_forwards] motion-safe:[animation-delay:440ms] dark:border-white/10"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <h2
              id="landing-walkthrough-heading"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              How Atlas works.
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-black/60 dark:text-white/60">
              Follow one simple sequence: create, remind, complete, and review. Each step is shown
              with a live component preview that adapts to viewport size.
            </p>
          </div>

          <ol
            className="grid gap-2 rounded-2xl border border-black/10 bg-white/80 p-3 text-xs uppercase tracking-[0.2em] text-black/60 dark:border-white/10 dark:bg-black/70 dark:text-white/60 sm:grid-cols-4"
            aria-label="Walkthrough step sequence"
          >
            {walkthroughSteps.map((step, index) => (
              <li
                key={`${step.id}-sequence`}
                className="rounded-xl border border-black/10 bg-white px-3 py-2 font-medium dark:border-white/10 dark:bg-black"
              >
                {index + 1}. {step.id}
              </li>
            ))}
          </ol>

          <ol className="space-y-6">
            {walkthroughSteps.map((step, index) => {
              return (
                <li
                  key={step.id}
                  data-testid={`landing-walkthrough-step-${step.id}`}
                  className="rounded-2xl border border-black/10 bg-white/75 p-4 shadow-[0_10px_24px_rgba(0,0,0,0.08)] opacity-0 translate-y-2 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-safe:animate-[rise-in_0.5s_ease-out_forwards] dark:border-white/10 dark:bg-black/60 dark:shadow-[0_10px_24px_rgba(0,0,0,0.45)] sm:rounded-3xl sm:p-6 lg:p-8"
                  style={{ animationDelay: `${120 + index * 90}ms` }}
                >
                  <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:items-start">
                    <WalkthroughLivePreview stepId={step.id} />

                    <div className="space-y-4 lg:pt-2">
                      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-black/50 dark:text-white/50">
                        Step {index + 1} - {step.id}
                      </p>
                      <h3 className="text-xl font-semibold tracking-tight text-black dark:text-white sm:text-2xl">
                        {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-black/70 dark:text-white/70">
                        {step.description}
                      </p>

                      <dl className="grid gap-2 text-sm leading-relaxed text-black/70 dark:text-white/70">
                        <div className="rounded-xl border border-black/10 bg-white/85 px-3 py-2 dark:border-white/10 dark:bg-black/70">
                          <dt className="font-medium text-black dark:text-white">Do</dt>
                          <dd>{step.what}</dd>
                        </div>
                        <div className="rounded-xl border border-black/10 bg-white/85 px-3 py-2 dark:border-white/10 dark:bg-black/70">
                          <dt className="font-medium text-black dark:text-white">Get</dt>
                          <dd>{step.outcome}</dd>
                        </div>
                        <div className="rounded-xl border border-black/10 bg-white/85 px-3 py-2 dark:border-white/10 dark:bg-black/70">
                          <dt className="font-medium text-black dark:text-white">Why</dt>
                          <dd>{step.dailyWhy}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="rounded-2xl border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-black/65">
            <p className="text-sm leading-relaxed text-black/70 dark:text-white/70">
              Start your first cycle now, then use the same flow every day.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href={walkthroughPrimaryHref}
                data-testid="landing-walkthrough-primary-cta"
                className={`inline-flex h-11 items-center justify-center rounded-full border border-black bg-black px-5 text-xs font-medium uppercase tracking-[0.2em] text-white transition hover:bg-black/90 dark:border-white dark:bg-white dark:text-black dark:hover:bg-white/90 ${focusRingClasses}`}
              >
                {isAuthenticated ? 'Go to dashboard' : 'Start free'}
              </Link>
              <Link
                href={walkthroughSecondaryHref}
                data-testid="landing-walkthrough-secondary-cta"
                className={`inline-flex h-11 items-center justify-center rounded-full border border-black/20 bg-white px-5 text-xs font-medium uppercase tracking-[0.2em] text-black transition hover:bg-black/5 dark:border-white/20 dark:bg-black dark:text-white dark:hover:bg-white/10 ${focusRingClasses}`}
              >
                {isAuthenticated ? 'Open calendar' : 'Sign in'}
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-8 border-t border-black/10 pt-12 opacity-0 translate-y-3 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-safe:animate-[rise-in_0.6s_ease-out_forwards] motion-safe:[animation-delay:520ms] dark:border-white/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Full platform coverage, same minimalist flow.
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-black/60 dark:text-white/60">
              The core loop stays simple while Atlas adds insights, reminders, and helpful
              boundaries where they add real value.
            </p>
          </div>

          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" role="list">
            {platformAreas.map((area) => (
              <li
                key={area.title}
                className="rounded-2xl border border-black/10 bg-white/70 p-6 text-sm text-black/70 shadow-[0_10px_24px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-black/60 dark:text-white/70 dark:shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
              >
                <h3 className="text-base font-semibold text-black dark:text-white">{area.title}</h3>
                <p className="mt-3 leading-relaxed">{area.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-8 border-t border-black/10 pt-12 opacity-0 translate-y-3 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-safe:animate-[rise-in_0.6s_ease-out_forwards] motion-safe:[animation-delay:600ms] dark:border-white/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Free vs Pro at a glance.
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-black/60 dark:text-white/60">
              Free gives you everything you need for consistent daily tracking. Pro is a one-time
              upgrade for deeper insight, extra milestones, and smarter reminders.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white/80 dark:border-white/10 dark:bg-black/70">
            <table className="w-full table-fixed border-collapse text-left text-sm">
              <colgroup>
                <col className="w-[58%]" />
                <col className="w-[21%]" />
                <col className="w-[21%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-black/10 dark:border-white/10">
                  <th
                    scope="col"
                    className="px-2 py-3 font-medium text-black/70 dark:text-white/70 sm:px-4"
                  >
                    Feature area
                  </th>
                  <th
                    scope="col"
                    className="px-2 py-3 text-center font-medium text-black/70 dark:text-white/70 sm:px-4"
                  >
                    Free
                  </th>
                  <th
                    scope="col"
                    className="px-2 py-3 text-center font-medium text-black/70 dark:text-white/70 sm:px-4"
                  >
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {freeVsProRows.map((row) => (
                  <tr key={row.feature} className="border-t border-black/10 dark:border-white/10">
                    <td className="px-2 py-3 text-black/75 dark:text-white/75 sm:px-4">
                      {row.feature}
                    </td>
                    <td className="px-2 py-3 text-center sm:px-4">
                      <span className="mx-auto inline-flex w-full max-w-[4.75rem] items-center justify-center rounded-full border border-black/15 bg-white px-2 py-1 text-[11px] font-medium leading-none text-black/70 dark:border-white/15 dark:bg-black dark:text-white/70 sm:max-w-[5.5rem] sm:text-xs">
                        {row.free}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center sm:px-4">
                      <span className="mx-auto inline-flex w-full max-w-[4.75rem] items-center justify-center rounded-full border border-black/20 bg-black px-2 py-1 text-[11px] font-medium leading-none text-white dark:border-white/20 dark:bg-white dark:text-black sm:max-w-[5.5rem] sm:text-xs">
                        {row.pro}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-sm leading-relaxed text-black/60 dark:text-white/60">
            One-time purchase model. No subscriptions and no ads.
          </p>
        </section>

        <section className="space-y-8 border-t border-black/10 pt-12 pb-10 opacity-0 translate-y-3 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-safe:animate-[rise-in_0.6s_ease-out_forwards] motion-safe:[animation-delay:680ms] dark:border-white/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Pro adds depth when you want it.
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-black/60 dark:text-white/60">
              Core tracking remains complete in Free. Upgrade only if advanced insight and
              motivation layers are useful for your routine.
            </p>
          </div>

          <ul className="grid gap-6 md:grid-cols-3" role="list">
            {proCallouts.map((callout) => (
              <li
                key={callout.title}
                className="rounded-2xl border border-black/10 bg-white/70 p-6 text-sm text-black/70 shadow-[0_10px_24px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-black/60 dark:text-white/70 dark:shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
              >
                <h3 className="text-base font-semibold text-black dark:text-white">
                  {callout.title}
                </h3>
                <p className="mt-3 leading-relaxed">{callout.description}</p>
              </li>
            ))}
          </ul>

          <div className="rounded-2xl border border-black/10 bg-white/80 p-5 text-sm text-black/75 dark:border-white/10 dark:bg-black/70 dark:text-white/75">
            Free always includes the complete daily tracking workflow: habits, calendar,
            completions, streaks, and grace-window support.
          </div>

          <div className="rounded-2xl border border-black/10 bg-white/80 p-5 text-sm text-black/75 dark:border-white/10 dark:bg-black/70 dark:text-white/75">
            Need help with billing, account access, bug reports, or feature requests?
            <div className="mt-3">
              <Link
                href="/support"
                className={`inline-flex h-10 items-center justify-center rounded-full border border-black/20 bg-white px-4 text-xs font-medium uppercase tracking-[0.2em] text-black transition hover:bg-black/5 dark:border-white/20 dark:bg-black dark:text-white dark:hover:bg-white/10 ${focusRingClasses}`}
              >
                Open support center
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={atlasProLink}
              className={`inline-flex h-11 items-center justify-center rounded-full border border-black bg-black px-5 text-xs font-medium uppercase tracking-[0.2em] text-white transition hover:bg-black/90 dark:border-white dark:bg-white dark:text-black dark:hover:bg-white/90 ${focusRingClasses}`}
            >
              See Atlas Pro
            </Link>
            <Link
              href={isAuthenticated ? '/today' : landingAuthFinalPrimaryHref}
              className={`inline-flex h-11 items-center justify-center rounded-full border border-black/20 bg-white px-5 text-xs font-medium uppercase tracking-[0.2em] text-black transition hover:bg-black/5 dark:border-white/20 dark:bg-black dark:text-white dark:hover:bg-white/10 ${focusRingClasses}`}
            >
              {isAuthenticated ? 'Go to dashboard' : 'Start free'}
            </Link>
          </div>
        </section>

        <footer className="border-t border-black/10 pt-8 text-sm text-black/65 dark:border-white/10 dark:text-white/65">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p>Policy and support resources</p>
            <LegalSupportLinks ariaLabel="Landing legal and support links" />
          </div>
        </footer>
      </div>
    </main>
  );
}
