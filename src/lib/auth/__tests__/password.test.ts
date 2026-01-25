import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from '../password';

describe('password hashing/verification', () => {
  it('hashess a password and verifies correctly', async () => {
    const pw = 'AtlasDevSeedPassword123!';
    const hash = await hashPassword(pw);

    expect(hash).toBeTypeOf('string');
    expect(hash).not.toBe(pw);

    const ok = await verifyPassword(pw, hash);
    expect(ok).toBe(true);
  });

  it('rejects incorrect password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    const ok = await verifyPassword('wrong password', hash);
    expect(ok).toBe(false);
  });
});
