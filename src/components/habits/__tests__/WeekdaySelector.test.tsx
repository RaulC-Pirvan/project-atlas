import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { WeekdaySelector } from '../WeekdaySelector';

describe('WeekdaySelector', () => {
  it('orders days based on weekStart', () => {
    render(<WeekdaySelector value={[]} weekStart="sun" onChange={vi.fn()} />);

    const buttons = screen.getAllByRole('button', {
      name: /mon|tue|wed|thu|fri|sat|sun/i,
    });

    expect(buttons[0]).toHaveTextContent('Sun');
  });

  it('toggles weekdays', () => {
    const onChange = vi.fn();
    render(<WeekdaySelector value={[]} weekStart="mon" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Mon' }));

    expect(onChange).toHaveBeenCalledWith([1]);
  });
});
