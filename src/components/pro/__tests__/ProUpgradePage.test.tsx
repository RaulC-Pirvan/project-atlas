import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProUpgradePage } from '../ProUpgradePage';

describe('ProUpgradePage', () => {
  it('shows concrete hierarchy and non-degraded free messaging', () => {
    render(<ProUpgradePage isAuthenticated={false} isPro={false} />);

    expect(
      screen.getByRole('heading', { name: /upgrade only when deeper insight will help/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /what pro adds in practice/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /free vs pro/i })).toBeInTheDocument();
    expect(screen.getByText(/free remains complete for day-to-day tracking/i)).toBeInTheDocument();
    expect(screen.getByText(/do i lose core tracking if i stay on free/i)).toBeInTheDocument();
  });

  it('renders hierarchy sections in expected order', () => {
    render(<ProUpgradePage isAuthenticated={false} isPro={false} />);

    const outcomes = screen.getByRole('heading', { name: /what pro adds in practice/i });
    const comparison = screen.getByRole('heading', { name: /free vs pro/i });
    const faq = screen.getByRole('heading', { name: /faq and trust details/i });

    expect(outcomes.compareDocumentPosition(comparison) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(comparison.compareDocumentPosition(faq) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('routes signed-out upgrade CTA through tracked pro upgrade path', () => {
    render(<ProUpgradePage isAuthenticated={false} isPro={false} />);

    const signInUpgradeLinks = screen.getAllByRole('link', { name: /sign in to upgrade/i });
    expect(
      signInUpgradeLinks.some((link) => link.getAttribute('href') === '/pro/upgrade?source=hero'),
    ).toBe(true);
    expect(screen.getByRole('link', { name: /sign in and continue/i })).toHaveAttribute(
      'href',
      '/pro/upgrade?source=comparison',
    );
  });

  it('shows signed-in and pro-active deterministic CTA states', () => {
    const { rerender } = render(<ProUpgradePage isAuthenticated isPro={false} />);

    expect(screen.getByRole('link', { name: /upgrade to pro/i })).toHaveAttribute(
      'href',
      '/pro/upgrade?source=hero',
    );

    rerender(<ProUpgradePage isAuthenticated isPro />);

    expect(screen.getByRole('link', { name: /manage pro in account/i })).toHaveAttribute(
      'href',
      '/account#pro',
    );
    expect(screen.queryByRole('link', { name: /upgrade to pro/i })).toBeNull();
  });

  it('keeps trust and refund copy aligned with legal policy', () => {
    render(<ProUpgradePage isAuthenticated={false} isPro={false} />);

    expect(
      screen.getByText(/14-day goodwill refund window from purchase date/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/apple app store purchases follow apple refund processes/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/google play purchases follow google refund processes/i),
    ).toBeInTheDocument();
    const refundLinks = screen.getAllByRole('link', { name: /refund policy/i });
    expect(refundLinks.some((link) => link.getAttribute('href') === '/legal/refunds')).toBe(true);
  });

  it('shows transparent comparison rows for free and pro framing', () => {
    render(<ProUpgradePage isAuthenticated={false} isPro={false} />);

    expect(
      screen.getByText(/core tracking \(habits, schedules, completions, calendar\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/streaks and grace window/i)).toBeInTheDocument();
    expect(screen.getByText(/advanced insights/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^full$/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/^preview$/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/^expanded$/i).length).toBeGreaterThanOrEqual(1);
  });

  it('includes accessible section semantics and reduced-motion-safe reveal classes', () => {
    const { container } = render(<ProUpgradePage isAuthenticated={false} isPro={false} />);

    expect(
      screen.getByRole('table', { name: /free and pro feature comparison/i }),
    ).toBeInTheDocument();

    const hero = screen.getByTestId('pro-hero-section');
    expect(hero.className).toContain('motion-reduce:opacity-100');
    expect(hero.className).toContain('motion-safe:animate-[rise-in_0.6s_ease-out_forwards]');

    const sections = container.querySelectorAll('section[aria-labelledby]');
    expect(sections.length).toBeGreaterThanOrEqual(4);
  });
});
