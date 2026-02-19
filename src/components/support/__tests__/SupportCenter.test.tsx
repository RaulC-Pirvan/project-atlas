import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SupportCenter } from '../SupportCenter';

const fetchMock = vi.fn();

describe('SupportCenter', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders FAQ and prefilled authenticated user context', () => {
    render(
      <SupportCenter initialName="Atlas User" initialEmail="user@example.com" isAuthenticated />,
    );

    expect(screen.getByRole('heading', { name: /support center/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toHaveValue('Atlas User');
    expect(screen.getByLabelText(/email/i)).toHaveValue('user@example.com');
    expect(screen.getByText(/what should i include to get faster help/i)).toBeInTheDocument();
  });

  it('submits support form and shows success toast', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, data: { accepted: true } }),
    });

    render(<SupportCenter initialName="" initialEmail="" isAuthenticated={false} />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Atlas User' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: 'Unable to submit completion' },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'I keep getting blocked when trying to submit completions on calendar.' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /send support request/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/support/tickets');
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' });

    const payload = JSON.parse(String(options.body)) as Record<string, string>;
    expect(payload.name).toBe('Atlas User');
    expect(payload.email).toBe('user@example.com');
    expect(payload.subject).toBe('Unable to submit completion');
    expect(payload.honeypot).toBe('');

    expect(await screen.findByText(/support request sent/i)).toBeInTheDocument();
  });

  it('shows field-specific validation toast and marks invalid fields', async () => {
    render(<SupportCenter initialName="" initialEmail="" isAuthenticated={false} />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Atlas User' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: 'Bug report' },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'short' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /send support request/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      await screen.findByText(/message: please enter at least 10 characters\./i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toHaveAttribute('aria-invalid', 'true');
  });
});
