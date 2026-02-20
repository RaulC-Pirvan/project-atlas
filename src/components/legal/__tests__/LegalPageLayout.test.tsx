import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LegalPageLayout } from '../LegalPageLayout';

describe('LegalPageLayout', () => {
  it('renders policy metadata and legal navigation links', () => {
    render(
      <LegalPageLayout
        title="Test legal page"
        description="Policy description"
        metadata={{
          version: '1.2.3',
          effectiveDate: '2026-02-20',
          updatedAt: '2026-02-21',
        }}
      >
        <p>Body content</p>
      </LegalPageLayout>,
    );

    expect(screen.getByRole('heading', { name: /test legal page/i })).toBeInTheDocument();
    expect(screen.getByText(/^Version$/i)).toBeInTheDocument();
    expect(screen.getByText('1.2.3')).toBeInTheDocument();
    expect(screen.getByText(/^Effective date$/i)).toBeInTheDocument();
    expect(screen.getByText('2026-02-20')).toBeInTheDocument();
    expect(screen.getByText(/^Last updated$/i)).toBeInTheDocument();
    expect(screen.getByText('2026-02-21')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /^Privacy$/i })).toHaveAttribute(
      'href',
      '/legal/privacy',
    );
    expect(screen.getByRole('link', { name: /^Terms$/i })).toHaveAttribute('href', '/legal/terms');
    expect(screen.getByRole('link', { name: /^Refunds$/i })).toHaveAttribute(
      'href',
      '/legal/refunds',
    );
    expect(screen.getByRole('link', { name: /^Changes$/i })).toHaveAttribute(
      'href',
      '/legal/changes',
    );
  });
});
