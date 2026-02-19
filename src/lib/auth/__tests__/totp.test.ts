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

  it('accepts next-step drift when skew window allows it', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const now = 1_735_000_000_000;
    const nextStepCode = generateTotpCode(secret, {
      timestampMs: now + 30_000,
    });

    const strict = verifyTotpCode(secret, nextStepCode, {
      timestampMs: now,
      skewSteps: 0,
    });
    expect(strict.valid).toBe(false);

    const tolerant = verifyTotpCode(secret, nextStepCode, {
      timestampMs: now,
      skewSteps: 1,
    });
    expect(tolerant.valid).toBe(true);
    expect(tolerant.stepOffset).toBe(1);
  });

  it('handles 30-second boundary transitions deterministically', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const atBoundary = Math.ceil(1_735_000_000_000 / 30_000) * 30_000;
    const justBeforeBoundary = atBoundary - 1;

    const previousCode = generateTotpCode(secret, {
      timestampMs: justBeforeBoundary,
    });
    const currentCode = generateTotpCode(secret, {
      timestampMs: atBoundary,
    });

    expect(previousCode).not.toBe(currentCode);

    const oldCodeAtBoundary = verifyTotpCode(secret, previousCode, {
      timestampMs: atBoundary,
      skewSteps: 1,
    });
    expect(oldCodeAtBoundary.valid).toBe(true);
    expect(oldCodeAtBoundary.stepOffset).toBe(-1);
  });

  it('rejects malformed verification input without throwing', () => {
    const secret = 'JBSWY3DPEHPK3PXP';

    const alphaCode = verifyTotpCode(secret, '12AB56', {
      timestampMs: 1_735_000_000_000,
    });
    expect(alphaCode).toEqual({ valid: false, stepOffset: null });

    const wrongLength = verifyTotpCode(secret, '12345', {
      timestampMs: 1_735_000_000_000,
    });
    expect(wrongLength).toEqual({ valid: false, stepOffset: null });
  });

  it('throws on invalid skew configuration', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const code = generateTotpCode(secret, { timestampMs: 1_735_000_000_000 });

    expect(() =>
      verifyTotpCode(secret, code, {
        timestampMs: 1_735_000_000_000,
        skewSteps: 11,
      }),
    ).toThrow('Invalid skew window.');
  });
});
