import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppSidebar } from '../AppSidebar';

vi.mock('next/navigation', () => ({
  usePathname: () => '/today',
}));

describe('AppSidebar', () => {
  it('keeps navigation focused and excludes legal-link overload', () => {
    render(<AppSidebar />);

    const supportLinks = screen.getAllByRole('link', { name: /support/i });
    expect(supportLinks.length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: /privacy policy/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /terms of service/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /refund policy/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /more/i }));

    expect(screen.queryByRole('link', { name: /privacy policy/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /terms of service/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /refund policy/i })).not.toBeInTheDocument();
  });
});
