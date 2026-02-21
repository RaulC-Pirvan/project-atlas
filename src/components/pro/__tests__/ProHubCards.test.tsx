import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProFeatureHubCard } from '../ProFeatureHubCard';
import { ProManageCard } from '../ProManageCard';
import { ProPlanCard } from '../ProPlanCard';
import { ProRoadmapCard } from '../ProRoadmapCard';
import { ProValueCard } from '../ProValueCard';

describe('ProValueCard', () => {
  it('shows value proposition and upgrade CTA when free', () => {
    render(<ProValueCard isPro={false} />);

    expect(screen.getByText(/^available$/i)).toBeInTheDocument();
    expect(screen.getByText(/one-time purchase for launch/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /see checkout/i })).toHaveAttribute(
      'href',
      '/api/billing/stripe/checkout',
    );
  });

  it('shows unlocked state when pro is active', () => {
    render(<ProValueCard isPro />);

    expect(screen.getByText(/^unlocked$/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /see checkout/i })).toBeNull();
  });
});

describe('ProPlanCard', () => {
  it('shows one-time checkout path for free users', () => {
    render(<ProPlanCard isPro={false} />);

    expect(screen.getByText(/one-time pro purchase/i)).toBeInTheDocument();
    expect(screen.getByText(/no monthly or yearly subscriptions/i)).toBeInTheDocument();

    const upgrade = screen.getByRole('link', { name: /upgrade to pro/i });
    expect(upgrade).toHaveAttribute('href', '/api/billing/stripe/checkout');

    const restore = screen.getByRole('button', { name: /restore purchase/i });
    expect(restore).toBeDisabled();
  });

  it('shows active entitlement details for pro users', () => {
    render(<ProPlanCard isPro source="stripe" />);

    expect(screen.getByText(/your pro access is active/i)).toBeInTheDocument();
    expect(screen.getByText(/stripe checkout/i)).toBeInTheDocument();
    expect(screen.queryByText(/^activated$/i)).toBeNull();
    expect(screen.queryByText(/last updated/i)).toBeNull();
    expect(screen.queryByRole('link', { name: /upgrade to pro/i })).toBeNull();
  });
});

describe('ProFeatureHubCard', () => {
  it('shows preview links and checkout prompt when free', () => {
    render(<ProFeatureHubCard isPro={false} />);

    expect(screen.getByText(/^locked$/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view insights preview/i })).toHaveAttribute(
      'href',
      '/insights',
    );
    expect(screen.getByRole('link', { name: /continue to checkout/i })).toHaveAttribute(
      'href',
      '/api/billing/stripe/checkout',
    );
  });

  it('shows direct feature links when pro is active', () => {
    render(<ProFeatureHubCard isPro />);

    expect(screen.getByText(/^included$/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open insights/i })).toHaveAttribute(
      'href',
      '/insights',
    );
    expect(screen.getByRole('link', { name: /open achievements/i })).toHaveAttribute(
      'href',
      '/achievements',
    );
    expect(screen.queryByRole('link', { name: /continue to checkout/i })).toBeNull();
  });
});

describe('ProManageCard', () => {
  it('shows billing and support management links', () => {
    render(<ProManageCard isPro={false} />);

    expect(screen.getByRole('link', { name: /contact support/i })).toHaveAttribute(
      'href',
      '/support#contact-form',
    );
    expect(screen.getByRole('link', { name: /refund policy/i })).toHaveAttribute(
      'href',
      '/legal/refunds',
    );
    expect(screen.getByText(/restore purchase/i)).toBeInTheDocument();
  });
});

describe('ProRoadmapCard', () => {
  it('shows one-time non-subscription roadmap statement', () => {
    render(<ProRoadmapCard isPro={false} />);

    expect(screen.getByText(/non-goal for launch/i)).toBeInTheDocument();
    expect(screen.getByText(/no monthly\/yearly subscriptions/i)).toBeInTheDocument();
  });
});
