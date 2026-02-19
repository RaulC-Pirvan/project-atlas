import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requireAdminSession } from '@/lib/admin/auth';

import AdminPage from '../page';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/lib/auth/nextauth', () => ({ authOptions: {} }));
vi.mock('@/lib/admin/auth', () => ({ requireAdminSession: vi.fn() }));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedRedirect = vi.mocked(redirect);
const mockedRequireAdminSession = vi.mocked(requireAdminSession);

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects non-admin users to /today', async () => {
    mockedGetServerSession.mockResolvedValue({ user: { id: 'u1' } });
    mockedRequireAdminSession.mockRejectedValue(new Error('Not allowed'));

    await AdminPage();

    expect(mockedRedirect).toHaveBeenCalledWith('/today');
  });

  it('renders for admin users', async () => {
    mockedGetServerSession.mockResolvedValue({ user: { id: 'u1', email: 'admin@example.com' } });
    mockedRequireAdminSession.mockResolvedValue({
      userId: 'u1',
      email: 'admin@example.com',
      twoFactorEnabled: true,
    });

    const result = await AdminPage();

    expect(result).toBeTruthy();
    expect(mockedRedirect).not.toHaveBeenCalled();
  });
});
