import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { getLegalPolicyDefinition, LEGAL_CHANGES_METADATA } from '../../../lib/legal/policies';
import LegalChangesPage from '../changes/page';
import PrivacyPolicyPage from '../privacy/page';
import RefundsPage from '../refunds/page';
import TermsPage from '../terms/page';

function expectMetadataValues(metadata: {
  version: string;
  effectiveDate: string;
  updatedAt: string;
}) {
  expect(screen.getByText(metadata.version)).toBeInTheDocument();
  expect(screen.getAllByText(metadata.effectiveDate).length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByText(metadata.updatedAt).length).toBeGreaterThanOrEqual(1);
}

describe('legal route metadata', () => {
  it('renders canonical metadata for privacy route', () => {
    const policy = getLegalPolicyDefinition('privacy');
    render(<PrivacyPolicyPage />);

    expect(
      screen.getByRole('heading', { name: new RegExp(policy.title, 'i') }),
    ).toBeInTheDocument();
    expectMetadataValues(policy.metadata);
  });

  it('renders canonical metadata for terms route', () => {
    const policy = getLegalPolicyDefinition('terms');
    render(<TermsPage />);

    expect(
      screen.getByRole('heading', { name: new RegExp(policy.title, 'i') }),
    ).toBeInTheDocument();
    expectMetadataValues(policy.metadata);
  });

  it('renders canonical metadata for refunds route', () => {
    const policy = getLegalPolicyDefinition('refunds');
    render(<RefundsPage />);

    expect(
      screen.getByRole('heading', { name: new RegExp(policy.title, 'i') }),
    ).toBeInTheDocument();
    expectMetadataValues(policy.metadata);
  });

  it('renders canonical metadata for changes route', () => {
    render(<LegalChangesPage />);

    expect(screen.getByRole('heading', { name: /policy changes/i })).toBeInTheDocument();
    expectMetadataValues(LEGAL_CHANGES_METADATA);
  });
});
