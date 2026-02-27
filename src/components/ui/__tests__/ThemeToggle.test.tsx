import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeToggle } from '../ThemeToggle';

const createMediaQueryList = (matches = false): MediaQueryList =>
  ({
    matches,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }) as unknown as MediaQueryList;

afterEach(() => {
  document.documentElement.classList.remove('dark', 'theme-transition');
  localStorage.removeItem('atlas-theme');
  vi.restoreAllMocks();
});

describe('ThemeToggle', () => {
  it('honors stored theme preference', async () => {
    localStorage.setItem('atlas-theme', 'dark');

    render(<ThemeToggle />);

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    expect(screen.getByRole('button', { name: /switch to light theme/i })).toBeInTheDocument();
  });

  it('toggles theme and persists selection', async () => {
    const mediaQuery = createMediaQueryList(false);
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => mediaQuery),
    );

    render(<ThemeToggle />);

    const button = await screen.findByRole('button', { name: /switch to dark theme/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    expect(localStorage.getItem('atlas-theme')).toBe('dark');
  });

  it('falls back to light when stored theme value is invalid', async () => {
    localStorage.setItem('atlas-theme', 'invalid');

    render(<ThemeToggle />);

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    expect(screen.getByRole('button', { name: /switch to dark theme/i })).toBeInTheDocument();
  });

  it('adds and removes transition class on toggle', async () => {
    const mediaQuery = createMediaQueryList(false);
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => mediaQuery),
    );

    render(<ThemeToggle />);

    const button = await screen.findByRole('button', { name: /switch to dark theme/i });
    vi.useFakeTimers();
    fireEvent.click(button);

    expect(document.documentElement.classList.contains('theme-transition')).toBe(true);

    vi.advanceTimersByTime(250);

    expect(document.documentElement.classList.contains('theme-transition')).toBe(false);
    vi.useRealTimers();
  });
});
