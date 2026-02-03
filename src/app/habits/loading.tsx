import { AppShell } from '../../components/layout/AppShell';

const habitSlots = Array.from({ length: 3 }, (_, index) => index);
const weekdaySlots = Array.from({ length: 7 }, (_, index) => index);

type SkeletonProps = {
  className: string;
};

function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={`rounded-full bg-black/10 motion-safe:animate-pulse motion-reduce:animate-none dark:bg-white/10 ${className}`.trim()}
      aria-hidden="true"
    />
  );
}

export default function HabitsLoading() {
  return (
    <AppShell title="Habits" subtitle="Build routines that stay with you.">
      <div className="space-y-10" aria-busy="true" aria-live="polite">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="space-y-4">
            <div className="h-10 w-full rounded-xl border border-black/10 bg-black/5 motion-safe:animate-pulse motion-reduce:animate-none dark:border-white/10 dark:bg-white/10" />
            <div className="h-10 w-full rounded-xl border border-black/10 bg-black/5 motion-safe:animate-pulse motion-reduce:animate-none dark:border-white/10 dark:bg-white/10" />
            <div className="h-10 w-full rounded-xl border border-black/10 bg-black/5 motion-safe:animate-pulse motion-reduce:animate-none dark:border-white/10 dark:bg-white/10" />
          </div>
          <div className="flex flex-wrap gap-2">
            {weekdaySlots.map((slot) => (
              <div
                key={`weekday-${slot}`}
                className="h-8 w-16 rounded-full border border-black/10 bg-black/5 motion-safe:animate-pulse motion-reduce:animate-none dark:border-white/10 dark:bg-white/10"
                aria-hidden="true"
              />
            ))}
          </div>
          <div className="h-11 w-48 rounded-full border border-black/10 bg-black/5 motion-safe:animate-pulse motion-reduce:animate-none dark:border-white/10 dark:bg-white/10" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="h-9 w-24 rounded-full border border-black/10 bg-black/5 motion-safe:animate-pulse motion-reduce:animate-none dark:border-white/10 dark:bg-white/10" />
          </div>

          <div className="space-y-4">
            {habitSlots.map((slot) => (
              <div
                key={`habit-${slot}`}
                className="rounded-2xl border border-black/10 px-6 py-6 dark:border-white/10"
              >
                <div className="space-y-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {Array.from({ length: 3 }, (_, index) => (
                    <div
                      key={`pill-${slot}-${index}`}
                      className="h-6 w-16 rounded-full border border-black/10 bg-black/5 motion-safe:animate-pulse motion-reduce:animate-none dark:border-white/10 dark:bg-white/10"
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
