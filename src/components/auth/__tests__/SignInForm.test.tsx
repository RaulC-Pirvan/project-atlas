import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SignInForm } from '../SignInForm';

const signInMock = vi.fn();

vi.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('SignInForm', () => {
  beforeEach(() => {
    signInMock.mockReset();
  });

  it('shows an error for invalid credentials', async () => {
    signInMock.mockResolvedValueOnce({ ok: false, error: 'CredentialsSignin' });

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
    signInMock.mockResolvedValueOnce({ ok: false, error: 'EMAIL_NOT_VERIFIED' });

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

  it('starts Google auth when the OAuth button is used', async () => {
    signInMock.mockResolvedValueOnce(undefined);

    render(<SignInForm showGoogleSignIn />);

    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith('google', { callbackUrl: '/today' });
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
    expect(screen.getByText(/or continue with email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});
