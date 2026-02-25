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
    expect(signInLinks.some((link) => link.getAttribute('href') === '/sign-in')).toBeTruthy();
    expect(
      signInLinks.some(
        (link) =>
          link.getAttribute('href') ===
          '/landing/walkthrough/track?target=%2Fsign-in&source=walkthrough_secondary',
      ),
    ).toBeTruthy();

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

    expect(screen.getByRole('heading', { name: /how atlas works/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /create your routine once/i })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /set reminders that fit your day/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /complete habits in seconds/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /review progress with context/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/step 1 - create/i)).toBeInTheDocument();
    expect(screen.getByText(/step 2 - remind/i)).toBeInTheDocument();
    expect(screen.getByText(/step 3 - complete/i)).toBeInTheDocument();
    expect(screen.getByText(/step 4 - review/i)).toBeInTheDocument();
    expect(screen.getByTestId('landing-walkthrough-step-create')).toBeInTheDocument();
    expect(screen.getByTestId('landing-walkthrough-step-remind')).toBeInTheDocument();
    expect(screen.getByTestId('landing-walkthrough-step-complete')).toBeInTheDocument();
    expect(screen.getByTestId('landing-walkthrough-step-review')).toBeInTheDocument();

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

    expect(screen.getByRole('link', { name: /see atlas pro/i })).toHaveAttribute(
      'href',
      '/pro?source=hero',
    );
    const freeLinks = screen.getAllByRole('link', { name: /start free/i });
    expect(freeLinks.length).toBeGreaterThan(0);
    expect(freeLinks.some((link) => link.getAttribute('href') === '/sign-up')).toBeTruthy();
    expect(
      freeLinks.some(
        (link) =>
          link.getAttribute('href') ===
          '/landing/walkthrough/track?target=%2Fsign-up&source=walkthrough_primary',
      ),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: /open support center/i })).toHaveAttribute(
      'href',
      '/support',
    );
  });

  it('shows dashboard actions when the viewer is authenticated', () => {
    render(<MarketingHome isAuthenticated />);

    const dashboardLinks = screen.getAllByRole('link', { name: /dashboard/i });
    expect(dashboardLinks.length).toBeGreaterThanOrEqual(2);
    expect(dashboardLinks.some((link) => link.getAttribute('href') === '/today')).toBeTruthy();
    expect(
      dashboardLinks.some(
        (link) =>
          link.getAttribute('href') ===
          '/landing/walkthrough/track?target=%2Ftoday&source=walkthrough_primary',
      ),
    ).toBeTruthy();

    const calendarLinks = screen.getAllByRole('link', { name: /open calendar/i });
    expect(calendarLinks.length).toBeGreaterThan(0);
    expect(calendarLinks.some((link) => link.getAttribute('href') === '/calendar')).toBeTruthy();
    expect(
      calendarLinks.some(
        (link) =>
          link.getAttribute('href') ===
          '/landing/walkthrough/track?target=%2Fcalendar&source=walkthrough_secondary',
      ),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: /^support$/i })).toHaveAttribute('href', '/support');
    expect(screen.getByRole('link', { name: /see atlas pro/i })).toHaveAttribute(
      'href',
      '/pro?source=hero',
    );
    const legalNav = screen.getByRole('navigation', { name: /landing legal and support links/i });
    expect(within(legalNav).getByRole('link', { name: /privacy policy/i })).toHaveAttribute(
      'href',
      '/legal/privacy',
    );
    expect(screen.queryByRole('link', { name: /create your account/i })).not.toBeInTheDocument();
  });

  it('keeps heading hierarchy and walkthrough live previews accessible', () => {
    const { container } = render(<MarketingHome />);

    const h1s = container.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);

    expect(screen.getByRole('heading', { level: 2, name: /how atlas works/i })).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /live create walkthrough preview/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /live remind walkthrough preview/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('landing-walkthrough-preview-create')).toBeInTheDocument();
    expect(screen.getByTestId('landing-walkthrough-preview-remind')).toBeInTheDocument();
    expect(screen.getByTestId('landing-walkthrough-preview-complete')).toBeInTheDocument();
    expect(screen.getByTestId('landing-walkthrough-preview-review')).toBeInTheDocument();
    expect(
      container.querySelectorAll('[data-testid^="landing-walkthrough-step-"] img'),
    ).toHaveLength(0);

    const walkthroughSection = screen.getByTestId('landing-walkthrough-section');
    expect(within(walkthroughSection).getAllByRole('heading', { level: 3 }).length).toBeGreaterThan(
      0,
    );
  });

  it('keeps walkthrough step order and Do/Get/Why content contract stable', () => {
    const { container } = render(<MarketingHome />);

    const orderedStepIds = Array.from(
      container.querySelectorAll<HTMLElement>('[data-testid^="landing-walkthrough-step-"]'),
    ).map((element) => element.dataset.testid);

    expect(orderedStepIds).toEqual([
      'landing-walkthrough-step-create',
      'landing-walkthrough-step-remind',
      'landing-walkthrough-step-complete',
      'landing-walkthrough-step-review',
    ]);

    const createStep = screen.getByTestId('landing-walkthrough-step-create');
    expect(within(createStep).getByText(/use habits to set titles, weekdays/i)).toBeInTheDocument();
    expect(
      within(createStep).getByText(/atlas builds your due list automatically/i),
    ).toBeInTheDocument();
    expect(
      within(createStep).getByText(/you spend less time planning and more time/i),
    ).toBeInTheDocument();

    const reviewStep = screen.getByTestId('landing-walkthrough-step-review');
    expect(
      within(reviewStep).getByText(/open calendar for month-level progress/i),
    ).toBeInTheDocument();
    expect(within(reviewStep).getByText(/patterns are visible/i)).toBeInTheDocument();
    expect(within(reviewStep).getByText(/review helps you adjust early/i)).toBeInTheDocument();
  });
});
