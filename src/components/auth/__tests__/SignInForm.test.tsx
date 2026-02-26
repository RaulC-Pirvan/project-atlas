import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SignInForm } from '../SignInForm';

const signInMock = vi.fn();
const fetchMock = vi.fn();
const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

describe('SignInForm', () => {
  beforeEach(() => {
    signInMock.mockReset();
    fetchMock.mockReset();
    pushMock.mockReset();
    refreshMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows an error for invalid credentials', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        ok: false,
        error: { code: 'invalid_credentials', message: 'Invalid email or password.' },
      }),
    });

    render(<SignInForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpass' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
  });

  it('shows an error for unverified accounts', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        ok: false,
        error: {
          code: 'email_not_verified',
          message: 'Account not verified. Check your email for the verification link.',
        },
      }),
    });

    render(<SignInForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));

    expect(
      await screen.findByText('Account not verified. Check your email for the verification link.'),
    ).toBeInTheDocument();
  });

  it('signs in with server credentials flow', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, data: { ok: true } }),
    });

    render(<SignInForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com', password: 'password123' }),
      });
      expect(pushMock).toHaveBeenCalledWith('/today');
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it('transitions to 2FA verification when required and verifies sign-in', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          data: { ok: true, requiresTwoFactor: true, challengeToken: 'challenge-token' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, data: { ok: true } }),
      });

    render(<SignInForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/two-factor verification is required/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/verification code/i), {
      target: { value: '123456' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /verify and sign in/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/auth/sign-in/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken: 'challenge-token',
          method: 'totp',
          code: '123456',
        }),
      });
      expect(pushMock).toHaveBeenCalledWith('/today');
    });
  });

  it('redirects admin users to enrollment path when required', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, data: { ok: true, requiresAdminTwoFactorEnrollment: true } }),
    });

    render(<SignInForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/account?admin2fa=required');
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it('starts Google auth when the OAuth button is used', async () => {
    signInMock.mockResolvedValueOnce(undefined);

    render(<SignInForm showGoogleSignIn />);

    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith('google', { callbackUrl: '/today' });
    });
  });

  it('uses post sign-in path for credentials and OAuth callback', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, data: { ok: true } }),
    });

    render(<SignInForm showGoogleSignIn postSignInPath="/pro?intent=upgrade&source=hero" />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/pro?intent=upgrade&source=hero');
    });

    signInMock.mockResolvedValueOnce(undefined);
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith('google', {
        callbackUrl: '/pro?intent=upgrade&source=hero',
      });
    });
  });

  it('hides Google button by default and keeps credentials fallback visible', () => {
    render(<SignInForm />);

    expect(screen.queryByRole('button', { name: /continue with google/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows Google button and keeps credentials fallback visible when enabled', () => {
    render(<SignInForm showGoogleSignIn />);

    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByText(/or continue with google/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});
