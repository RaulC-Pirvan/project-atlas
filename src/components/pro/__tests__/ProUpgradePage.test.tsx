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
});
