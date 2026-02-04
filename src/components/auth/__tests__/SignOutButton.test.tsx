import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SignOutButton } from '../SignOutButton';

describe('SignOutButton', () => {
  it('calls logout and redirects to sign in', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const locationMock = { href: 'http://localhost' } as Location & { href: string };
    Object.defineProperty(window, 'location', {
      value: locationMock,
      writable: true,
    });

    render(<SignOutButton />);

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
      expect(window.location.href).toBe('/sign-in');
    });

    vi.unstubAllGlobals();
  });
});
