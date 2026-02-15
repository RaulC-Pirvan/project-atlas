import { getServerSession } from 'next-auth/next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../../../lib/api/errors';
import { toggleCompletion } from '../../../../lib/api/habits/completions';
import { POST } from '../route';

const { mockedFindUnique } = vi.hoisted(() => ({
  mockedFindUnique: vi.fn(),
}));

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('../../../../lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: mockedFindUnique,
    },
  },
}));
vi.mock('../../../../lib/api/habits/completions', () => ({
  listCompletionsForDate: vi.fn(),
  toggleCompletion: vi.fn(),
}));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedToggleCompletion = vi.mocked(toggleCompletion);
const originalEnableTestEndpoints = process.env.ENABLE_TEST_ENDPOINTS;

function buildPostRequest(testNow?: string) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (testNow) {
    headers.set('x-atlas-test-now', testNow);
  }

  return new Request('https://example.com/api/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      habitId: 'habit-1',
      date: '2026-02-05',
      completed: true,
    }),
  });
}

describe('POST /api/completions', () => {
  afterEach(() => {
    process.env.ENABLE_TEST_ENDPOINTS = originalEnableTestEndpoints;
    vi.clearAllMocks();
  });

  it('applies test now override when test endpoints are enabled', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    process.env.ENABLE_TEST_ENDPOINTS = 'true';
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedFindUnique.mockResolvedValue({ timezone: 'UTC' });
    mockedToggleCompletion.mockResolvedValue({
      status: 'created',
      habitId: 'habit-1',
      date: '2026-02-05',
    });

    const response = await POST(buildPostRequest('2026-02-05T12:30:00.000Z'));

    expect(response.status).toBe(200);
    expect(mockedToggleCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        now: expect.any(Date),
      }),
    );
    const call = mockedToggleCompletion.mock.calls[0]?.[0];
    expect(call?.now?.toISOString()).toBe('2026-02-05T12:30:00.000Z');

    logSpy.mockRestore();
  });

  it('ignores test now override when test endpoints are disabled', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    delete process.env.ENABLE_TEST_ENDPOINTS;
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedFindUnique.mockResolvedValue({ timezone: 'UTC' });
    mockedToggleCompletion.mockResolvedValue({
      status: 'created',
      habitId: 'habit-1',
      date: '2026-02-05',
    });

    const response = await POST(buildPostRequest('2026-02-05T12:30:00.000Z'));

    expect(response.status).toBe(200);
    expect(mockedToggleCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        now: undefined,
      }),
    );

    logSpy.mockRestore();
  });

  it('rejects invalid test now override when test endpoints are enabled', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    process.env.ENABLE_TEST_ENDPOINTS = 'true';
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedFindUnique.mockResolvedValue({ timezone: 'UTC' });

    const response = await POST(buildPostRequest('invalid-date'));
    expect(response.status).toBe(400);
    expect(mockedToggleCompletion).not.toHaveBeenCalled();

    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('invalid_request');

    errorSpy.mockRestore();
  });

  it('returns invalid_request for blocked history dates', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    process.env.ENABLE_TEST_ENDPOINTS = 'true';
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedFindUnique.mockResolvedValue({ timezone: 'UTC' });
    mockedToggleCompletion.mockRejectedValue(
      new ApiError('invalid_request', 'Past dates cannot be completed.', 400),
    );

    const response = await POST(buildPostRequest('2026-02-12T12:30:00.000Z'));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('invalid_request');
    expect(body.error.message).toBe('Past dates cannot be completed.');

    errorSpy.mockRestore();
  });

  it('returns invalid_request for future dates', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    process.env.ENABLE_TEST_ENDPOINTS = 'true';
    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedFindUnique.mockResolvedValue({ timezone: 'UTC' });
    mockedToggleCompletion.mockRejectedValue(
      new ApiError('invalid_request', 'Cannot complete future dates.', 400),
    );

    const response = await POST(buildPostRequest('2026-02-12T12:30:00.000Z'));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('invalid_request');
    expect(body.error.message).toBe('Cannot complete future dates.');

    errorSpy.mockRestore();
  });
});
