import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import LegalChangesPage from '../changes/page';
import PrivacyPolicyPage from '../privacy/page';
import RefundsPage from '../refunds/page';
import TermsPage from '../terms/page';

describe('legal pages', () => {
  it('renders privacy page metadata and legal navigation links', () => {
    render(<PrivacyPolicyPage />);

    expect(screen.getByRole('heading', { name: /privacy policy/i })).toBeInTheDocument();
    expect(screen.getByText(/^Version$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Effective date$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Last updated$/i)).toBeInTheDocument();

    const navigation = screen.getByRole('navigation', { name: /legal navigation/i });
    expect(within(navigation).getByRole('link', { name: /privacy/i })).toHaveAttribute(
      'href',
      '/legal/privacy',
    );
    expect(within(navigation).getByRole('link', { name: /terms/i })).toHaveAttribute(
      'href',
      '/legal/terms',
    );
    expect(within(navigation).getByRole('link', { name: /refunds/i })).toHaveAttribute(
      'href',
      '/legal/refunds',
    );
    expect(within(navigation).getByRole('link', { name: /changes/i })).toHaveAttribute(
      'href',
      '/legal/changes',
    );
    expect(
      screen.getByRole('heading', { name: /account deletion behavior \(hard delete\)/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/operation is irreversible/i)).toBeInTheDocument();
    expect(screen.getByText(/target a first response within 2 business days/i)).toBeInTheDocument();
  });

  it('renders locked terms clauses for jurisdiction and consumer rights', () => {
    render(<TermsPage />);

    expect(screen.getByText(/these terms are governed by romanian law/i)).toBeInTheDocument();
    expect(
      screen.getByText(/mandatory protections of your country of residence remain applicable/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/nothing in these terms limits your rights under mandatory consumer law/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/at least 16 years old/i)).toBeInTheDocument();
    expect(screen.getByText(/account and habit data are permanently removed/i)).toBeInTheDocument();
    expect(
      screen.getByText(/target first support responses within 2 business days/i),
    ).toBeInTheDocument();
  });

  it('renders refund policy carve-outs for web and app stores', () => {
    render(<RefundsPage />);

    expect(screen.getByText(/14-day goodwill refund window/i)).toBeInTheDocument();
    expect(
      screen.getByText(/apple app store purchases follow apple refund processes/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/google play purchases follow google refund processes/i),
    ).toBeInTheDocument();
  });

  it('renders policy changes route with checklist status', () => {
    render(<LegalChangesPage />);

    expect(screen.getByRole('heading', { name: /policy changes/i })).toBeInTheDocument();
    expect(screen.getByText(/initial publication baseline/i)).toBeInTheDocument();
    expect(screen.getByText(/policy update procedure/i)).toBeInTheDocument();
    expect(screen.getByText(/draft -> review -> legal sign-off -> publish/i)).toBeInTheDocument();
    expect(screen.getByText(/release-note template fields/i)).toBeInTheDocument();
    expect(screen.getByText(/^Approver$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Date$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Policy version$/i)).toBeInTheDocument();
    expect(screen.getByText(/publish status: blocked/i)).toBeInTheDocument();
  });
});
