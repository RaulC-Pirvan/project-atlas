import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HabitForm } from '../HabitForm';

describe('HabitForm', () => {
  it('requires a title', () => {
    render(<HabitForm mode="create" weekStart="mon" onSubmit={vi.fn()} resetOnSubmit />);

    fireEvent.click(screen.getByRole('button', { name: /create habit/i }));

    expect(screen.getByText('Title is required.')).toBeInTheDocument();
  });

  it('requires at least one weekday', () => {
    render(<HabitForm mode="create" weekStart="mon" onSubmit={vi.fn()} resetOnSubmit />);

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Read' } });

    const dayButtons = screen.getAllByRole('button', {
      name: /mon|tue|wed|thu|fri|sat|sun/i,
    });
    dayButtons.forEach((button) => fireEvent.click(button));

    fireEvent.click(screen.getByRole('button', { name: /create habit/i }));

    expect(screen.getByText('Select at least one weekday.')).toBeInTheDocument();
  });

  it('submits trimmed values and normalized weekdays', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<HabitForm mode="create" weekStart="mon" onSubmit={onSubmit} resetOnSubmit />);

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: '  Read  ' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: '  Focus  ' } });

    fireEvent.click(screen.getByRole('button', { name: 'Tue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Wed' }));
    fireEvent.click(screen.getByRole('button', { name: 'Thu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fri' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sat' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sun' }));

    fireEvent.click(screen.getByRole('button', { name: /create habit/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Read',
        description: 'Focus',
        weekdays: [1],
      }),
    );
  });
});
