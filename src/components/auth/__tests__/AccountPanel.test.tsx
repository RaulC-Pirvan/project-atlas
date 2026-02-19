import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountPanel } from '../AccountPanel';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('AccountPanel', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockImplementation(async () => {
      return jsonResponse({
        ok: true,
        data: {
          sessions: [],
        },
      });
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

    expect(screen.getByText(/email changes require a fresh security check/i)).toBeInTheDocument();
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

  it('supports 2FA setup and enable flow', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method ?? 'GET';

      if (url === '/api/account/sessions' && method === 'GET') {
        return jsonResponse({ ok: true, data: { sessions: [] } });
      }

      if (url === '/api/account/2fa/setup' && method === 'POST') {
        return jsonResponse({
          ok: true,
          data: {
            secret: 'JBSWY3DPEHPK3PXP',
            otpauthUri: 'otpauth://totp/Project%20Atlas:user@example.com?secret=JBSWY3DPEHPK3PXP',
            qrDataUrl: 'data:image/png;base64,aGVsbG8=',
          },
        });
      }

      if (url === '/api/account/2fa/enable' && method === 'POST') {
        return jsonResponse({
          ok: true,
          data: {
            enabled: true,
            recoveryCodes: ['ABCD-EFGH-IJKL-MNOP-QRST'],
          },
        });
      }

      return jsonResponse({ ok: true, data: {} });
    });

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

    fireEvent.click(screen.getByRole('button', { name: /set up 2fa/i }));
    expect(await screen.findByLabelText(/manual setup key/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^verification code$/i), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /enable 2fa/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/account/2fa/enable', expect.any(Object));
    });
    expect(await screen.findByRole('heading', { name: /recovery codes/i })).toBeInTheDocument();
  });

  it('shows step-up modal for sensitive password changes and submits proof', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method ?? 'GET';

      if (url === '/api/account/sessions' && method === 'GET') {
        return jsonResponse({ ok: true, data: { sessions: [] } });
      }

      if (url === '/api/account/step-up/challenge' && method === 'POST') {
        return jsonResponse({
          ok: true,
          data: {
            challengeToken: 'step-up-challenge-token',
            expiresAt: '2026-02-17T12:10:00.000Z',
            methods: ['password'],
          },
        });
      }

      if (url === '/api/account/step-up/verify' && method === 'POST') {
        return jsonResponse({
          ok: true,
          data: {
            verified: true,
            action: 'account_password_change',
            method: 'password',
            verifiedAt: '2026-02-17T12:01:00.000Z',
            stepUpChallengeToken: 'step-up-challenge-token',
          },
        });
      }

      if (url === '/api/account' && method === 'PUT') {
        return jsonResponse({ ok: true, data: { ok: true } });
      }

      return jsonResponse({ ok: true, data: {} });
    });

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

    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: 'AtlasUpdatedPassword123!' },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'AtlasUpdatedPassword123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    expect(
      await screen.findByRole('heading', { name: /security verification/i }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /verify and continue/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/account/step-up/verify', expect.any(Object));
      expect(fetchMock).toHaveBeenCalledWith('/api/account', expect.any(Object));
    });
  });

  it('submits the 2FA disable flow with confirmation and verification code', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method ?? 'GET';

      if (url === '/api/account/sessions' && method === 'GET') {
        return jsonResponse({ ok: true, data: { sessions: [] } });
      }

      if (url === '/api/account/2fa/disable' && method === 'POST') {
        return jsonResponse({
          ok: true,
          data: {
            enabled: false,
          },
        });
      }

      return jsonResponse({ ok: true, data: {} });
    });

    render(
      <AccountPanel
        email="user@example.com"
        displayName="User"
        role="user"
        twoFactorEnabled
        recoveryCodesRemaining={10}
        adminTwoFactorEnforced={false}
        weekStart="mon"
        keepCompletedAtBottom
        hasPassword
      />,
    );

    fireEvent.change(screen.getByLabelText(/type "disable 2fa"/i), {
      target: { value: 'DISABLE 2FA' },
    });
    fireEvent.change(screen.getByLabelText(/^current password$/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(
      screen.getByLabelText(/verification code/i, { selector: '#disable-2fa-code' }),
      {
        target: { value: '123456' },
      },
    );
    fireEvent.click(screen.getByRole('button', { name: /disable 2fa/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/account/2fa/disable', expect.any(Object));
    });
    expect(await screen.findByText(/2fa is currently disabled/i)).toBeInTheDocument();
  });
});
