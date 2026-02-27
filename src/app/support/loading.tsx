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

export default function SupportLoading() {
  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <div
        className="mx-auto w-full max-w-5xl px-6 py-10 sm:py-14"
        aria-busy="true"
        aria-live="polite"
      >
        <header className="flex items-center justify-between">
          <Skeleton className="h-3 w-28" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-20" />
            <div className="h-9 w-9 rounded-full border border-black/10 bg-black/5 motion-safe:animate-pulse motion-reduce:animate-none dark:border-white/10 dark:bg-white/10" />
          </div>
        </header>

        <section className="mt-10 space-y-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-full max-w-3xl" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </section>

        <section className="mt-6 rounded-3xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-black">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="mt-3 h-3 w-full max-w-3xl" />
          <Skeleton className="mt-2 h-3 w-full max-w-2xl" />
          <Skeleton className="mt-2 h-3 w-full max-w-3xl" />
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <section className="space-y-5 rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black">
            <Skeleton className="h-6 w-16" />
            {Array.from({ length: 4 }, (_, index) => (
              <div key={`faq-row-${index}`} className="space-y-2">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-11/12" />
              </div>
            ))}
          </section>

          <section className="space-y-5 rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-3 w-14" />
                <div className="h-11 w-full rounded-full border border-black/10 bg-black/5 motion-safe:animate-pulse motion-reduce:animate-none dark:border-white/10 dark:bg-white/10" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-14" />
                <div className="h-11 w-full rounded-full border border-black/10 bg-black/5 motion-safe:animate-pulse motion-reduce:animate-none dark:border-white/10 dark:bg-white/10" />
              </div>
            </div>

            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <div className="h-11 w-full rounded-full border border-black/10 bg-black/5 motion-safe:animate-pulse motion-reduce:animate-none dark:border-white/10 dark:bg-white/10" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <div className="h-11 w-full rounded-full border border-black/10 bg-black/5 motion-safe:animate-pulse motion-reduce:animate-none dark:border-white/10 dark:bg-white/10" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <div className="h-32 w-full rounded-3xl border border-black/10 bg-black/5 motion-safe:animate-pulse motion-reduce:animate-none dark:border-white/10 dark:bg-white/10" />
            </div>

            <div className="h-11 w-full rounded-full border border-black/10 bg-black/5 motion-safe:animate-pulse motion-reduce:animate-none dark:border-white/10 dark:bg-white/10" />
          </section>
        </div>
      </div>
    </main>
  );
}
