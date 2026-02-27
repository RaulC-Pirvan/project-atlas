import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AccentPresetSelect } from '../AccentPresetSelect';

afterEach(() => {
  document.documentElement.removeAttribute('data-atlas-accent');
  localStorage.removeItem('atlas-accent-preset');
});

describe('AccentPresetSelect', () => {
  it('honors stored preset on mount', async () => {
    localStorage.setItem('atlas-accent-preset', 'green');

    render(<AccentPresetSelect />);

    await waitFor(() => {
      expect(document.documentElement.dataset.atlasAccent).toBe('green');
    });

    expect(screen.getByLabelText(/accent preset/i)).toHaveValue('green');
  });

  it('falls back to gold for invalid stored values', async () => {
    localStorage.setItem('atlas-accent-preset', 'invalid');

    render(<AccentPresetSelect />);

    await waitFor(() => {
      expect(document.documentElement.dataset.atlasAccent).toBe('gold');
    });

    expect(screen.getByLabelText(/accent preset/i)).toHaveValue('gold');
  });

  it('updates root dataset and persists selection', async () => {
    render(<AccentPresetSelect />);

    const select = screen.getByLabelText(/accent preset/i);
    fireEvent.change(select, { target: { value: 'blue' } });

    await waitFor(() => {
      expect(document.documentElement.dataset.atlasAccent).toBe('blue');
    });

    expect(localStorage.getItem('atlas-accent-preset')).toBe('blue');
  });
});
