import { afterEach, describe, expect, it, vi } from 'vitest';

import { hashSupportEmailAddress, hashSupportIpAddress } from '../ipHash';

describe('support ip hashing', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('hashes IP addresses deterministically with the same secret', () => {
    const a = hashSupportIpAddress('203.0.113.42', { secret: 'secret-a' });
    const b = hashSupportIpAddress('203.0.113.42', { secret: 'secret-a' });

    expect(a).toBe(b);
  });

  it('produces different hashes when secret changes', () => {
    const a = hashSupportIpAddress('203.0.113.42', { secret: 'secret-a' });
    const b = hashSupportIpAddress('203.0.113.42', { secret: 'secret-b' });

    expect(a).not.toBe(b);
  });

  it('normalizes emails before hashing', () => {
    const a = hashSupportEmailAddress('USER@example.com ', { secret: 'secret-a' });
    const b = hashSupportEmailAddress(' user@example.com', { secret: 'secret-a' });

    expect(a).toBe(b);
  });

  it('throws in production when SUPPORT_IP_HASH_SECRET is missing', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SUPPORT_IP_HASH_SECRET', '');

    expect(() => hashSupportIpAddress('198.51.100.1')).toThrow(
      'SUPPORT_IP_HASH_SECRET is required in production.',
    );
  });
});
