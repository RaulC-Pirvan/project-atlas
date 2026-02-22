import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AchievementsUpgradeCard } from '../../achievements/AchievementsUpgradeCard';
import { InsightsUpgradeCard } from '../../insights/InsightsUpgradeCard';

describe('Upgrade entrypoints', () => {
  it('routes insights upgrade CTA directly to Stripe checkout', () => {
    render(<InsightsUpgradeCard />);

    const upgrade = screen.getByRole('link', { name: /upgrade to pro/i });
    expect(upgrade).toHaveAttribute('href', '/api/billing/stripe/checkout');
  });

  it('routes achievements upgrade CTA directly to Stripe checkout', () => {
    render(<AchievementsUpgradeCard />);

    const upgrade = screen.getByRole('link', { name: /upgrade to pro/i });
    expect(upgrade).toHaveAttribute('href', '/api/billing/stripe/checkout');
  });
});
