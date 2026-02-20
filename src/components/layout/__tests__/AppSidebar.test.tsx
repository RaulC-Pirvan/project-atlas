import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppSidebar } from '../AppSidebar';

vi.mock('next/navigation', () => ({
  usePathname: () => '/today',
}));

describe('AppSidebar', () => {
  it('shows support form and legal entry points without legal-link overload', () => {
    render(<AppSidebar />);

    const supportLinks = screen.getAllByRole('link', { name: /support/i });
    expect(supportLinks.length).toBeGreaterThan(0);
    expect(supportLinks.some((link) => link.getAttribute('href') === '/support#contact-form')).toBe(
      true,
    );

    const legalLinks = screen.getAllByRole('link', { name: /legal/i });
    expect(legalLinks.length).toBeGreaterThan(0);
    expect(legalLinks.some((link) => link.getAttribute('href') === '/legal/changes')).toBe(true);

    expect(screen.queryByRole('link', { name: /privacy policy/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /terms of service/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /refund policy/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /more/i }));

    expect(screen.getAllByRole('link', { name: /legal/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: /privacy policy/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /terms of service/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /refund policy/i })).not.toBeInTheDocument();
  });
});
