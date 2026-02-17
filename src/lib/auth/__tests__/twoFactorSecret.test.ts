import { describe, expect, it } from 'vitest';

import {
  decryptTwoFactorSecret,
  encryptTwoFactorSecret,
  getTotpEncryptionKey,
} from '../twoFactorSecret';

const TEST_KEY_HEX = '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';

describe('twoFactorSecret', () => {
  it('encrypts and decrypts secrets with a stable key', () => {
    const encrypted = encryptTwoFactorSecret('JBSWY3DPEHPK3PXP', TEST_KEY_HEX);
    const decrypted = decryptTwoFactorSecret(encrypted, TEST_KEY_HEX);

    expect(encrypted).not.toContain('JBSWY3DPEHPK3PXP');
    expect(decrypted).toBe('JBSWY3DPEHPK3PXP');
  });

  it('validates key size', () => {
    expect(() => getTotpEncryptionKey('abcd')).toThrow('32 bytes');
  });
});
