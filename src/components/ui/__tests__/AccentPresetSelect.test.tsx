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

    expect(screen.getByRole('button', { name: /accent preset/i })).toHaveTextContent(/green/i);
  });

  it('falls back to gold for invalid stored values', async () => {
    localStorage.setItem('atlas-accent-preset', 'invalid');

    render(<AccentPresetSelect />);

    await waitFor(() => {
      expect(document.documentElement.dataset.atlasAccent).toBe('gold');
    });

    expect(screen.getByRole('button', { name: /accent preset/i })).toHaveTextContent(/gold/i);
  });

  it('updates root dataset and persists selection', async () => {
    render(<AccentPresetSelect />);

    const trigger = screen.getByRole('button', { name: /accent preset/i });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('option', { name: /blue/i }));

    await waitFor(() => {
      expect(document.documentElement.dataset.atlasAccent).toBe('blue');
    });

    expect(screen.getByRole('button', { name: /accent preset/i })).toHaveTextContent(/blue/i);
    expect(localStorage.getItem('atlas-accent-preset')).toBe('blue');
  });

  it('supports keyboard navigation within the options list', async () => {
    render(<AccentPresetSelect />);

    const trigger = screen.getByRole('button', { name: /accent preset/i });
    fireEvent.click(trigger);

    const goldOption = screen.getByRole('option', { name: /gold/i });
    fireEvent.keyDown(goldOption, { key: 'ArrowDown' });
    fireEvent.keyDown(screen.getByRole('option', { name: /green/i }), { key: 'ArrowDown' });
    fireEvent.click(screen.getByRole('option', { name: /blue/i }));

    await waitFor(() => {
      expect(document.documentElement.dataset.atlasAccent).toBe('blue');
    });
  });
});
