import { describe, expect, it } from 'vitest';

import { buildTotpOtpauthUri, generateTotpCode, generateTotpSecret, verifyTotpCode } from '../totp';

describe('totp', () => {
  it('generates base32 secrets', () => {
    const secret = generateTotpSecret();

    expect(secret).toMatch(/^[A-Z2-7]+$/);
    expect(secret.length).toBeGreaterThan(20);
  });

  it('builds a valid otpauth URI', () => {
    const uri = buildTotpOtpauthUri({
      secret: 'JBSWY3DPEHPK3PXP',
      issuer: 'Project Atlas',
      accountName: 'user@example.com',
    });

    expect(uri).toContain('otpauth://totp/');
    expect(uri).toContain('secret=JBSWY3DPEHPK3PXP');
    expect(uri).toContain('issuer=Project+Atlas');
  });

  it('matches RFC 6238 SHA1 vector for 8-digit output', () => {
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
    const code = generateTotpCode(secret, {
      timestampMs: 59_000,
      digits: 8,
      periodSeconds: 30,
      algorithm: 'sha1',
    });

    expect(code).toBe('94287082');
  });

  it('verifies valid codes with clock skew tolerance', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const now = 1_735_000_000_000;
    const previousStepCode = generateTotpCode(secret, {
      timestampMs: now - 30_000,
    });

    const strict = verifyTotpCode(secret, previousStepCode, {
      timestampMs: now,
      skewSteps: 0,
    });
    expect(strict.valid).toBe(false);

    const tolerant = verifyTotpCode(secret, previousStepCode, {
      timestampMs: now,
      skewSteps: 1,
    });
    expect(tolerant.valid).toBe(true);
    expect(tolerant.stepOffset).toBe(-1);
  });
});
