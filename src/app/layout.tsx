import './globals.css';

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';

import {
  ACCENT_PRESET_STORAGE_KEY,
  ACCENT_PRESETS,
  DEFAULT_ACCENT_PRESET,
  THEME_STORAGE_KEY,
} from '../lib/theme/theme';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Project Atlas',
  description: 'Habit tracking with production-grade engineering discipline.',
};

const themeScript = `
(() => {
  try {
    const themeStorageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
    const accentStorageKey = ${JSON.stringify(ACCENT_PRESET_STORAGE_KEY)};
    const defaultAccent = ${JSON.stringify(DEFAULT_ACCENT_PRESET)};
    const allowedAccents = ${JSON.stringify(ACCENT_PRESETS)};
    const root = document.documentElement;
    const storedTheme = localStorage.getItem(themeStorageKey);
    const theme =
      storedTheme === 'light' || storedTheme === 'dark'
        ? storedTheme
        : window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';

    const storedAccent = localStorage.getItem(accentStorageKey);
    const accent = allowedAccents.includes(storedAccent) ? storedAccent : defaultAccent;

    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    root.dataset.atlasAccent = accent;
  } catch {
    // Ignore theme init errors (e.g. blocked storage).
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
