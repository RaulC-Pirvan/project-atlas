import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountPanel } from '../AccountPanel';

describe('AccountPanel', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          ok: true,
          data: {
            sessions: [],
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders security-check messaging for email updates', () => {
    render(
      <AccountPanel
        email="oauth@example.com"
        displayName="OAuth User"
        role="user"
        twoFactorEnabled={false}
        recoveryCodesRemaining={0}
        adminTwoFactorEnforced={false}
        weekStart="mon"
        keepCompletedAtBottom
        hasPassword={false}
      />,
    );

    expect(
      screen.getByText(/email changes require a fresh security check/i),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/confirm password for email/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update email/i })).toBeEnabled();
  });

  it('renders session controls section', () => {
    render(
      <AccountPanel
        email="user@example.com"
        displayName="User"
        role="user"
        twoFactorEnabled={false}
        recoveryCodesRemaining={0}
        adminTwoFactorEnforced={false}
        weekStart="mon"
        keepCompletedAtBottom
        hasPassword
      />,
    );

    expect(screen.getByText(/^active sessions$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out other devices/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out all devices/i })).toBeInTheDocument();
  });

  it('shows admin enrollment notice when admin 2FA is required', () => {
    render(
      <AccountPanel
        email="admin@example.com"
        displayName="Admin"
        role="admin"
        twoFactorEnabled={false}
        recoveryCodesRemaining={0}
        adminTwoFactorEnforced
        weekStart="mon"
        keepCompletedAtBottom
        hasPassword
      />,
    );

    expect(
      screen.getByText(/admin access requires 2fa enrollment before you can continue/i),
    ).toBeInTheDocument();
  });
});
