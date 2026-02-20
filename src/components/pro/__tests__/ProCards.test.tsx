import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProAccountCard } from '../ProAccountCard';
import { ProPreviewCard } from '../ProPreviewCard';

describe('ProAccountCard', () => {
  it('shows upgrade and restore placeholder for free users', () => {
    render(<ProAccountCard isPro={false} />);

    const upgrade = screen.getByRole('link', { name: /upgrade to pro/i });
    expect(upgrade).toHaveAttribute('href', '/pro');

    const restore = screen.getByRole('button', { name: /restore purchase/i });
    expect(restore).toBeDisabled();
    expect(screen.queryByText(/legal and support/i)).toBeNull();
  });

  it('shows active state for pro users', () => {
    render(<ProAccountCard isPro />);

    expect(screen.getByText(/pro active/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /upgrade to pro/i })).toBeNull();
    expect(screen.queryByText(/legal and support/i)).toBeNull();
  });
});

describe('ProPreviewCard', () => {
  it('shows preview state and upgrade link for free users', () => {
    render(<ProPreviewCard isPro={false} />);

    expect(screen.getByText(/^preview$/i)).toBeInTheDocument();
    const upgrade = screen.getByRole('link', { name: /upgrade to pro/i });
    expect(upgrade).toHaveAttribute('href', '/pro');
  });

  it('shows active state for pro users', () => {
    render(<ProPreviewCard isPro />);

    expect(screen.getByText(/pro active/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /upgrade to pro/i })).toBeNull();
  });
});
