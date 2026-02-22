import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountPanel } from '../AccountPanel';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function createDeferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

const baseProps = {
  email: 'user@example.com',
  displayName: 'User',
  role: 'user' as const,
  twoFactorEnabled: false,
  recoveryCodesRemaining: 0,
  adminTwoFactorEnforced: false,
  weekStart: 'mon' as const,
  keepCompletedAtBottom: true,
  hasPassword: true,
  reminderSettings: {
    dailyDigestEnabled: true,
    dailyDigestTimeMinutes: 1200,
    quietHoursEnabled: false,
    quietHoursStartMinutes: 1320,
    quietHoursEndMinutes: 420,
    snoozeDefaultMinutes: 10,
  },
  timezoneLabel: 'UTC',
};

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
        {...baseProps}
        email="oauth@example.com"
        displayName="OAuth User"
        hasPassword={false}
      />,
    );

    expect(screen.getByText(/email changes require a fresh security check/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/confirm password for email/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update email/i })).toBeEnabled();
  });

  it('renders session controls section', () => {
    render(<AccountPanel {...baseProps} />);

    expect(screen.getByText(/^active sessions$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out other devices/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out all devices/i })).toBeInTheDocument();
  });

  it('renders legal and support links section', () => {
    render(<AccountPanel {...baseProps} />);

    expect(screen.getByText(/^legal and support$/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute(
      'href',
      '/legal/privacy',
    );
    expect(screen.getByRole('link', { name: /terms of service/i })).toHaveAttribute(
      'href',
      '/legal/terms',
    );
    expect(screen.getByRole('link', { name: /refund policy/i })).toHaveAttribute(
      'href',
      '/legal/refunds',
    );
    expect(screen.getAllByRole('link', { name: /support center/i }).length).toBeGreaterThanOrEqual(
      1,
    );
  });

  it('renders a data export section with explicit user-scoped copy', () => {
    render(<AccountPanel {...baseProps} />);

    expect(screen.getByText(/^data export$/i)).toBeInTheDocument();
    expect(screen.getByText(/your data only/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download my data \(json\)/i })).toBeInTheDocument();
  });

  it('renders billing and restore section with portal + restore actions', () => {
    render(<AccountPanel {...baseProps} />);

    expect(screen.getByText(/^billing and restore$/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /manage billing \/ invoices/i })).toHaveAttribute(
      'href',
      '/api/billing/stripe/portal',
    );
    expect(screen.getByRole('button', { name: /^restore purchase$/i })).toBeInTheDocument();
    expect(screen.getByText(/previously completed purchases/i)).toBeInTheDocument();
  });

  it('renders account sections in a logical top-to-bottom order', () => {
    render(<AccountPanel {...baseProps} />);

    const orderedLabels = [
      /^display name$/i,
      /^email$/i,
      /^password$/i,
      /^week start$/i,
      /^daily ordering$/i,
      /^reminders$/i,
      /^two-factor authentication$/i,
      /^billing and restore$/i,
      /^active sessions$/i,
      /^data export$/i,
      /^delete request$/i,
      /^legal and support$/i,
    ];

    const nodes = orderedLabels.map((label) => screen.getByText(label, { selector: 'p' }));
    for (let index = 0; index < nodes.length - 1; index += 1) {
      const currentNode = nodes[index];
      const nextNode = nodes[index + 1];
      const position = currentNode.compareDocumentPosition(nextNode);
      expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it('shows pending and success feedback for data export downloads', async () => {
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    const exportRequest = createDeferred<Response>();
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method ?? 'GET';

      if (url === '/api/account/sessions' && method === 'GET') {
        return jsonResponse({ ok: true, data: { sessions: [] } });
      }

      if (url === '/api/account/exports/self' && method === 'GET') {
        return await exportRequest.promise;
      }

      return jsonResponse({ ok: true, data: {} });
    });

    render(<AccountPanel {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /download my data \(json\)/i }));
    expect(screen.getByRole('button', { name: /preparing download/i })).toBeDisabled();

    exportRequest.resolve(
      new Response(JSON.stringify({ schemaVersion: 1, generatedAt: '2026-02-20T10:00:00.000Z' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': 'attachment; filename="20260220T100000Z-atlas-data-export.json"',
        },
      }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/account/exports/self', { method: 'GET' });
    });

    expect(await screen.findByText(/data export downloaded/i)).toBeInTheDocument();
    expect(anchorClickSpy).toHaveBeenCalled();
  });

  it('shows error toast when data export download fails', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method ?? 'GET';

      if (url === '/api/account/sessions' && method === 'GET') {
        return jsonResponse({ ok: true, data: { sessions: [] } });
      }

      if (url === '/api/account/exports/self' && method === 'GET') {
        return jsonResponse(
          {
            ok: false,
            error: {
              code: 'rate_limited',
              message: 'Too many requests.',
              recovery: 'retry_later',
            },
          },
          429,
        );
      }

      return jsonResponse({ ok: true, data: {} });
    });

    render(<AccountPanel {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /download my data \(json\)/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/account/exports/self', { method: 'GET' });
    });
    expect(await screen.findByText(/too many requests/i)).toBeInTheDocument();
  });

  it('shows pending and success feedback for restore purchase flow', async () => {
    const restoreRequest = createDeferred<Response>();
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method ?? 'GET';

      if (url === '/api/account/sessions' && method === 'GET') {
        return jsonResponse({ ok: true, data: { sessions: [] } });
      }

      if (url === '/api/pro/restore' && method === 'POST') {
        return await restoreRequest.promise;
      }

      return jsonResponse({ ok: true, data: {} });
    });

    render(<AccountPanel {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /^restore purchase$/i }));
    expect(screen.getByRole('button', { name: /restoring purchase/i })).toBeDisabled();

    restoreRequest.resolve(
      jsonResponse({
        ok: true,
        data: {
          outcome: 'restored',
          entitlement: {
            isPro: true,
            status: 'active',
            source: 'stripe',
            updatedAt: '2026-02-21T09:00:00.000Z',
          },
        },
      }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/pro/restore', expect.any(Object));
    });
    expect(
      await screen.findByText(/purchase restored\. pro access is now active/i),
    ).toBeInTheDocument();
  });

  it('shows neutral restore message when no prior purchase is found', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method ?? 'GET';

      if (url === '/api/account/sessions' && method === 'GET') {
        return jsonResponse({ ok: true, data: { sessions: [] } });
      }

      if (url === '/api/pro/restore' && method === 'POST') {
        return jsonResponse({
          ok: true,
          data: {
            outcome: 'not_found',
            entitlement: {
              isPro: false,
              status: 'none',
              source: null,
              updatedAt: '2026-02-21T09:00:00.000Z',
            },
          },
        });
      }

      return jsonResponse({ ok: true, data: {} });
    });

    render(<AccountPanel {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /^restore purchase$/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/pro/restore', expect.any(Object));
    });
    expect(
      await screen.findByText(/no completed web purchase was found for this account/i),
    ).toBeInTheDocument();
  });

  it('shows admin enrollment notice when admin 2FA is required', () => {
    render(
      <AccountPanel
        {...baseProps}
        email="admin@example.com"
        displayName="Admin"
        role="admin"
        adminTwoFactorEnforced
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

    render(<AccountPanel {...baseProps} />);

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

    render(<AccountPanel {...baseProps} />);

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

    render(<AccountPanel {...baseProps} twoFactorEnabled recoveryCodesRemaining={10} />);

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
