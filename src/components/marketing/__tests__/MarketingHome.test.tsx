import { render, screen, within } from '@testing-library/react';
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

    expect(screen.getByRole('link', { name: /^support$/i })).toHaveAttribute('href', '/support');
    const legalNav = screen.getByRole('navigation', { name: /landing legal and support links/i });
    expect(within(legalNav).getByRole('link', { name: /privacy policy/i })).toHaveAttribute(
      'href',
      '/legal/privacy',
    );
    expect(within(legalNav).getByRole('link', { name: /terms of service/i })).toHaveAttribute(
      'href',
      '/legal/terms',
    );
    expect(within(legalNav).getByRole('link', { name: /refund policy/i })).toHaveAttribute(
      'href',
      '/legal/refunds',
    );
    expect(within(legalNav).getByRole('link', { name: /support center/i })).toHaveAttribute(
      'href',
      '/support',
    );
  });

  it('highlights the schedule, completion, and streak benefits', () => {
    render(<MarketingHome />);

    expect(screen.getByRole('heading', { name: /schedule-based by design/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /clear daily boundaries/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /streaks you can trust/i })).toBeInTheDocument();
  });

  it('renders the expanded Phase 1 narrative sections', () => {
    render(<MarketingHome />);

    expect(
      screen.getByRole('heading', { name: /today \+ calendar workflow/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /insights \(analytics\)/i })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /achievements \+ milestones/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^reminders$/i })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /works even when your signal drops/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /late-night grace window \(until 02:00\)/i }),
    ).toBeInTheDocument();
  });

  it('renders the Free vs Pro comparison and value-led Pro callouts', () => {
    render(<MarketingHome />);

    expect(screen.getByRole('heading', { name: /free vs pro at a glance/i })).toBeInTheDocument();
    expect(
      screen.getByText(/free gives you everything you need for consistent daily tracking/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/one-time purchase model/i)).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /feature area/i })).toBeInTheDocument();
    expect(
      screen.getByText(/core habit tracking \(create, edit, archive, schedules\)/i),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: /pro adds depth when you want it/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /advanced insights depth/i })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /expanded achievements catalogue/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /smarter reminder intelligence/i }),
    ).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /see atlas pro/i })).toHaveAttribute('href', '/pro');
    expect(screen.getByRole('link', { name: /start free/i })).toHaveAttribute('href', '/sign-up');
    expect(screen.getByRole('link', { name: /open support center/i })).toHaveAttribute(
      'href',
      '/support',
    );
  });

  it('shows dashboard actions when the viewer is authenticated', () => {
    render(<MarketingHome isAuthenticated />);

    const dashboardLinks = screen.getAllByRole('link', { name: /dashboard/i });
    expect(dashboardLinks.length).toBeGreaterThanOrEqual(2);
    dashboardLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/today');
    });

    expect(screen.getByRole('link', { name: /open calendar/i })).toHaveAttribute(
      'href',
      '/calendar',
    );
    expect(screen.getByRole('link', { name: /^support$/i })).toHaveAttribute('href', '/support');
    const legalNav = screen.getByRole('navigation', { name: /landing legal and support links/i });
    expect(within(legalNav).getByRole('link', { name: /privacy policy/i })).toHaveAttribute(
      'href',
      '/legal/privacy',
    );
    expect(screen.queryByRole('link', { name: /create your account/i })).not.toBeInTheDocument();
  });
});
