import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeControls } from '../ThemeControls';

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
  document.documentElement.removeAttribute('data-atlas-accent');
  localStorage.removeItem('atlas-theme');
  localStorage.removeItem('atlas-accent-preset');
  vi.restoreAllMocks();
});

describe('ThemeControls', () => {
  it('hides accent selector by default', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => createMediaQueryList(false)),
    );

    render(<ThemeControls />);

    expect(screen.queryByLabelText(/accent preset/i)).not.toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /switch to dark theme/i }),
    ).toBeInTheDocument();
  });

  it('propagates accent selection and preserves it across theme switching', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => createMediaQueryList(false)),
    );

    render(<ThemeControls showAccentPresetSelect />);

    const accentSelect = screen.getByRole('button', { name: /accent preset/i });
    fireEvent.click(accentSelect);
    fireEvent.click(screen.getByRole('option', { name: /red/i }));

    await waitFor(() => {
      expect(document.documentElement.dataset.atlasAccent).toBe('red');
    });
    expect(localStorage.getItem('atlas-accent-preset')).toBe('red');

    const themeButton = await screen.findByRole('button', { name: /switch to dark theme/i });
    fireEvent.click(themeButton);

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    expect(localStorage.getItem('atlas-theme')).toBe('dark');
    expect(document.documentElement.dataset.atlasAccent).toBe('red');
  });
});
