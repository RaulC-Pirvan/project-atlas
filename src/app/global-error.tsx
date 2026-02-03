'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
        <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-start justify-center px-6 py-12">
          <p className="text-xs uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
            Project Atlas
          </p>
          <h1 className="mt-4 text-3xl font-semibold">Something went wrong.</h1>
          <p className="mt-3 max-w-md text-sm text-black/70 dark:text-white/70">
            Please try again. If the issue persists, refresh the page or try again later.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 rounded-full border border-black px-5 py-2 text-sm font-medium transition hover:bg-black hover:text-white dark:border-white dark:hover:bg-white dark:hover:text-black"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
