import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MarketingHome } from '../MarketingHome';

describe('MarketingHome', () => {
  it('renders the hero headline and primary CTA', () => {
    render(<MarketingHome />);

    expect(
      screen.getByRole('heading', {
        name: /habits that follow your week, not the calendar/i,
      }),
    ).toBeInTheDocument();

    const cta = screen.getByRole('link', { name: /create your account/i });
    expect(cta).toHaveAttribute('href', '/sign-up');

    const signInLinks = screen.getAllByRole('link', { name: /sign in/i });
    expect(signInLinks.length).toBeGreaterThan(0);
    signInLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/sign-in');
    });
  });

  it('highlights the schedule, completion, and streak benefits', () => {
    render(<MarketingHome />);

    expect(screen.getByText(/schedule-based by design/i)).toBeInTheDocument();
    expect(screen.getByText(/completion with guardrails/i)).toBeInTheDocument();
    expect(screen.getByText(/streaks that stay honest/i)).toBeInTheDocument();
  });
});
