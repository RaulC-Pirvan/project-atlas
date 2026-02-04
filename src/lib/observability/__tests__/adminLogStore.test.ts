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
});
