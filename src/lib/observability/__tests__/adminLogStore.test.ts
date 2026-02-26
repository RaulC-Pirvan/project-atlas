import { describe, expect, it } from 'vitest';

import { getAdminLogSnapshot, recordAdminLog } from '../adminLogStore';

describe('admin log store', () => {
  it('records and returns sanitized entries', () => {
    recordAdminLog({
      message: 'api.request',
      level: 'info',
      requestId: 'req-1',
      path: '/api/health',
      status: 200,
      errorMessage: 'should-not-store',
    });

    const entry = getAdminLogSnapshot(1)[0];
    expect(entry.message).toBe('api.request');
    expect(entry.requestId).toBe('req-1');
    expect(entry.path).toBe('/api/health');
    expect((entry as unknown as { errorMessage?: string }).errorMessage).toBeUndefined();
  });

  it('enforces the snapshot limit', () => {
    recordAdminLog({ message: 'limit-test', level: 'info' });
    const entries = getAdminLogSnapshot(1);
    expect(entries).toHaveLength(1);
  });

  it('keeps only allow-listed analytics metadata and drops free-form payload keys', () => {
    recordAdminLog({
      message: 'analytics.funnel',
      level: 'info',
      event: 'landing_page_view',
      userId: 'user-1',
      source: 'hero_primary',
      target: '/sign-up',
      details: 'allowed-detail',
      email: 'user@example.com',
      habitTitle: 'Private habit name',
      token: 'secret-token',
    });

    const entry = getAdminLogSnapshot(1)[0];
    expect(entry.metadata).toBeTruthy();
    expect(entry.metadata?.event).toBe('landing_page_view');
    expect(entry.metadata?.userId).toBe('user-1');
    expect(entry.metadata?.source).toBe('hero_primary');
    expect(entry.metadata?.target).toBe('/sign-up');
    expect(entry.metadata?.details).toBe('allowed-detail');
    expect((entry.metadata as Record<string, unknown>).email).toBeUndefined();
    expect((entry.metadata as Record<string, unknown>).habitTitle).toBeUndefined();
    expect((entry.metadata as Record<string, unknown>).token).toBeUndefined();
  });
});
