import { AppShell } from '../../components/layout/AppShell';

const weekdaySlots = Array.from({ length: 7 }, (_, index) => index);
const daySlots = Array.from({ length: 42 }, (_, index) => index);
const streakSlots = Array.from({ length: 3 }, (_, index) => index);
const habitSlots = Array.from({ length: 4 }, (_, index) => index);

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

function SkeletonPanel({ rows }: { rows: number }) {
  return (
    <div className="rounded-2xl border border-black/10 px-6 py-6 dark:border-white/10">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="mt-5 space-y-3">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={`row-${index}`}
            className="h-10 w-full rounded-xl bg-black/10 motion-safe:animate-pulse motion-reduce:animate-none dark:bg-white/10"
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}

export default function CalendarLoading() {
  return (
    <AppShell title="Calendar" subtitle="Track your habits day by day.">
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="space-y-6 lg:flex-1">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-7 w-40" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-16 rounded-full border border-black/10 bg-black/5 motion-safe:animate-pulse motion-reduce:animate-none dark:border-white/10 dark:bg-white/10" />
                  <div className="h-8 w-16 rounded-full border border-black/10 bg-black/5 motion-safe:animate-pulse motion-reduce:animate-none dark:border-white/10 dark:bg-white/10" />
                </div>
              </div>

              <div className="overflow-hidden border border-black/10 dark:border-white/10">
                <div className="grid grid-cols-7 gap-px bg-black/10 dark:bg-white/10">
                  {weekdaySlots.map((slot) => (
                    <div
                      key={`weekday-${slot}`}
                      className="flex items-center justify-center bg-white px-2 py-2 sm:px-3 dark:bg-black"
                    >
                      <Skeleton className="mx-auto h-2 w-10" />
                    </div>
                  ))}
                  {daySlots.map((slot) => (
                    <div key={`day-${slot}`} className="bg-white dark:bg-black">
                      <div className="flex min-h-[64px] flex-col justify-between px-2 py-2 sm:min-h-[86px] sm:px-3">
                        <Skeleton className="h-4 w-6" />
                        <div className="space-y-2">
                          <div className="h-1 w-full rounded-full bg-black/10 motion-safe:animate-pulse motion-reduce:animate-none dark:bg-white/10" />
                          <div className="h-1.5 w-1.5 rounded-full bg-black/10 motion-safe:animate-pulse motion-reduce:animate-none dark:bg-white/10" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.25em] text-black/50 dark:text-white/50">
              {streakSlots.map((slot) => (
                <div key={`legend-${slot}`} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-black/10 motion-safe:animate-pulse motion-reduce:animate-none dark:bg-white/10" />
                  <Skeleton className="h-2 w-24" />
                </div>
              ))}
            </div>
          </div>

          <aside className="lg:w-80">
            <div className="space-y-6">
              <SkeletonPanel rows={3} />
              <SkeletonPanel rows={habitSlots.length} />
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
