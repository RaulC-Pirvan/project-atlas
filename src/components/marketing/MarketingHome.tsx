import Link from 'next/link';

import { LegalSupportLinks } from '../legal/LegalSupportLinks';
import { ThemeToggle } from '../ui/ThemeToggle';

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

const workflowSteps = [
  {
    title: 'Plan once, stay on schedule',
    description:
      'Choose active weekdays once, and Atlas shows the right habits each day and in your monthly view.',
  },
  {
    title: 'Start with a focused daily list',
    description: 'Open Today to see what is due now and check habits off in seconds.',
  },
  {
    title: 'Use Calendar for context and review',
    description:
      'Scan month progress, inspect any date, and keep completion history aligned with real schedules.',
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

type MarketingHomeProps = {
  isAuthenticated?: boolean;
};

export function MarketingHome({ isAuthenticated = false }: MarketingHomeProps) {
  const atlasProLink = isAuthenticated ? '/account#pro' : '/sign-in';

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-black dark:bg-black dark:text-white">
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
                  href="/sign-in"
                  className={`text-xs font-medium uppercase tracking-[0.25em] text-black/70 transition hover:text-black dark:text-white/70 dark:hover:text-white ${focusRingClasses}`}
                >
                  Sign in
                </Link>
              </>
            )}
            <ThemeToggle className="h-8 w-8" />
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
                    href="/sign-up"
                    className={`inline-flex h-12 items-center justify-center rounded-full border border-black bg-black px-6 text-sm font-medium text-white transition hover:bg-black/90 dark:border-white dark:bg-white dark:text-black dark:hover:bg-white/90 ${focusRingClasses}`}
                  >
                    Create your account
                  </Link>
                  <Link
                    href="/sign-in"
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

        <section className="space-y-8 border-t border-black/10 pt-12 opacity-0 translate-y-3 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-safe:animate-[rise-in_0.6s_ease-out_forwards] motion-safe:[animation-delay:440ms] dark:border-white/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              One workflow across every day.
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-black/60 dark:text-white/60">
              Atlas keeps daily check-ins fast while preserving the monthly context needed for
              honest progress.
            </p>
          </div>

          <ol className="grid gap-6 md:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-2xl border border-black/10 bg-white/70 p-6 text-sm text-black/70 shadow-[0_10px_24px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-black/60 dark:text-white/70 dark:shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-black/50 dark:text-white/50">
                  Step {index + 1}
                </p>
                <h3 className="mt-2 text-base font-semibold text-black dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-3 leading-relaxed">{step.description}</p>
              </li>
            ))}
          </ol>
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
              href={isAuthenticated ? '/today' : '/sign-up'}
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
