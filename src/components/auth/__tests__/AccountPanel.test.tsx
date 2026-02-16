import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AccountPanel } from '../AccountPanel';

describe('AccountPanel', () => {
  it('hides password confirmation for email when account has no local password', () => {
    render(
      <AccountPanel
        email="oauth@example.com"
        displayName="OAuth User"
        weekStart="mon"
        keepCompletedAtBottom
        hasPassword={false}
      />,
    );

    expect(screen.getByText(/set a password before changing email/i)).toBeInTheDocument();
    expect(screen.getByText(/uses google sign-in without a local password/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/confirm password for email/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /set password first/i })).toBeDisabled();
  });

  it('shows password confirmation for email when account has local password', () => {
    render(
      <AccountPanel
        email="user@example.com"
        displayName="User"
        weekStart="mon"
        keepCompletedAtBottom
        hasPassword
      />,
    );

    expect(screen.getByText(/changing email requires password confirmation/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password for email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update email/i })).toBeEnabled();
  });
});
