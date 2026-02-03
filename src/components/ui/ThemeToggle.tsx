'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const storageKey = 'atlas-theme';

function withThemeTransition() {
  const root = document.documentElement;
  root.classList.add('theme-transition');
  window.setTimeout(() => {
    root.classList.remove('theme-transition');
  }, 220);
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document === 'undefined') return 'light';
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(storageKey);
    } catch {
      stored = null;
    }
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
      applyTheme(stored);
      return;
    }

    if (typeof window.matchMedia !== 'function') {
      setTheme('light');
      applyTheme('light');
      return;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const systemTheme: Theme = media.matches ? 'dark' : 'light';
    setTheme(systemTheme);
    applyTheme(systemTheme);

    const handleChange = (event: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem(storageKey)) return;
      } catch {
        return;
      }
      const nextTheme: Theme = event.matches ? 'dark' : 'light';
      setTheme(nextTheme);
      applyTheme(nextTheme);
    };

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
  const isReady = mounted;
  const buttonLabel = isReady ? `Switch to ${nextTheme} theme` : 'Toggle theme';

  return (
    <button
      type="button"
      aria-pressed={isReady ? theme === 'dark' : false}
      aria-label={buttonLabel}
      title={buttonLabel}
      onClick={() => {
        withThemeTransition();
        setTheme(nextTheme);
        try {
          localStorage.setItem(storageKey, nextTheme);
        } catch {
          // Ignore storage failures.
        }
        applyTheme(nextTheme);
      }}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/20 bg-white text-black/70 transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/20 dark:bg-black dark:text-white/70 dark:hover:bg-white/10 dark:focus-visible:ring-white/30 dark:focus-visible:ring-offset-black ${className}`.trim()}
    >
      <span className="sr-only">{buttonLabel}</span>
      {isReady ? (
        theme === 'dark' ? (
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M12 3.5v2.2M12 18.3v2.2M4.5 12h2.2M17.3 12h2.2" />
            <path d="M6.4 6.4l1.6 1.6M16 16l1.6 1.6M6.4 17.6 8 16M16 8l1.6-1.6" />
            <circle cx="12" cy="12" r="4.2" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M20.2 14.3c-1 .5-2.1.7-3.3.7-4 0-7.2-3.3-7.2-7.3 0-1.1.2-2.2.7-3.2-3.2 1.1-5.5 4.1-5.5 7.6 0 4.4 3.6 8 8 8 3.6 0 6.6-2.4 7.3-5.8z" />
          </svg>
        )
      ) : (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <circle cx="12" cy="12" r="4.2" />
        </svg>
      )}
    </button>
  );
}
