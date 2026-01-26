export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="w-full max-w-2xl space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Project Atlas</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Habit tracking, engineered for correctness.
        </h1>
        <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          The product is pre-MVP. Auth foundation is in progress. Habit logic is defined by
          weekdays, not dates.
        </p>
      </section>
    </main>
  );
}
